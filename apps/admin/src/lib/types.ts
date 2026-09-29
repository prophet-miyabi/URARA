export type ReservationStatus =
  | "received"
  | "arranging"
  | "confirmed"
  | "completed"
  | "cancelled";

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  received: "受付済み",
  arranging: "手配中",
  confirmed: "予約確定",
  completed: "利用終了",
  cancelled: "キャンセル",
};

export const STATUS_ORDER: ReservationStatus[] = [
  "received",
  "arranging",
  "confirmed",
  "completed",
];

export type BookingType = "now" | "scheduled";
export type PaymentMethod = "cash" | "card";

export interface Venue {
  id: string;
  name: string;
  address: string;
  prefecture: string;
  city: string;
  venueType: "restaurant" | "banquet_hall" | "event_venue";
  isActive: boolean;
}

export interface Companion {
  id: string;
  fullName: string;
  phoneNumber: string;
  lineId: string;
  status: "active" | "inactive";
}

export interface Reservation {
  id: string;
  customerId: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  locationName: string;
  locationAddress: string;
  bookingType: BookingType;
  requestedDatetime: string;
  guestCount: number;
  companionCount: number;
  durationHours: number;
  travelFee: number;
  paymentMethod: PaymentMethod;
  notes: string;
  status: ReservationStatus;
  createdAt: string;
}
