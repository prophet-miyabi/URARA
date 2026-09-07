import { NextResponse } from "next/server";
import { issueCode } from "@/lib/email-otp";
import { corsHeaders, sendEmail } from "@/lib/email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400, headers: corsHeaders() });
  }

  const email = body.email?.trim() ?? "";
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "メールアドレスの形式が正しくありません" },
      { status: 400, headers: corsHeaders() }
    );
  }

  if (!process.env.EMAIL_VERIFICATION_SECRET) {
    return NextResponse.json(
      { error: "サーバー側でメール認証が未設定です" },
      { status: 503, headers: corsHeaders() }
    );
  }

  const result = await issueCode(email);
  if ("error" in result) {
    return NextResponse.json(
      { error: "コードを送信済みです。しばらくしてから再度お試しください。" },
      { status: 429, headers: corsHeaders() }
    );
  }

  const sent = await sendEmail(email, "【URARA】認証コード", renderCodeEmail(result.code));
  if (!sent) {
    // RESEND_API_KEY未設定のローカル開発時はメール送信をスキップするだけで、
    // コード自体はサーバーログに出力される（send-confirmationと同じ方針）。
    console.warn("Verification code email skipped; code for", email, "is", result.code);
    return NextResponse.json({ skipped: true, reason: "email not configured" }, { status: 202, headers: corsHeaders() });
  }

  return NextResponse.json({ sent: true }, { headers: corsHeaders() });
}

function renderCodeEmail(code: string): string {
  return `
  <div style="background:#050505;padding:32px 16px;font-family:'Hiragino Sans','Yu Gothic',sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#121212;border:1px solid #2A2A2A;border-radius:14px;padding:28px;color:#F5F5F7;">
      <p style="letter-spacing:4px;color:#E0E0E0;font-size:13px;text-align:center;margin:0 0 4px;">URARA</p>
      <h1 style="font-size:18px;text-align:center;margin:0 0 20px;color:#F5F5F7;">認証コード</h1>
      <p style="font-size:13px;line-height:1.8;color:#8E8E93;text-align:center;">
        以下の6桁のコードをアプリの画面に入力してください。
      </p>
      <p style="font-size:36px;font-weight:800;letter-spacing:8px;text-align:center;color:#FFFFFF;margin:20px 0;">${code}</p>
      <p style="font-size:12px;color:#8E8E93;text-align:center;">このコードの有効期限は5分間です。</p>
      <p style="font-size:11px;color:#6C6C70;margin-top:24px;line-height:1.6;text-align:center;">
        本メールに心当たりがない場合は、お手数ですが破棄していただきますようお願いいたします。
      </p>
    </div>
  </div>`;
}
