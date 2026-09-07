import type { Reservation } from './types';
import { formatDateTimeJST, formatYen } from './format';
import { calculatePrice } from '@companion-dispatch/pricing';

const ADMIN_API_BASE_URL = process.env.EXPO_PUBLIC_ADMIN_API_BASE_URL ?? 'https://urara-admin.onrender.com';

// Best-effort: failures are logged but never block the booking flow.
export async function sendReservationReceivedEmail(
  reservation: Reservation,
  verificationToken?: string
): Promise<void> {
  if (!reservation.contactEmail) return;

  const price = calculatePrice({
    companionCount: reservation.companionCount,
    durationHours: reservation.durationHours,
  });

  try {
    const res = await fetch(`${ADMIN_API_BASE_URL}/api/send-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: reservation.contactEmail,
        reservationId: reservation.id,
        locationName: reservation.location.name,
        requestedDatetimeLabel: formatDateTimeJST(reservation.requestedDatetime),
        guestCount: reservation.guestCount,
        companionCount: reservation.companionCount,
        estimatedTotalLabel: formatYen(price.totalPrice),
        notes: reservation.notes,
        verificationToken,
      }),
    });
    if (!res.ok) {
      console.warn('send-confirmation email request failed', res.status);
    }
  } catch (err) {
    console.warn('send-confirmation email request errored', err);
  }
}
