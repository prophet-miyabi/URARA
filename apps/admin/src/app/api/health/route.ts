import { NextResponse } from 'next/server';

// 外部の死活監視（UptimeRobotなど）やGitHub Actionsが、サーバーが起きているかを
// 確かめるための軽量エンドポイント。DBにも外部サービスにも触れない。
// リクエストのヘッダーを読むことで、ビルド時に静的化されないようにしている。
export async function GET(request: Request) {
  return NextResponse.json(
    { ok: true, time: new Date().toISOString(), ua: request.headers.get('user-agent')?.slice(0, 40) ?? null },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
