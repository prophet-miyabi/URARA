import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// expo export(静的書き出し)はNode上でルートを事前レンダリングするため、
// windowが存在しない。SupabaseのAuthクライアントはクライアント生成時に
// storageから即座にセッション復元を試みるため、AsyncStorage(Web版は内部で
// window.localStorageを使う)をそのまま渡すとNodeでの事前レンダリング時に
// クラッシュする。ブラウザ以外では何もしないダミーのstorageを使い、実際の
// セッション復元は実ブラウザでのハイドレーション後に任せる。
const noopStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

const authStorage = typeof window === 'undefined' ? noopStorage : AsyncStorage;

// 未設定でもアプリ自体は起動できるよう、ダミーの値でクライアントだけは作っておく
// (isSupabaseConfiguredがfalseの間は呼び出し側が実際の利用を避ける想定)。
export const supabase = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_ANON_KEY || 'placeholder', {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
