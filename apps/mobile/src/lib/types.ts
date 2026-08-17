export type ReservationStatus = 'received' | 'arranging' | 'confirmed' | 'completed' | 'cancelled';

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  received: '受付済み',
  arranging: '手配中',
  confirmed: '予約確定',
  completed: '利用終了',
  cancelled: 'キャンセル',
};

export const STATUS_STEPS: ReservationStatus[] = ['received', 'arranging', 'confirmed', 'completed'];

export type BookingType = 'now' | 'scheduled';
export type PaymentMethod = 'cash' | 'card';

export interface Location {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface CastProfile {
  id: string;
  nickname: string;
  tagline: string;
  tone: string;
}

export interface Reservation {
  id: string;
  location: Location;
  bookingType: BookingType;
  requestedDatetime: string;
  guestCount: number;
  companionCount: number;
  durationHours: number;
  travelFee: number;
  paymentMethod: PaymentMethod;
  notes: string;
  contactEmail: string;
  status: ReservationStatus;
  createdAt: string;
}
