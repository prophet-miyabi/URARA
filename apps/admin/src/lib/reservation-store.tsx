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
  getReservation: (id: string) => Reservation | undefined;
  setStatus: (id: string, status: ReservationStatus) => Promise<void>;
  updateTravelFee: (id: string, travelFee: number) => Promise<void>;
  updateDuration: (id: string, durationHours: number) => Promise<void>;
}

const ReservationContext = createContext<ReservationStore | null>(null);

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reservations")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setReservations(data.reservations ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
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
      getReservation,
      setStatus,
      updateTravelFee,
      updateDuration,
    }),
    [reservations, loading, getReservation, setStatus, updateTravelFee, updateDuration]
  );

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}

export function useReservationStore() {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error("useReservationStore must be used within ReservationProvider");
  return ctx;
}
