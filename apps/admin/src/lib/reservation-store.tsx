"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { MOCK_RESERVATIONS, MOCK_COMPANIONS, MOCK_VENUES, MOCK_CUSTOMERS } from "./mock-data";
import type { Reservation, ReservationStatus, Companion, Venue, Customer } from "./types";

interface ReservationStore {
  reservations: Reservation[];
  companions: Companion[];
  venues: Venue[];
  customers: Customer[];
  getReservation: (id: string) => Reservation | undefined;
  setStatus: (id: string, status: ReservationStatus, note?: string) => void;
  assignCompanions: (id: string, companionIds: string[]) => void;
  updateTravelFee: (id: string, travelFee: number) => void;
  updateDuration: (id: string, durationHours: number) => void;
}

const ReservationContext = createContext<ReservationStore | null>(null);

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS);

  const getReservation = useCallback(
    (id: string) => reservations.find((r) => r.id === id),
    [reservations]
  );

  const setStatus = useCallback((id: string, status: ReservationStatus, note?: string) => {
    setReservations((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const changedAt = new Date().toISOString();
        return {
          ...r,
          status,
          confirmedAt: status === "confirmed" ? changedAt : r.confirmedAt,
          statusHistory: [
            ...r.statusHistory,
            { fromStatus: r.status, toStatus: status, changedBy: "admin", changedAt, note },
          ],
        };
      })
    );
  }, []);

  const assignCompanions = useCallback((id: string, companionIds: string[]) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, assignedCompanionIds: companionIds } : r))
    );
  }, []);

  const updateTravelFee = useCallback((id: string, travelFee: number) => {
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, travelFee } : r)));
  }, []);

  const updateDuration = useCallback((id: string, durationHours: number) => {
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, durationHours } : r)));
  }, []);

  const value = useMemo(
    () => ({
      reservations,
      companions: MOCK_COMPANIONS,
      venues: MOCK_VENUES,
      customers: MOCK_CUSTOMERS,
      getReservation,
      setStatus,
      assignCompanions,
      updateTravelFee,
      updateDuration,
    }),
    [reservations, getReservation, setStatus, assignCompanions, updateTravelFee, updateDuration]
  );

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}

export function useReservationStore() {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error("useReservationStore must be used within ReservationProvider");
  return ctx;
}
