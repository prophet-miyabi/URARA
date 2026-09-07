import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { isValidEmail } from '@/lib/profile';
import { requestOtpCode, verifyOtpCode } from '@/lib/email-otp';
import { useReservationStore } from '@/lib/reservation-store';
import { PlatinumButton, SecondaryButton, palette } from './ui';

const RESEND_COOLDOWN_SECONDS = 60;

export function EmailVerificationField({
  email,
  onEmailChange,
}: {
  email: string;
  onEmailChange: (value: string) => void;
}) {
  const { verifiedEmail, setVerification, clearVerification } = useReservationStore();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [lastSeenEmail, setLastSeenEmail] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const trimmedEmail = email.trim().toLowerCase();
  const isVerified = verifiedEmail !== null && verifiedEmail === trimmedEmail;

  // メールアドレスの入力内容が変わるたびに、進行中のコード入力状態はリセットする
  // (レンダー中に直接setStateする方式。React docsが推奨する「前回値との比較で
  // 状態を同期する」パターンで、useEffectでの実施より不要な再レンダーが少ない）。
  if (trimmedEmail !== lastSeenEmail) {
    setLastSeenEmail(trimmedEmail);
    setCodeSent(false);
    setCode('');
    setError(null);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!isValidEmail(email) || sending || cooldown > 0) return;
    setSending(true);
    setError(null);
    const result = await requestOtpCode(trimmedEmail);
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCodeSent(true);
    startCooldown();
  };

  const handleVerify = async () => {
    if (code.trim().length !== 6 || verifying) return;
    setVerifying(true);
    setError(null);
    const result = await verifyOtpCode(trimmedEmail, code.trim());
    setVerifying(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setVerification(trimmedEmail, result.token);
    setCodeSent(false);
    setCode('');
  };

  const handleChangeEmail = (value: string) => {
    onEmailChange(value);
    if (verifiedEmail && value.trim().toLowerCase() !== verifiedEmail) {
      clearVerification();
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, isVerified && styles.inputVerified]}
        value={email}
        onChangeText={handleChangeEmail}
        placeholder="you@example.com"
        placeholderTextColor={palette.textFaint}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isVerified}
      />

      {isVerified ? (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedBadgeText}>✓ 認証済み</Text>
        </View>
      ) : (
        <>
          {email.length > 0 && !isValidEmail(email) && (
            <Text style={styles.errorText}>メールアドレスの形式が正しくありません</Text>
          )}

          {isValidEmail(email) && !codeSent && (
            <SecondaryButton
              label={sending ? '送信中...' : '認証コードを送信'}
              onPress={handleSendCode}
              disabled={sending}
            />
          )}

          {isValidEmail(email) && codeSent && (
            <View style={styles.verifyBlock}>
              <Text style={styles.hint}>届いた6桁のコードを入力してください</Text>
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="123456"
                placeholderTextColor={palette.textFaint}
                keyboardType="number-pad"
                maxLength={6}
              />
              <PlatinumButton
                label={verifying ? '確認中...' : '確認する'}
                onPress={handleVerify}
                disabled={verifying || code.trim().length !== 6}
              />
              <SecondaryButton
                label={cooldown > 0 ? `再送信まで ${cooldown}秒` : 'コードを再送信'}
                onPress={handleSendCode}
                disabled={cooldown > 0 || sending}
              />
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: palette.text,
    backgroundColor: palette.card,
  },
  inputVerified: { borderColor: palette.success, opacity: 0.6 },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: palette.successBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedBadgeText: { color: palette.success, fontSize: 12, fontWeight: '700' },
  verifyBlock: { gap: 8, marginTop: 2 },
  hint: { color: palette.textMuted, fontSize: 12 },
  codeInput: {
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 18,
    letterSpacing: 4,
    color: palette.text,
    backgroundColor: palette.card,
  },
  errorText: { color: palette.danger, fontSize: 11, marginTop: -2 },
});
