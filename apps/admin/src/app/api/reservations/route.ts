import { NextResponse } from 'next/server';
import { mapReservationRow, type ReservationRow } from '@/lib/map-reservation';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase-admin';

// 管理画面のReactコンポーネントからservice_roleキーを直接使うことはできない
// （クライアントバンドルに秘密鍵が漏れてしまう）ため、このAPI Route経由で
// サーバー側から読み書きする。呼び出し元は管理画面ログイン必須
// （middleware.tsのデフォルト挙動により、PUBLIC_PATHSに無いここは保護される）。

export async function GET() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Supabaseが未設定です' }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select('*, customers(full_name, phone_number, email)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('list reservations failed', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reservations = (data as ReservationRow[]).map(mapReservationRow);
  return NextResponse.json({ reservations });
}
