import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { sendAccountCreatedEmail, sendLoginNotificationEmail } from './notify';
import { isSupabaseConfigured, supabase } from './supabase';

export interface CustomerProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  email: string;
}

type AuthResult = { ok: true } | { ok: false; error: string };

interface AuthStore {
  loading: boolean;
  isLoggedIn: boolean;
  email: string | null;
  profile: CustomerProfile | null;
  // ログイン済みだが、氏名・電話番号・住所をまだ登録していない状態
  needsProfile: boolean;
  sendLoginCode: (email: string) => Promise<AuthResult>;
  verifyLoginCode: (email: string, code: string) => Promise<AuthResult>;
  saveProfile: (input: { fullName: string; phoneNumber: string; address: string }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthStore | null>(null);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  // isSupabaseConfiguredはモジュール定数（レンダー中に変わらない）なので、
  // 初期値そのものをこれで決めてしまえば、エフェクト内で無条件にsetStateする
  // 必要がなくなる。
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from('customers').select('*').eq('id', userId).maybeSingle();
    if (data) {
      setProfile({
        id: data.id,
        fullName: data.full_name,
        phoneNumber: data.phone_number,
        address: data.address,
        email: data.email,
      });
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadProfile(newSession.user.id);
        // SIGNED_INは実際のログイン操作（OTP認証成功）でのみ発火する。アプリ起動時の
        // セッション復元（INITIAL_SESSION）やトークン自動更新では通知しない。
        if (event === 'SIGNED_IN') {
          supabase
            .from('customers')
            .select('full_name')
            .eq('id', newSession.user.id)
            .maybeSingle()
            .then(({ data }) => {
              sendLoginNotificationEmail(data?.full_name || 'お客', newSession.access_token);
            });
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const sendLoginCode = useCallback(async (email: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { ok: false, error: 'サーバー側でログイン機能が未設定です' };
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizeEmail(email),
      options: { shouldCreateUser: true },
    });
    if (error) {
      // Supabase側のエラー内容（レート制限やSMTP設定不備など）を握りつぶさず、
      // 画面上にもそのまま出す。原因調査を素早く行うための一時的な計測。
      console.error('signInWithOtp failed', error.status, error.code, error.message);
      return { ok: false, error: `コードの送信に失敗しました（詳細: ${error.message}）` };
    }
    return { ok: true };
  }, []);

  const verifyLoginCode = useCallback(async (email: string, code: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.verifyOtp({
      email: normalizeEmail(email),
      token: code,
      type: 'email',
    });
    if (error) return { ok: false, error: 'コードが正しくないか、有効期限が切れています' };
    return { ok: true };
  }, []);

  const saveProfile = useCallback(
    async (input: { fullName: string; phoneNumber: string; address: string }): Promise<AuthResult> => {
      if (!session) return { ok: false, error: 'ログインが必要です' };
      const isNewProfile = profile === null;
      const { error } = await supabase.from('customers').upsert({
        id: session.user.id,
        full_name: input.fullName.trim(),
        phone_number: input.phoneNumber.trim(),
        address: input.address.trim(),
        email: session.user.email ?? '',
      });
      if (error) return { ok: false, error: '保存に失敗しました。しばらくしてから再度お試しください。' };
      await loadProfile(session.user.id);
      if (isNewProfile) {
        sendAccountCreatedEmail(input.fullName.trim(), session.access_token);
      }
      return { ok: true };
    },
    [session, profile, loadProfile]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthStore>(
    () => ({
      loading,
      isLoggedIn: session !== null,
      email: session?.user.email ?? null,
      profile,
      needsProfile: session !== null && profile === null,
      sendLoginCode,
      verifyLoginCode,
      saveProfile,
      signOut,
    }),
    [loading, session, profile, sendLoginCode, verifyLoginCode, saveProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthStore() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthStore must be used within AuthProvider');
  return ctx;
}
