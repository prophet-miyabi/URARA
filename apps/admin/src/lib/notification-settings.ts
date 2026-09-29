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

export async function setOperatorEmails(emails: string[]): Promise<boolean> {
  if (!isSupabaseConfigured || !supabaseAdmin) return false;
  const { error } = await supabaseAdmin
    .from('notification_settings')
    .upsert({ id: 1, operator_emails: emails, updated_at: new Date().toISOString() });
  return !error;
}
