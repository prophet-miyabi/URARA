import { NextResponse } from 'next/server';
import { getOperatorEmails, setOperatorEmails } from '@/lib/notification-settings';

// /api/settings/* はmiddleware.tsのPUBLIC_PATHSに含まれていないため、
// 管理画面のログインセッションが無いと呼び出せない。

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const emails = await getOperatorEmails();
  return NextResponse.json({ emails });
}

export async function POST(request: Request) {
  let body: { emails?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.emails) || !body.emails.every((e) => typeof e === 'string')) {
    return NextResponse.json({ error: 'emails must be an array of strings' }, { status: 400 });
  }

  const emails = body.emails.map((e) => e.trim()).filter((e) => e.length > 0);
  if (emails.some((e) => !EMAIL_PATTERN.test(e))) {
    return NextResponse.json({ error: 'メールアドレスの形式が正しくないものがあります' }, { status: 400 });
  }

  const ok = await setOperatorEmails(emails);
  if (!ok) {
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 });
  }
  return NextResponse.json({ emails });
}
