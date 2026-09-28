import { escapeHtml } from "./email";

const WEBSITE_URL = "https://urara-app.onrender.com";
export const MYPAGE_URL = `${WEBSITE_URL}/account`;
const SUPPORT_PHONE = "090-5671-0985";

// 白・黒・シルバーのブランドトーンに合わせた共通メールレイアウト。見出しと
// 本文HTMLだけ渡せば、他のメールと統一された見た目になる。
function renderLayout(opts: { heading: string; bodyHtml: string; deskLabel?: string }): string {
  return `
  <div style="background:#050505;padding:32px 16px;font-family:'Hiragino Sans','Yu Gothic',sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#121212;border:1px solid #2A2A2A;border-radius:14px;padding:28px;color:#F5F5F7;">
      <p style="letter-spacing:4px;color:#E0E0E0;font-size:13px;text-align:center;margin:0 0 4px;">URARA</p>
      <h1 style="font-size:18px;text-align:center;margin:0 0 20px;color:#F5F5F7;">${escapeHtml(opts.heading)}</h1>
      ${opts.bodyHtml}
      <hr style="border:none;border-top:1px solid #2A2A2A;margin:24px 0 16px;" />
      <p style="font-size:11px;color:#6C6C70;line-height:1.8;text-align:center;">
        URARA COMPANION ${escapeHtml(opts.deskLabel ?? "カスタマーサポート")}<br />
        お電話: ${SUPPORT_PHONE}（お急ぎの方はこちら）<br />
        <a href="${WEBSITE_URL}" style="color:#8E8E93;">${WEBSITE_URL}</a>
      </p>
    </div>
  </div>`;
}

function p(text: string): string {
  return `<p style="font-size:13px;line-height:1.8;color:#8E8E93;margin:0 0 12px;">${text}</p>`;
}

function linkButton(label: string, url: string): string {
  return `<p style="text-align:center;margin:20px 0;">
    <a href="${url}" style="display:inline-block;background:#E0E0E0;color:#000000;font-weight:700;font-size:13px;padding:12px 24px;border-radius:999px;text-decoration:none;">${escapeHtml(label)}</a>
  </p>`;
}

function detailTable(rows: Array<[string, string]>): string {
  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="color:#6C6C70;padding:6px 0;font-size:13px;">${escapeHtml(label)}</td><td style="text-align:right;color:#F5F5F7;font-size:13px;">${value}</td></tr>`
    )
    .join("");
  return `<table style="width:100%;margin:16px 0;border-collapse:collapse;">${rowsHtml}</table>`;
}

const CANCELLATION_POLICY_HTML = `
  <div style="background:#1C1C1E;border-radius:10px;padding:16px;margin:16px 0;">
    <p style="font-size:12px;font-weight:700;color:#F5F5F7;margin:0 0 8px;">キャンセルポリシーに関する重要なお願い</p>
    <p style="font-size:12px;line-height:1.8;color:#8E8E93;margin:0;">
      前日20時までのキャンセルは無料です。当日のキャンセル、または無断キャンセルの場合、キャスト1名につき13,200円を申し受けます。無断キャンセルの場合、今後のご利用をお断りする場合がございます。
    </p>
  </div>`;

// ------------------------------------------------------------------
// 0. ログイン認証コード（Supabase Auth Send Email Hookから呼ばれる）
// ------------------------------------------------------------------
export function renderOtpEmail(params: { code: string; actionType: string }): string {
  const heading = params.actionType === "signup" ? "ご登録の確認コード" : "ログイン認証コード";
  return renderLayout({
    heading,
    bodyHtml: `
      ${p("以下の認証コードを、アプリの画面にご入力ください。")}
      <p style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:8px;color:#FFFFFF;background:#1C1C1E;border-radius:10px;padding:16px 28px;">${escapeHtml(params.code)}</span>
      </p>
      ${p("このコードには有効期限があります。お心当たりがない場合は、お手数ですが本メールを破棄してください。")}
    `,
  });
}

// ------------------------------------------------------------------
// 1. アカウント作成完了メール
// ------------------------------------------------------------------
export function renderAccountCreatedEmail(params: { fullName: string }): string {
  return renderLayout({
    heading: "アカウントの作成が完了いたしました",
    bodyHtml: `
      ${p(`${escapeHtml(params.fullName)} 様`)}
      ${p("この度は、URARA COMPANIONにご登録いただき、誠にありがとうございます。アカウントの作成が正常に完了いたしましたことをご報告申し上げます。")}
      ${p("URARAは、お客様の特別な宴会やディナーの席を、洗練されたキャストがより華やかに彩るためのサービスです。")}
      ${p("ご登録情報やご予約の履歴は、マイページよりいつでもご確認いただけます。")}
      ${linkButton("マイページを開く", MYPAGE_URL)}
      ${p("ご不明な点がございましたら、本メールへのご返信にてお申し付けください。")}
    `,
  });
}

// ------------------------------------------------------------------
// 2. ログインのお知らせ
// ------------------------------------------------------------------
export function renderLoginNotificationEmail(params: {
  fullName: string;
  whenLabel: string;
  device: string;
  ipAddress?: string;
}): string {
  return renderLayout({
    heading: "ログインのお知らせ",
    bodyHtml: `
      ${p(`${escapeHtml(params.fullName)} 様`)}
      ${p("お客様のアカウントへのログインを確認いたしましたのでお知らせいたします。")}
      ${detailTable([
        ["日時", escapeHtml(params.whenLabel)],
        ["ご利用端末", escapeHtml(params.device)],
        ...(params.ipAddress ? ([["IPアドレス", escapeHtml(params.ipAddress)]] as Array<[string, string]>) : []),
      ])}
      ${p("お客様ご自身による操作の場合は、本メールを破棄していただいて問題ございません。")}
      ${p(
        "<strong style=\"color:#F5F5F7;\">心当たりがない場合</strong>は、大変お手数ですが本メールへのご返信、またはお電話にて直ちにご連絡くださいませ。URARAはメールアドレス宛のワンタイムコードのみでログインする仕組みのため、パスワードの流出等ではなく、メールアカウント自体のセキュリティをご確認いただくことをお勧めいたします。"
      )}
    `,
  });
}

// ------------------------------------------------------------------
// 3. 予約の受付メール（手配中）
// ------------------------------------------------------------------
export function renderReservationReceivedEmail(params: {
  fullName: string;
  reservationId: string;
  locationName: string;
  requestedDatetimeLabel: string;
  guestCount: number;
  companionCount: number;
  estimatedTotalLabel: string;
  paymentMethodLabel: string;
  notes?: string;
}): string {
  return renderLayout({
    heading: "ご予約リクエストを承りました（現在手配中）",
    bodyHtml: `
      ${p(`${escapeHtml(params.fullName)} 様`)}
      ${p("この度は、URARA COMPANIONにご予約リクエストをいただき、誠にありがとうございます。")}
      ${p(
        '現在、キャストの手配を進めております。<strong style="color:#F5F5F7;">この時点ではまだ予約は確定しておりません。</strong>手配が完了次第、改めて「予約確定」のご案内をお送りいたします。'
      )}
      ${detailTable([
        ["予約番号", escapeHtml(params.reservationId)],
        ["ご希望日時", escapeHtml(params.requestedDatetimeLabel)],
        ["ご利用場所", escapeHtml(params.locationName)],
        ["ご利用人数", `お客様${params.guestCount}名 / キャスト${params.companionCount}名`],
        ["お支払い方法", escapeHtml(params.paymentMethodLabel)],
        ["予定お支払い合計", `<span style="color:#FFFFFF;font-weight:700;">${escapeHtml(params.estimatedTotalLabel)}</span>`],
      ])}
      ${
        params.notes
          ? `<p style="font-size:12px;color:#6C6C70;margin:16px 0 4px;">ご要望・連絡事項</p>
             <p style="font-size:13px;color:#F5F5F7;white-space:pre-wrap;margin:0 0 12px;">${escapeHtml(params.notes)}</p>`
          : ""
      }
      ${CANCELLATION_POLICY_HTML}
      ${linkButton("マイページで手配状況を確認", MYPAGE_URL)}
    `,
  });
}

// ------------------------------------------------------------------
// 4. 予約確定メール
// ------------------------------------------------------------------
export function renderReservationConfirmedEmail(params: {
  fullName: string;
  reservationId: string;
  locationName: string;
  locationAddress?: string;
  requestedDatetimeLabel: string;
  guestCount: number;
  companionCount: number;
  totalLabel: string;
  paymentMethodLabel: string;
}): string {
  return renderLayout({
    heading: "ご予約が確定いたしました",
    bodyHtml: `
      ${p(`${escapeHtml(params.fullName)} 様`)}
      ${p("URARA COMPANIONをご利用いただき、誠にありがとうございます。ご依頼いただいておりました手配が完了し、ご予約が<strong style=\"color:#F5F5F7;\">確定</strong>いたしましたことをご報告申し上げます。")}
      ${detailTable([
        ["予約番号", escapeHtml(params.reservationId)],
        ["ご予約日時", escapeHtml(params.requestedDatetimeLabel)],
        ["ご利用場所", escapeHtml(params.locationName) + (params.locationAddress ? `<br/><span style="color:#6C6C70;">${escapeHtml(params.locationAddress)}</span>` : "")],
        ["ご利用人数", `お客様${params.guestCount}名 / キャスト${params.companionCount}名`],
        ["お支払い方法", escapeHtml(params.paymentMethodLabel)],
        ["お支払い合計", `<span style="color:#FFFFFF;font-weight:700;">${escapeHtml(params.totalLabel)}</span>`],
      ])}
      ${p("ご予約時間の少し前に、手配されたキャストがご指定の場所・お席へ伺います。到着の遅れやご変更等がございましたら、速やかにコンシェルジュデスクまでご連絡をお願いいたします。")}
      ${CANCELLATION_POLICY_HTML}
      ${linkButton("マイページで予約詳細を確認", `${WEBSITE_URL}/reservation/${params.reservationId}`)}
      ${p("お客様にとって、思い出に残る素晴らしいひとときとなりますよう、心よりお祈り申し上げます。")}
    `,
    deskLabel: "コンシェルジュデスク",
  });
}
