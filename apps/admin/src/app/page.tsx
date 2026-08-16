"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useReservationStore } from "@/lib/reservation-store";
import { STATUS_LABEL, type ReservationStatus } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTimeJST, formatYen } from "@/lib/format";
import { calculatePrice } from "@companion-dispatch/pricing";

const FILTERS: Array<{ value: ReservationStatus | "all"; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "received", label: STATUS_LABEL.received },
  { value: "arranging", label: STATUS_LABEL.arranging },
  { value: "confirmed", label: STATUS_LABEL.confirmed },
  { value: "completed", label: STATUS_LABEL.completed },
  { value: "cancelled", label: STATUS_LABEL.cancelled },
];

export default function ReservationsQueuePage() {
  const { reservations, venues } = useReservationStore();
  const [filter, setFilter] = useState<ReservationStatus | "all">("all");

  const venueName = (id: string) => venues.find((v) => v.id === id)?.name ?? "(不明な店舗)";

  const filtered = useMemo(() => {
    const list = filter === "all" ? reservations : reservations.filter((r) => r.status === filter);
    return [...list].sort((a, b) => {
      if (a.bookingType === "now" && b.bookingType !== "now") return -1;
      if (b.bookingType === "now" && a.bookingType !== "now") return 1;
      return new Date(a.requestedDatetime).getTime() - new Date(b.requestedDatetime).getTime();
    });
  }, [reservations, filter]);

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">予約キュー</h1>
        <span className="text-sm text-neutral-500">全 {reservations.length} 件</span>
      </div>

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              filter === f.value
                ? "bg-neutral-900 text-white"
                : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">種別</th>
              <th className="px-4 py-2 font-medium">お客様</th>
              <th className="px-4 py-2 font-medium">店舗</th>
              <th className="px-4 py-2 font-medium">日時</th>
              <th className="px-4 py-2 font-medium">人数</th>
              <th className="px-4 py-2 font-medium">金額目安</th>
              <th className="px-4 py-2 font-medium">状況</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const price = calculatePrice({
                companionCount: r.companionCount,
                durationHours: r.durationHours,
                travelFee: r.travelFee,
              });
              return (
                <tr key={r.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    {r.bookingType === "now" ? (
                      <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                        今すぐ
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-500">日時指定</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/reservations/${r.id}`} className="font-medium text-neutral-900 hover:underline">
                      {r.contactName}
                    </Link>
                    <div className="text-xs text-neutral-400">{r.contactPhone}</div>
                  </td>
                  <td className="px-4 py-3">{venueName(r.venueId)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDateTimeJST(r.requestedDatetime)}</td>
                  <td className="px-4 py-3">
                    客{r.guestCount}名 / 女の子{r.companionCount}名
                  </td>
                  <td className="px-4 py-3">{formatYen(price.totalPrice)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                  該当する予約はありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
