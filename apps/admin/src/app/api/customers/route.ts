import { calculatePrice } from '@companion-dispatch/pricing';
import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase-admin';

// お客様一覧。予約履歴から、来店回数・最終利用日・累計金額をまとめて返す。
// /api/* は管理画面のログインが必須（middleware.tsの既定の挙動）。

interface CustomerRow {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  address: string;
  created_at: string;
  reservations: Array<{
    status: string;
    requested_datetime: string;
    companion_count: number;
    duration_hours: number;
    travel_fee: number | null;
  }>;
}

export async function GET() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Supabaseが未設定です' }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select(
      'id, full_name, phone_number, email, address, created_at, reservations(status, requested_datetime, companion_count, duration_hours, travel_fee)'
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('list customers failed', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const customers = (data as unknown as CustomerRow[]).map((c) => {
    const active = c.reservations.filter((r) => r.status !== 'cancelled');
    const done = active.filter((r) => r.status === 'confirmed' || r.status === 'completed');
    const last = active.map((r) => r.requested_datetime).sort().pop() ?? null;
    return {
      id: c.id,
      fullName: c.full_name,
      phoneNumber: c.phone_number,
      email: c.email,
      address: c.address,
      createdAt: c.created_at,
      reservationCount: active.length,
      lastReservationAt: last,
      totalYen: done.reduce(
        (sum, r) =>
          sum +
          calculatePrice({
            companionCount: r.companion_count,
            durationHours: r.duration_hours,
            travelFee: r.travel_fee ?? 0,
          }).totalPrice,
        0
      ),
    };
  });

  return NextResponse.json({ customers }, { headers: { 'Cache-Control': 'no-store' } });
}
