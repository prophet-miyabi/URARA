const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.NOTIFY_FROM_ADDRESS ?? "URARA <onboarding@resend.dev>";

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// 送信元(info@urara.tech)は送信専用で受信ボックスが無いため、お客様が返信すると
// 運営に届くよう、返信先を運営の通知先一覧(replyTo)に向ける。呼び出し側が
// notification-settings.tsのgetOperatorEmails()で取得した一覧を渡す想定。
export async function sendEmail(to: string, subject: string, html: string, replyTo?: string[]): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not configured; skipping email send", to);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      subject,
      html,
      ...(replyTo && replyTo.length > 0 ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    console.error("Resend send failed", to, res.status, errorText);
  }
  return res.ok;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
