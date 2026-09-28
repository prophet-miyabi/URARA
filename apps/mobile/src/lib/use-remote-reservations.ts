import { useEffect, useState } from 'react';
import { useAuthStore } from './auth-store';
import { isSupabaseConfigured, supabase } from './supabase';
import type { ReservationStatus } from './types';

export interface RemoteReservation {
  id: string;
  location_name: string;
  requested_datetime: string;
  guest_count: number;
  companion_count: number;
  duration_hours: number;
  status: ReservationStatus;
}

// ログイン中のお客様自身の予約一覧をSupabaseから取得する。マイページ・予約
// タブ・予約履歴タブの3画面で同じ内容を表示するための共通フック。
export function useRemoteReservations() {
  const { profile } = useAuthStore();
  const [fetched, setFetched] = useState<RemoteReservation[]>([]);

  useEffect(() => {
    // profileが無い(未ログイン)場合はここでは何もしない。返す一覧は下で
    // profileの有無から直接導出するので、エフェクト側で同期的にsetStateする
    // 必要がない。
    if (!profile || !isSupabaseConfigured) return;
    let cancelled = false;
    supabase
      .from('reservations')
      .select('id, location_name, requested_datetime, guest_count, companion_count, duration_hours, status')
      .eq('customer_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setFetched((data as RemoteReservation[] | null) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  return { reservations: profile ? fetched : [] };
}
