import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase-admin';

// ダッシュボードのシステム状態カード用。/api/health-check が5分おきに書き込む
// system_health テーブルの最新の結果を返す。/api/* は管理画面のログインが必須。

const LABELS: Record<string, string> = {
  app: 'お客様向けサイト',
  database: 'データベース',
  auth: 'ログイン（Supabase Auth）',
  places: 'Googleマップ・場所検索',
  email: 'メール送信（Resend）',
};

export async function GET() {
  const empty = NextResponse.json({ available: false, checks: [] });
  if (!isSupabaseConfigured || !supabaseAdmin) return empty;

  const { data, error } = await supabaseAdmin
    .from('system_health')
    .select('name, status, detail, updated_at');
  if (error || !data || data.length === 0) return empty;

  const checks = Object.keys(LABELS)
    .map((name) => {
      const row = data.find((r) => r.name === name);
      return row
        ? { name, label: LABELS[name], status: row.status as 'ok' | 'fail', detail: row.detail as string, updatedAt: row.updated_at as string }
        : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return NextResponse.json({ available: true, checks }, { headers: { 'Cache-Control': 'no-store' } });
}
