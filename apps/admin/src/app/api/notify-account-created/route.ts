import { NextResponse } from 'next/server';
import { corsHeaders, sendEmail } from '@/lib/email';
import { renderAccountCreatedEmail } from '@/lib/email-templates';
import { getOperatorEmails } from '@/lib/notification-settings';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase-admin';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

interface RequestBody {
  fullName: string;
  verificationToken: string;
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

  const sent = await sendEmail(
    email,
    '【URARA】アカウントの作成が完了いたしました',
    renderAccountCreatedEmail({ fullName: body.fullName }),
    await getOperatorEmails()
  );

  return NextResponse.json({ sent }, { headers: corsHeaders() });
}
