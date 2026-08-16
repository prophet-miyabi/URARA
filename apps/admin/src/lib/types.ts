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

export interface Customer {
  id: string;
  fullName: string;
  phoneNumber: string;
  identityVerificationStatus: "unverified" | "pending_review" | "verified" | "rejected";
}

export interface StatusHistoryEntry {
  fromStatus: ReservationStatus | null;
  toStatus: ReservationStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface Reservation {
  id: string;
  customerId: string | null;
  contactName: string;
  contactPhone: string;
  venueId: string;
  bookingType: BookingType;
  requestedDatetime: string;
  guestCount: number;
  companionCount: number;
  durationHours: number;
  travelFee: number;
  paymentMethod: PaymentMethod;
  notes: string;
  status: ReservationStatus;
  confirmedAt: string | null;
  assignedCompanionIds: string[];
  statusHistory: StatusHistoryEntry[];
  createdByAdmin: boolean;
}
