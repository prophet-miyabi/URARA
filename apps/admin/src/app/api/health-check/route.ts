import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { runHealthCheck, sendTestAlert } from '@/lib/health';

// システム全体の点検を実行し、異常が続いていれば管理者に警告メールを送る。
// Supabaseのpg_cronなど、外部のスケジューラから5分おきに呼ばれる想定。
// middleware.tsのPUBLIC_PATHSに含めてあるため、ここで共有トークンを必ず検証する。
//   ?dryRun=1 : 点検結果だけ返す（メールも状態の保存もしない）
//   ?test=1   : 警告メールのテスト送信だけ行う

function isAuthorized(request: Request): boolean {
  const token = process.env.HEALTH_CHECK_TOKEN;
  if (!token) return false;
  const header = request.headers.get('authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  const a = Buffer.from(provided);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  if (params.get('test') === '1') {
    return NextResponse.json(await sendTestAlert());
  }
  return NextResponse.json(await runHealthCheck({ dryRun: params.get('dryRun') === '1' }), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
