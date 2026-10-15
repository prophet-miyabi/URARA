"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, EmptyState, PageHeader, SearchInput } from "@/components/ui";
import { describeWhen } from "@/lib/jst";
import { needsAttention, totalYen } from "@/lib/reservation-metrics";
import { useReservationStore } from "@/lib/reservation-store";
import { STATUS_LABEL, type Reservation, type ReservationStatus } from "@/lib/types";
import { useNow } from "@/lib/use-now";
import { formatYen } from "@/lib/format";

type Filter = ReservationStatus | "all";
type Sort = "datetime" | "newest";

const FILTERS: Filter[] = ["all", "received", "arranging", "confirmed", "completed", "cancelled"];

function matchesQuery(r: Reservation, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [r.contactName, r.contactPhone, r.contactEmail, r.locationName, r.locationAddress, r.id]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export default function ReservationsPage() {
  const { reservations, loading } = useReservationStore();
  const now = useNow();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("datetime");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { all: reservations.length, received: 0, arranging: 0, confirmed: 0, completed: 0, cancelled: 0 };
    for (const r of reservations) result[r.status] += 1;
    return result;
  }, [reservations]);

  const visible = useMemo(() => {
    const list = reservations.filter((r) => (filter === "all" || r.status === filter) && matchesQuery(r, query));
    return [...list].sort((a, b) => {
      if (sort === "newest") return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      // 日時順: ①対応が必要なもの ②これからの予約（開始が近い順） ③終わったもの
      // （利用終了・キャンセル。新しい順）の並びにする。
      const rank = (r: Reservation) =>
        needsAttention(r, now) ? 0 : r.status === "completed" || r.status === "cancelled" ? 2 : 1;
      const rankDiff = rank(a) - rank(b);
      if (rankDiff) return rankDiff;
      const diff = Date.parse(a.requestedDatetime) - Date.parse(b.requestedDatetime);
      return rank(a) === 2 ? -diff : diff;
    });
  }, [reservations, filter, query, sort, now]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="予約キュー" description={`全 ${reservations.length} 件`} />

      <div className="mb-3 grid gap-3 md:grid-cols-[1fr_auto]">
        <SearchInput value={query} onChange={setQuery} placeholder="お客様名・電話番号・場所で検索" />
        <div className="flex h-11 rounded-lg border border-line bg-white p-1 text-sm font-medium" role="group" aria-label="並び順">
          {(
            [
              ["datetime", "日時順"],
              ["newest", "新着順"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSort(value)}
              className={`flex-1 rounded-md px-4 transition ${sort === value ? "bg-ink text-white" : "text-subtle"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition ${
              filter === value ? "border-ink bg-ink text-white" : "border-line bg-white text-subtle"
            }`}
          >
            {value === "all" ? "すべて" : STATUS_LABEL[value]}
            <span className={`text-xs tabular-nums ${filter === value ? "text-white/70" : "text-faint"}`}>{counts[value]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <Card>
          <EmptyState>読み込み中...</EmptyState>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState>{query ? "条件に合う予約はありません" : "該当する予約はありません"}</EmptyState>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {visible.map((r) => (
              <ReservationCard key={r.id} reservation={r} now={now} />
            ))}
          </div>

          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-left text-xs font-semibold text-subtle">
                <tr>
                  <th className="px-4 py-2.5">日時</th>
                  <th className="px-4 py-2.5">お客様</th>
                  <th className="px-4 py-2.5">場所</th>
                  <th className="px-4 py-2.5">人数</th>
                  <th className="px-4 py-2.5 text-right">金額目安</th>
                  <th className="px-4 py-2.5">状況</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className="border-t border-line transition hover:bg-canvas">
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link href={`/reservations/${r.id}`} className="font-semibold hover:underline">
                        {describeWhen(r.requestedDatetime, now)}
                      </Link>
                      {needsAttention(r, now) && <UrgentChip bookingType={r.bookingType} />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.contactName}</div>
                      <div className="text-xs text-faint">{r.contactPhone}</div>
                    </td>
                    <td className="max-w-56 truncate px-4 py-3 text-subtle">{r.locationName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-subtle">
                      客{r.guestCount} / 女の子{r.companionCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatYen(totalYen(r))}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

function UrgentChip({ bookingType }: { bookingType: Reservation["bookingType"] }) {
  return (
    <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-bold text-rose-700">
      {bookingType === "now" ? "今すぐ" : "要対応"}
    </span>
  );
}

function ReservationCard({ reservation: r, now }: { reservation: Reservation; now: number }) {
  const urgent = needsAttention(r, now);
  return (
    <Link
      href={`/reservations/${r.id}`}
      className={`block rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] active:bg-canvas ${
        urgent ? "border-rose-200" : "border-line"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center text-base font-bold">
          {describeWhen(r.requestedDatetime, now)}
          {urgent && <UrgentChip bookingType={r.bookingType} />}
        </p>
        <StatusBadge status={r.status} />
      </div>
      <p className="font-medium">{r.contactName}</p>
      <p className="mt-0.5 truncate text-sm text-subtle">{r.locationName}</p>
      <p className="mt-2 text-sm text-subtle">
        客{r.guestCount}名 / 女の子{r.companionCount}名 ・ <span className="font-semibold text-ink">{formatYen(totalYen(r))}</span>
      </p>
    </Link>
  );
}
