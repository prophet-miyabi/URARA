import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { MOCK_MY_RESERVATIONS, MOCK_VENUES } from './mock-data';
import type { Reservation, Venue } from './types';

export interface NewReservationInput {
  venueId: string;
  bookingType: Reservation['bookingType'];
  requestedDatetime: string;
  guestCount: number;
  companionCount: number;
  durationHours: number;
  paymentMethod: Reservation['paymentMethod'];
  notes: string;
}

interface Store {
  reservations: Reservation[];
  venues: Venue[];
  isLoggedIn: boolean;
  login: () => void;
  createReservation: (input: NewReservationInput) => Reservation;
  getReservation: (id: string) => Reservation | undefined;
}

const ReservationContext = createContext<Store | null>(null);

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_MY_RESERVATIONS);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const login = useCallback(() => setIsLoggedIn(true), []);

  const createReservation = useCallback((input: NewReservationInput) => {
    const reservation: Reservation = {
      id: `r${Date.now()}`,
      travelFee: 0,
      status: 'received',
      createdAt: new Date().toISOString(),
      ...input,
    };
    setReservations((prev) => [reservation, ...prev]);
    return reservation;
  }, []);

  const getReservation = useCallback(
    (id: string) => reservations.find((r) => r.id === id),
    [reservations]
  );

  const value = useMemo(
    () => ({
      reservations,
      venues: MOCK_VENUES,
      isLoggedIn,
      login,
      createReservation,
      getReservation,
    }),
    [reservations, isLoggedIn, login, createReservation, getReservation]
  );

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}

export function useReservationStore() {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error('useReservationStore must be used within ReservationProvider');
  return ctx;
}
