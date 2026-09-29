import type { Reservation } from './types';

export interface ReservationRow {
  id: string;
  customer_id: string;
  location_name: string;
  location_address: string;
  booking_type: string;
  requested_datetime: string;
  guest_count: number;
  companion_count: number;
  duration_hours: number;
  travel_fee: number | null;
  payment_method: string;
  notes: string | null;
  status: string;
  created_at: string;
  customers: { full_name: string; phone_number: string; email: string } | null;
}

export function mapReservationRow(row: ReservationRow): Reservation {
  return {
    id: row.id,
    customerId: row.customer_id,
    contactName: row.customers?.full_name ?? '(不明)',
    contactPhone: row.customers?.phone_number ?? '',
    contactEmail: row.customers?.email ?? '',
    locationName: row.location_name,
    locationAddress: row.location_address,
    bookingType: row.booking_type as Reservation['bookingType'],
    requestedDatetime: row.requested_datetime,
    guestCount: row.guest_count,
    companionCount: row.companion_count,
    durationHours: row.duration_hours,
    travelFee: row.travel_fee ?? 0,
    paymentMethod: row.payment_method as Reservation['paymentMethod'],
    notes: row.notes ?? '',
    status: row.status as Reservation['status'],
    createdAt: row.created_at,
  };
}
