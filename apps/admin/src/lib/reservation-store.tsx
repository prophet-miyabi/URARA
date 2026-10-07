"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MOCK_COMPANIONS, MOCK_VENUES } from "./mock-data";
import type { Companion, Reservation, ReservationStatus, Venue } from "./types";

interface ReservationStore {
  reservations: Reservation[];
  // 女の子・店舗の名簿機能はまだSupabaseに実データが無く、当面はダミー表示。
  // 実データ化は別途の管理画面機能として計画する。
  companions: Companion[];
  venues: Venue[];
  loading: boolean;
  // 最後に一覧を取得できた時刻（ミリ秒）。まだ取得できていなければnull。
  lastUpdated: number | null;
  refresh: () => Promise<void>;
  getReservation: (id: string) => Reservation | undefined;
  setStatus: (id: string, status: ReservationStatus) => Promise<void>;
  updateTravelFee: (id: string, travelFee: number) => Promise<void>;
  updateDuration: (id: string, durationHours: number) => Promise<void>;
}

const ReservationContext = createContext<ReservationStore | null>(null);

// 取得に失敗したとき（電波が不安定など）はnullを返し、表示中の一覧をそのまま残す。
async function fetchReservations(): Promise<Reservation[] | null> {
  try {
    const res = await fetch("/api/reservations");
    if (!res.ok) return null;
    const data = await res.json();
    return data.reservations ?? [];
  } catch {
    return null;
  }
}

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // 手動の「更新」ボタン用。
  const refresh = useCallback(async () => {
    const list = await fetchReservations();
    if (list) {
      setReservations(list);
      setLastUpdated(Date.now());
    }
  }, []);

  // スマホで開きっぱなしにしても新しい予約に気づけるよう、1分おきと、
  // 画面に戻ってきたとき（別アプリから戻る、ロック解除など）に再取得する。
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchReservations().then((list) => {
        if (cancelled || !list) return;
        setReservations(list);
        setLastUpdated(Date.now());
      });
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    const timer = setInterval(load, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const getReservation = useCallback(
    (id: string) => reservations.find((r) => r.id === id),
    [reservations]
  );

  const patch = useCallback(async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return;
    const data = await res.json();
    setReservations((prev) => prev.map((r) => (r.id === id ? data.reservation : r)));
  }, []);

  const setStatus = useCallback((id: string, status: ReservationStatus) => patch(id, { status }), [patch]);
  const updateTravelFee = useCallback((id: string, travelFee: number) => patch(id, { travelFee }), [patch]);
  const updateDuration = useCallback(
    (id: string, durationHours: number) => patch(id, { durationHours }),
    [patch]
  );

  const value = useMemo(
    () => ({
      reservations,
      companions: MOCK_COMPANIONS,
      venues: MOCK_VENUES,
      loading,
      lastUpdated,
      refresh,
      getReservation,
      setStatus,
      updateTravelFee,
      updateDuration,
    }),
    [reservations, loading, lastUpdated, refresh, getReservation, setStatus, updateTravelFee, updateDuration]
  );

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}

export function useReservationStore() {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error("useReservationStore must be used within ReservationProvider");
  return ctx;
}
