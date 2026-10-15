"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { formatYen } from "@/lib/format";
import { describeWhen } from "@/lib/jst";
import { computeMetrics, needsAttention, totalYen } from "@/lib/reservation-metrics";
import { useReservationStore } from "@/lib/reservation-store";
import type { Reservation } from "@/lib/types";
import { useNow } from "@/lib/use-now";

interface HealthCheck {
  name: string;
  label: string;
  status: "ok" | "fail";
  detail: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { reservations, loading } = useReservationStore();
  const now = useNow();

  const metrics = useMemo(() => computeMetrics(reservations, now), [reservations, now]);
  const attention = useMemo(
    () =>
      reservations
        .filter((r) => needsAttention(r, now))
        .sort((a, b) => Date.parse(a.requestedDatetime) - Date.parse(b.requestedDatetime)),
    [reservations, now]
  );
  const upcoming = useMemo(
    () =>
      reservations
        .filter((r) => (r.status === "confirmed" || r.status === "arranging") && Date.parse(r.requestedDatetime) >= now)
        .sort((a, b) => Date.parse(a.requestedDatetime) - Date.parse(b.requestedDatetime))
        .slice(0, 5),
    [reservations, now]
  );

  const todayLabel = new Date(now).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="ダッシュボード" description={`${todayLabel} の状況`} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="対応待ち"
          value={loading ? "-" : `${metrics.pending}件`}
          hint="受付済み・手配中"
          tone={metrics.pending > 0 ? "alert" : "default"}
        />
        <StatCard label="今日の予約" value={loading ? "-" : `${metrics.today}件`} hint="キャンセルを除く" />
        <StatCard label="今月の確定" value={loading ? "-" : `${metrics.monthConfirmed}件`} hint="確定・利用終了" />
        <StatCard label="今月の売上目安" value={loading ? "-" : formatYen(metrics.monthRevenue)} hint="確定・利用終了の合計" />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card
            title="いま対応が必要な予約"
            action={
              attention.length > 0 && (
                <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">{attention.length}</span>
              )
            }
          >
            {loading ? (
              <EmptyState>読み込み中...</EmptyState>
            ) : attention.length === 0 ? (
              <EmptyState>対応が必要な予約はありません</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {attention.slice(0, 6).map((r) => (
                  <ReservationRow key={r.id} reservation={r} now={now} />
                ))}
              </ul>
            )}
          </Card>

          <Card title="これからの予定" action={<Link href="/reservations" className="text-sm font-medium text-subtle hover:underline">すべて見る</Link>}>
            {loading ? (
              <EmptyState>読み込み中...</EmptyState>
            ) : upcoming.length === 0 ? (
              <EmptyState>これからの予定はありません</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {upcoming.map((r) => (
                  <ReservationRow key={r.id} reservation={r} now={now} />
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <SystemStatusCard />
        </div>
      </div>
    </div>
  );
}

function ReservationRow({ reservation: r, now }: { reservation: Reservation; now: number }) {
  return (
    <li>
      <Link href={`/reservations/${r.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-canvas active:bg-canvas">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-bold">
            {describeWhen(r.requestedDatetime, now)}
            {r.bookingType === "now" && (
              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-bold text-rose-700">今すぐ</span>
            )}
          </p>
          <p className="truncate text-sm">{r.contactName}</p>
          <p className="truncate text-xs text-faint">
            {r.locationName} ・ 女の子{r.companionCount}名 ・ {formatYen(totalYen(r))}
          </p>
        </div>
        <StatusBadge status={r.status} />
      </Link>
    </li>
  );
}

function SystemStatusCard() {
  const [state, setState] = useState<{ loaded: boolean; available: boolean; checks: HealthCheck[] }>({
    loaded: false,
    available: false,
    checks: [],
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/system-status")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setState({ loaded: true, available: Boolean(data.available), checks: data.checks ?? [] });
      })
      .catch(() => {
        if (!cancelled) setState({ loaded: true, available: false, checks: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const failing = state.checks.filter((c) => c.status === "fail");
  const lastChecked = state.checks.map((c) => Date.parse(c.updatedAt)).sort().pop();

  return (
    <Card
      title="システムの状態"
      action={
        state.available && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              failing.length === 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {failing.length === 0 ? "すべて正常" : `${failing.length}件に異常`}
          </span>
        )
      }
    >
      {!state.loaded ? (
        <EmptyState>読み込み中...</EmptyState>
      ) : !state.available ? (
        <EmptyState>
          自動チェックの結果がまだありません。
          <br />
          5分おきの自動チェックを設定すると、ここに表示されます。
        </EmptyState>
      ) : (
        <>
          <ul className="divide-y divide-line">
            {state.checks.map((c) => (
              <li key={c.name} className="flex items-start gap-3 px-4 py-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${c.status === "ok" ? "bg-emerald-500" : "bg-rose-500"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{c.label}</p>
                  {c.status === "fail" && <p className="break-words text-xs text-rose-600">{c.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
          {lastChecked && (
            <p className="border-t border-line px-4 py-2 text-xs text-faint">
              最終チェック:{" "}
              {new Date(lastChecked).toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </>
      )}
    </Card>
  );
}
