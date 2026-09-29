import { calculatePrice } from '@companion-dispatch/pricing';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { renderReservationConfirmedEmail } from '@/lib/email-templates';
import { formatDateTimeJST, formatYen } from '@/lib/format';
import { mapReservationRow, type ReservationRow } from '@/lib/map-reservation';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase-admin';
import type { ReservationStatus } from '@/lib/types';

const PAYMENT_METHOD_LABEL: Record<string, string> = { cash: '現金', card: 'カード' };
const VALID_STATUSES: ReservationStatus[] = ['received', 'arranging', 'confirmed', 'completed', 'cancelled'];

interface PatchBody {
  status?: string;
  travelFee?: number;
  durationHours?: number;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Supabaseが未設定です' }, { status: 503 });
  }

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as ReservationStatus)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (typeof body.travelFee === 'number' && body.travelFee >= 0) updates.travel_fee = body.travelFee;
  if (typeof body.durationHours === 'number' && body.durationHours >= 2) updates.duration_hours = body.durationHours;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'no valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .update(updates)
    .eq('id', id)
    .select('*, customers(full_name, phone_number, email)')
    .maybeSingle();

  if (error || !data) {
    console.error('update reservation failed', error);
    return NextResponse.json({ error: error?.message ?? 'update failed' }, { status: 500 });
  }

  const reservation = mapReservationRow(data as ReservationRow);

  // 予約確定の通知は顧客体験に直結するが、これが失敗しても管理画面上の
  // ステータス更新自体は成立させる（ベストエフォート、失敗してもログのみ）。
  if (body.status === 'confirmed' && reservation.contactEmail) {
    const price = calculatePrice({
      companionCount: reservation.companionCount,
      durationHours: reservation.durationHours,
      travelFee: reservation.travelFee,
    });
    sendEmail(
      reservation.contactEmail,
      '【URARA】ご予約が確定いたしました',
      renderReservationConfirmedEmail({
        fullName: reservation.contactName,
        reservationId: reservation.id,
        locationName: reservation.locationName,
        locationAddress: reservation.locationAddress,
        requestedDatetimeLabel: formatDateTimeJST(reservation.requestedDatetime),
        guestCount: reservation.guestCount,
        companionCount: reservation.companionCount,
        totalLabel: formatYen(price.totalPrice),
        paymentMethodLabel: PAYMENT_METHOD_LABEL[reservation.paymentMethod] ?? reservation.paymentMethod,
      })
    ).catch((err) => console.error('reservation confirmed email errored', err));
  }

  return NextResponse.json({ reservation });
}
