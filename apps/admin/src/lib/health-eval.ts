// 監視結果から「いつ警告メールを送るか」を決める純粋なロジック。
// 一瞬の失敗（Renderの起動待ちなど）で通知が飛び交わないよう、連続して失敗した
// ときだけ通知し、通知後は一定時間おきの再通知と、復旧通知だけを行う。

export type CheckStatus = "ok" | "fail" | "skipped";

export interface CheckResult {
  name: string;
  label: string;
  status: CheckStatus;
  detail: string;
  hint?: string;
  ms: number;
}

export interface StoredState {
  status: "ok" | "fail";
  consecutiveFailures: number;
  lastAlertAt: number | null;
}

export const ALERT_AFTER_FAILURES = 2;
export const REMIND_AFTER_MS = 6 * 60 * 60 * 1000;

export interface Evaluation {
  alerts: CheckResult[];
  recoveries: CheckResult[];
  next: Map<string, StoredState>;
}

export function evaluate(
  results: CheckResult[],
  prev: Map<string, StoredState>,
  now: number
): Evaluation {
  const alerts: CheckResult[] = [];
  const recoveries: CheckResult[] = [];
  const next = new Map(prev);

  for (const r of results) {
    if (r.status === "skipped") continue;
    const p = prev.get(r.name);

    if (r.status === "fail") {
      const wasFailing = p?.status === "fail";
      const failures = (wasFailing ? p.consecutiveFailures : 0) + 1;
      let lastAlertAt = wasFailing ? p.lastAlertAt : null;
      const reminderDue = lastAlertAt === null || now - lastAlertAt >= REMIND_AFTER_MS;
      if (failures >= ALERT_AFTER_FAILURES && reminderDue) {
        alerts.push(r);
        lastAlertAt = now;
      }
      next.set(r.name, { status: "fail", consecutiveFailures: failures, lastAlertAt });
    } else {
      // 通知を出していない一瞬の失敗からの回復は、復旧通知も出さない。
      if (p?.status === "fail" && p.lastAlertAt !== null) recoveries.push(r);
      next.set(r.name, { status: "ok", consecutiveFailures: 0, lastAlertAt: null });
    }
  }

  return { alerts, recoveries, next };
}
