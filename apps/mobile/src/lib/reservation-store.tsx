import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MOCK_MY_RESERVATIONS } from './mock-data';
import { sendReservationReceivedEmail } from './notify';
import { getSavedEmail, saveEmail } from './profile';
import { getSavedLocations, saveLocation } from './saved-locations';
import type { Location, Reservation } from './types';

export interface NewReservationInput {
  location: Location;
  bookingType: Reservation['bookingType'];
  requestedDatetime: string;
  guestCount: number;
  companionCount: number;
  durationHours: number;
  paymentMethod: Reservation['paymentMethod'];
  notes: string;
  contactEmail: string;
}

interface Store {
  reservations: Reservation[];
  savedLocations: Location[];
  contactEmail: string;
  isLoggedIn: boolean;
  login: () => void;
  createReservation: (input: NewReservationInput) => Reservation;
  getReservation: (id: string) => Reservation | undefined;
  recordLocationUsage: (location: Location) => void;
  updateContactEmail: (email: string) => void;
}

const ReservationContext = createContext<Store | null>(null);

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_MY_RESERVATIONS);
  const [savedLocations, setSavedLocations] = useState<Location[]>([]);
  const [contactEmail, setContactEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    getSavedLocations().then(setSavedLocations);
    getSavedEmail().then(setContactEmail);
  }, []);

  const login = useCallback(() => setIsLoggedIn(true), []);

  const recordLocationUsage = useCallback((location: Location) => {
    saveLocation(location).then(setSavedLocations);
  }, []);

  const updateContactEmail = useCallback((email: string) => {
    setContactEmail(email);
    saveEmail(email);
  }, []);

  const createReservation = useCallback((input: NewReservationInput) => {
    const reservation: Reservation = {
      id: `r${Date.now()}`,
      travelFee: 0,
      status: 'received',
      createdAt: new Date().toISOString(),
      ...input,
    };
    setReservations((prev) => [reservation, ...prev]);
    sendReservationReceivedEmail(reservation);
    return reservation;
  }, []);

  const getReservation = useCallback(
    (id: string) => reservations.find((r) => r.id === id),
    [reservations]
  );

  const value = useMemo(
    () => ({
      reservations,
      savedLocations,
      contactEmail,
      isLoggedIn,
      login,
      createReservation,
      getReservation,
      recordLocationUsage,
      updateContactEmail,
    }),
    [
      reservations,
      savedLocations,
      contactEmail,
      isLoggedIn,
      login,
      createReservation,
      getReservation,
      recordLocationUsage,
      updateContactEmail,
    ]
  );

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}

export function useReservationStore() {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error('useReservationStore must be used within ReservationProvider');
  return ctx;
}
