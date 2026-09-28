import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MOCK_MY_RESERVATIONS } from './mock-data';
import { sendReservationReceivedEmail } from './notify';
import { getSavedEmail, saveEmail } from './profile';
import { getSavedLocations, saveLocation } from './saved-locations';
import { supabase } from './supabase';
import type { Location, Reservation } from './types';

export interface NewReservationInput {
  // Supabaseに保存済みの予約と同じIDを使う場合に指定する（reservation/[id]画面が
  // どちらの経路で開いても同じ予約を指せるようにするため）。
  id?: string;
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

  useEffect(() => {
    getSavedLocations().then(setSavedLocations);
    getSavedEmail().then(setContactEmail);
  }, []);

  const recordLocationUsage = useCallback((location: Location) => {
    saveLocation(location).then(setSavedLocations);
  }, []);

  const updateContactEmail = useCallback((email: string) => {
    setContactEmail(email);
    saveEmail(email);
  }, []);

  const createReservation = useCallback((input: NewReservationInput) => {
    const { id, ...rest } = input;
    const reservation: Reservation = {
      id: id ?? `r${Date.now()}`,
      travelFee: 0,
      status: 'received',
      createdAt: new Date().toISOString(),
      ...rest,
    };
    setReservations((prev) => [reservation, ...prev]);
    // 確認メールの送信元認証には、Supabaseのログインセッション（JWT）をその場で
    // 取得して使う。取得は非同期だが、予約オブジェクト自体は同期的に返す必要が
    // あるため、メール送信は結果を待たずに（ベストエフォートで）実行する。
    supabase.auth.getSession().then(({ data }) => {
      sendReservationReceivedEmail(reservation, data.session?.access_token);
    });
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
      createReservation,
      getReservation,
      recordLocationUsage,
      updateContactEmail,
    }),
    [reservations, savedLocations, contactEmail, createReservation, getReservation, recordLocationUsage, updateContactEmail]
  );

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}

export function useReservationStore() {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error('useReservationStore must be used within ReservationProvider');
  return ctx;
}
