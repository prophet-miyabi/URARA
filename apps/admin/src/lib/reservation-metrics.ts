import { calculatePrice } from "@companion-dispatch/pricing";
import { jstDayKey, jstMonthKey } from "./jst";
import type { Reservation } from "./types";

export function totalYen(r: Reservation): number {
  return calculatePrice({
    companionCount: r.companionCount,
    durationHours: r.durationHours,
    travelFee: r.travelFee,
  }).totalPrice;
}

const OPEN_STATUSES = new Set(["received", "arranging"]);

/** まだ手配が終わっていない（運営の対応待ちの）予約。 */
export function isPending(r: Reservation): boolean {
  return OPEN_STATUSES.has(r.status);
}

/**
 * 運営がすぐ対応すべき予約。
 * - 「今すぐ予約」で、まだ手配中・受付済みのもの
 * - 受付から30分以上たっても、まだ受付済みのまま（見落としの防止）
 * - 開始が3時間以内に迫っているのに、まだ確定していないもの
 */
export function needsAttention(r: Reservation, nowMs: number): boolean {
  if (!isPending(r)) return false;
  if (r.bookingType === "now") return true;
  if (r.status === "received" && nowMs - Date.parse(r.createdAt) >= 30 * 60_000) return true;
  const untilStart = Date.parse(r.requestedDatetime) - nowMs;
  return untilStart <= 3 * 60 * 60_000;
}

export interface DashboardMetrics {
  pending: number;
  today: number;
  monthConfirmed: number;
  monthRevenue: number;
}

export function computeMetrics(reservations: Reservation[], nowMs: number): DashboardMetrics {
  const today = jstDayKey(nowMs);
  const month = jstMonthKey(nowMs);
  const live = reservations.filter((r) => r.status !== "cancelled");

  const monthDone = live.filter(
    (r) => (r.status === "confirmed" || r.status === "completed") && jstMonthKey(r.requestedDatetime) === month
  );

  return {
    pending: reservations.filter(isPending).length,
    today: live.filter((r) => jstDayKey(r.requestedDatetime) === today).length,
    monthConfirmed: monthDone.length,
    monthRevenue: monthDone.reduce((sum, r) => sum + totalYen(r), 0),
  };
}
