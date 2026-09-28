import { NextResponse } from 'next/server';
import { corsHeaders, sendEmail } from '@/lib/email';
import { renderLoginNotificationEmail } from '@/lib/email-templates';
import { formatDateTimeJST } from '@/lib/format';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase-admin';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

interface RequestBody {
  fullName: string;
  verificationToken: string;
}

// ブラウザのUser-Agent文字列から、お客様が読んでわかる程度の端末情報だけを
// 抜き出す（クライアントの自己申告ではなく、リクエスト自体が持つ実際の値なので
// 詐称されない）。
function summarizeUserAgent(userAgent: string | null): string {
  if (!userAgent) return '不明な端末';
  if (/iphone|ipad/i.test(userAgent)) return 'iPhone/iPad';
  if (/android/i.test(userAgent)) return 'Androidデバイス';
  if (/windows/i.test(userAgent)) return 'Windows パソコン';
  if (/macintosh|mac os/i.test(userAgent)) return 'Mac パソコン';
  return 'ウェブブラウザ';
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400, headers: corsHeaders() });
  }

  if (!body.fullName || !body.verificationToken) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400, headers: corsHeaders() });
  }
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'not configured' }, { status: 501, headers: corsHeaders() });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(body.verificationToken);
  const email = data.user?.email;
  if (error || !email) {
    return NextResponse.json({ error: 'メールアドレスの認証が確認できません' }, { status: 401, headers: corsHeaders() });
  }

  // クライアントの自己申告ではなく、リクエスト自体（Renderのプロキシ経由でも
  // x-forwarded-forに実IPが入る）から取得することで、詐称できない値にする。
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const device = summarizeUserAgent(request.headers.get('user-agent'));

  const sent = await sendEmail(
    email,
    '【URARA】ログインのお知らせ',
    renderLoginNotificationEmail({
      fullName: body.fullName,
      whenLabel: formatDateTimeJST(new Date().toISOString()),
      device,
      ipAddress,
    })
  );

  return NextResponse.json({ sent }, { headers: corsHeaders() });
}
