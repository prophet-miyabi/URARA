import { isSupabaseConfigured, supabaseAdmin } from './supabase-admin';

// Supabaseが未設定な環境や、テーブルがまだ空の場合のための最低限のフォール
// バック。通常運用ではnotification_settingsテーブルの値が使われる。
const FALLBACK_EMAILS = process.env.OPERATOR_NOTIFY_EMAIL ? [process.env.OPERATOR_NOTIFY_EMAIL] : [];

export async function getOperatorEmails(): Promise<string[]> {
  if (!isSupabaseConfigured || !supabaseAdmin) return FALLBACK_EMAILS;
  // 運営宛の通知先取得はあくまで付随的な処理。ここが一時的なネットワーク障害等で
  // 落ちても、呼び出し元のお客様向けメール送信までブロックしてはならない。
  try {
    const { data } = await supabaseAdmin
      .from('notification_settings')
      .select('operator_emails')
      .eq('id', 1)
      .maybeSingle();
    const emails = data?.operator_emails as string[] | undefined;
    return emails && emails.length > 0 ? emails : FALLBACK_EMAILS;
  } catch (err) {
    console.error('getOperatorEmails failed, falling back', err);
    return FALLBACK_EMAILS;
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 障害警告の宛先は「管理画面にログインできる管理者2人」。ログイン用の
// ユーザー名（メールアドレス）をそのまま使うので、管理者を入れ替えれば
// 警告の宛先も自動で追従する。メールアドレスの形式でなければ通知先一覧に退避する。
export async function getAlertRecipients(): Promise<string[]> {
  const admins = [process.env.ADMIN_USERNAME, process.env.ADMIN_USERNAME_2].filter(
    (u): u is string => Boolean(u) && EMAIL_PATTERN.test(u as string)
  );
  return admins.length > 0 ? admins : getOperatorEmails();
}

export async function setOperatorEmails(emails: string[]): Promise<boolean> {
  if (!isSupabaseConfigured || !supabaseAdmin) return false;
  const { error } = await supabaseAdmin
    .from('notification_settings')
    .upsert({ id: 1, operator_emails: emails, updated_at: new Date().toISOString() });
  return !error;
}
