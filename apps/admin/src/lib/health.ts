import { sendEmail } from "./email";
import { renderAlertEmail } from "./email-templates";
import { formatDateTimeJST } from "./format";
import { evaluate, type CheckResult, type CheckStatus, type StoredState } from "./health-eval";
import { getAlertRecipients } from "./notification-settings";
import { supabaseAdmin } from "./supabase-admin";

const APP_URL = process.env.APP_PUBLIC_URL ?? "https://urara-app.onrender.com";
const FETCH_TIMEOUT_MS = 8000;

interface Outcome {
  status: CheckStatus;
  detail: string;
}
const ok = (detail: string): Outcome => ({ status: "ok", detail });
const fail = (detail: string): Outcome => ({ status: "fail", detail });
const skipped = (detail: string): Outcome => ({ status: "skipped", detail });

async function timed(
  name: string,
  label: string,
  hint: string,
  run: () => Promise<Outcome>
): Promise<CheckResult> {
  const startedAt = Date.now();
  let outcome: Outcome;
  try {
    outcome = await run();
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    outcome = fail(timedOut ? "応答がありません（タイムアウト）" : err instanceof Error ? err.message : String(err));
  }
  return { name, label, hint, ms: Date.now() - startedAt, ...outcome };
}

const signal = () => AbortSignal.timeout(FETCH_TIMEOUT_MS);

async function checkApp(): Promise<Outcome> {
  const res = await fetch(`${APP_URL}/`, { signal: signal(), cache: "no-store" });
  return res.ok ? ok(`HTTP ${res.status}`) : fail(`HTTP ${res.status}`);
}

async function checkDatabase(): Promise<Outcome> {
  if (!supabaseAdmin) return fail("Supabaseの接続情報が設定されていません");
  const { error } = await supabaseAdmin
    .from("reservations")
    .select("id", { count: "exact", head: true });
  return error ? fail(error.message) : ok("予約データを参照できます");
}

async function checkAuth(): Promise<Outcome> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail("Supabaseの接続情報が設定されていません");
  const res = await fetch(`${url}/auth/v1/health`, { headers: { apikey: key }, signal: signal() });
  return res.ok ? ok(`HTTP ${res.status}`) : fail(`HTTP ${res.status}`);
}

async function checkPlaces(): Promise<Outcome> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return skipped("GOOGLE_PLACES_API_KEY が未設定のため確認していません");
  // APIキーはドメイン制限付きなので、アプリと同じRefererを付けて呼ぶ。
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, Referer: `${APP_URL}/` },
    body: JSON.stringify({ input: "Tokyo Station" }),
    signal: signal(),
  });
  if (res.ok) return ok(`HTTP ${res.status}`);
  const body = (await res.json().catch(() => null)) as { error?: { status?: string; message?: string } } | null;
  const reason = body?.error ? `${body.error.status ?? ""} ${body.error.message ?? ""}`.trim() : "";
  return fail(`HTTP ${res.status} ${reason}`.trim().slice(0, 200));
}

async function checkEmail(): Promise<Outcome> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return fail("RESEND_API_KEY が設定されていません");
  const from = process.env.NOTIFY_FROM_ADDRESS ?? "";
  const domain = from.match(/@([^>\s]+)/)?.[1];
  if (!domain || domain === "resend.dev") return skipped("独自ドメインの送信元が未設定のため確認していません");

  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${key}` },
    signal: signal(),
  });
  // 送信専用のAPIキーはドメイン一覧を読めない。異常ではないので確認対象から外す。
  if (res.status === 401 || res.status === 403) return skipped("送信専用のAPIキーのため、ドメインの状態は確認できません");
  if (!res.ok) return fail(`HTTP ${res.status}`);
  const body = (await res.json()) as { data?: Array<{ name: string; status: string }> };
  const found = body.data?.find((d) => d.name === domain);
  if (!found) return fail(`${domain} がResendに登録されていません`);
  return found.status === "verified" ? ok(`${domain}: verified`) : fail(`${domain}: ${found.status}`);
}

export async function runChecks(): Promise<CheckResult[]> {
  return Promise.all([
    timed("app", "お客様向けサイト", "Renderのurara-appのデプロイ状況を確認してください。", checkApp),
    timed("database", "データベース", "Supabaseのプロジェクトが一時停止していないか確認してください。", checkDatabase),
    timed("auth", "ログイン（Supabase Auth）", "Supabaseのプロジェクトが一時停止していないか確認してください。", checkAuth),
    timed(
      "places",
      "Googleマップ・場所検索",
      "Google Cloudの請求先アカウントのリンクと、APIキーの制限を確認してください。",
      checkPlaces
    ),
    timed("email", "メール送信（Resend）", "Resendのドメイン認証とAPIキーを確認してください。", checkEmail),
  ]);
}

// 通知の重複を防ぐための状態。通常はDB（system_health）に保存するが、テーブルを
// まだ作っていない・DBが落ちている場合は、プロセス内メモリで代用する。
let memoryState = new Map<string, StoredState>();

async function loadState(): Promise<Map<string, StoredState> | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("system_health")
    .select("name, status, consecutive_failures, last_alert_at");
  if (error || !data) return null;
  return new Map(
    data.map((row) => [
      row.name as string,
      {
        status: row.status as "ok" | "fail",
        consecutiveFailures: row.consecutive_failures as number,
        lastAlertAt: row.last_alert_at ? Date.parse(row.last_alert_at as string) : null,
      },
    ])
  );
}

async function saveState(next: Map<string, StoredState>, results: CheckResult[]): Promise<void> {
  if (!supabaseAdmin) return;
  const rows = results
    .filter((r) => r.status !== "skipped" && next.has(r.name))
    .map((r) => {
      const s = next.get(r.name)!;
      return {
        name: r.name,
        status: s.status,
        consecutive_failures: s.consecutiveFailures,
        last_alert_at: s.lastAlertAt ? new Date(s.lastAlertAt).toISOString() : null,
        detail: r.detail,
        updated_at: new Date().toISOString(),
      };
    });
  const { error } = await supabaseAdmin.from("system_health").upsert(rows);
  if (error) console.error("system_health save failed", error.message);
}

async function sendToAll(recipients: string[], subject: string, html: string): Promise<number> {
  const results = await Promise.all(recipients.map((to) => sendEmail(to, subject, html)));
  return results.filter(Boolean).length;
}

function toItems(results: CheckResult[]) {
  return results.map((r) => ({ label: r.label, detail: r.detail, hint: r.hint }));
}

export interface HealthRunResult {
  results: CheckResult[];
  alerted: string[];
  recovered: string[];
  recipients: string[];
  dryRun: boolean;
}

export async function runHealthCheck(opts: { dryRun?: boolean } = {}): Promise<HealthRunResult> {
  const results = await runChecks();
  const recipients = await getAlertRecipients();
  if (opts.dryRun) return { results, alerted: [], recovered: [], recipients, dryRun: true };

  const dbState = await loadState();
  const prev = dbState ?? memoryState;
  const { alerts, recoveries, next } = evaluate(results, prev, Date.now());
  const whenLabel = formatDateTimeJST(new Date().toISOString());

  if (alerts.length > 0) {
    const sent = await sendToAll(
      recipients,
      `【URARA・障害】${alerts.map((a) => a.label).join("、")}に異常があります`,
      renderAlertEmail({ kind: "failure", items: toItems(alerts), whenLabel })
    );
    // 誰にも届かなかった場合は「通知済み」にせず、次回の実行で再試行する。
    if (sent === 0) {
      for (const a of alerts) {
        const s = next.get(a.name);
        if (s) next.set(a.name, { ...s, lastAlertAt: prev.get(a.name)?.lastAlertAt ?? null });
      }
    }
  }

  if (recoveries.length > 0) {
    await sendToAll(
      recipients,
      `【URARA・復旧】${recoveries.map((r) => r.label).join("、")}が復旧しました`,
      renderAlertEmail({ kind: "recovery", items: toItems(recoveries), whenLabel })
    );
  }

  memoryState = next;
  await saveState(next, results);

  return {
    results,
    alerted: alerts.map((a) => a.name),
    recovered: recoveries.map((r) => r.name),
    recipients,
    dryRun: false,
  };
}

// 警告メールが管理者に届くかを、実際の障害を待たずに確認するためのテスト送信。
export async function sendTestAlert(): Promise<{ recipients: string[]; delivered: number }> {
  const recipients = await getAlertRecipients();
  const delivered = await sendToAll(
    recipients,
    "【URARA・テスト】障害警告メールの送信テスト",
    renderAlertEmail({
      kind: "test",
      items: [{ label: "テスト送信", detail: "これは動作確認のためのメールです。対応は不要です。" }],
      whenLabel: formatDateTimeJST(new Date().toISOString()),
    })
  );
  return { recipients, delivered };
}
