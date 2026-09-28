import { NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { sendEmail } from '@/lib/email';
import { renderOtpEmail } from '@/lib/email-templates';

// SupabaseのSMTP中継(Resend経由)は過去2回、原因不明のまま送信失敗
// ("Error sending confirmation email")に陥った。Auth Hooksの
// Send Email Hookを使い、認証メールの送信自体はSupabaseに任せず、
// 既に実績のある自前のResend HTTP API送信(sendEmail)に一本化する。
const HOOK_SECRET = process.env.SUPABASE_AUTH_HOOK_SECRET;

function errorResponse(httpCode: number, message: string) {
  return NextResponse.json({ error: { http_code: httpCode, message } }, { status: httpCode });
}

export async function POST(request: Request) {
  if (!HOOK_SECRET) {
    console.error('SUPABASE_AUTH_HOOK_SECRET is not configured');
    return errorResponse(500, 'hook secret not configured');
  }

  const payload = await request.text();
  const headers = {
    'webhook-id': request.headers.get('webhook-id') ?? '',
    'webhook-timestamp': request.headers.get('webhook-timestamp') ?? '',
    'webhook-signature': request.headers.get('webhook-signature') ?? '',
  };

  const wh = new Webhook(HOOK_SECRET.replace(/^v1,whsec_/, ''));
  let data: { user: { email: string }; email_data: { token: string; email_action_type: string } };
  try {
    data = wh.verify(payload, headers) as typeof data;
  } catch (err) {
    console.error('auth-send-email-hook: signature verification failed', err);
    return errorResponse(401, 'invalid signature');
  }

  const { user, email_data } = data;
  if (!user?.email || !email_data?.token) {
    return errorResponse(400, 'missing user email or token');
  }

  const sent = await sendEmail(
    user.email,
    '【URARA】認証コードのご案内',
    renderOtpEmail({ code: email_data.token, actionType: email_data.email_action_type })
  );

  if (!sent) {
    return errorResponse(500, 'email send failed');
  }

  return NextResponse.json({});
}
