import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuthStore } from '@/lib/auth-store';
import { PlatinumButton, palette } from './ui';

// ログイン直後、まだ氏名・電話番号・住所を登録していないお客様に表示する
// 初回プロフィール登録フォーム（マイページでの再編集にも流用する）。
export function ProfileForm({
  initialValues,
  onSaved,
}: {
  initialValues?: { fullName: string; phoneNumber: string; address: string };
  onSaved?: () => void;
}) {
  const { saveProfile } = useAuthStore();
  const [fullName, setFullName] = useState(initialValues?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(initialValues?.phoneNumber ?? '');
  const [address, setAddress] = useState(initialValues?.address ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = fullName.trim().length > 0 && phoneNumber.trim().length > 0 && address.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    const result = await saveProfile({ fullName, phoneNumber, address });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved?.();
  };

  return (
    <View style={styles.container}>
      {!initialValues && (
        <>
          <Text style={styles.title}>お客様情報のご登録</Text>
          <Text style={styles.hint}>次回からログインするだけでご予約いただけるよう、初回のみご登録をお願いします</Text>
        </>
      )}

      <Text style={styles.fieldLabel}>お名前</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder="山田 太郎"
        placeholderTextColor={palette.textFaint}
        autoComplete="name"
        textContentType="name"
      />

      <Text style={styles.fieldLabel}>電話番号</Text>
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="090-1234-5678"
        placeholderTextColor={palette.textFaint}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />

      <Text style={styles.fieldLabel}>ご住所</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="山梨県甲府市..."
        placeholderTextColor={palette.textFaint}
        autoComplete="street-address"
        textContentType="fullStreetAddress"
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <PlatinumButton
        label={saving ? '保存中...' : initialValues ? '更新する' : '登録する'}
        onPress={handleSave}
        disabled={!canSave || saving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  title: { fontSize: 15, fontWeight: '800', color: palette.text },
  hint: { fontSize: 12, color: palette.textMuted, marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: palette.text, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    // iPhoneのSafariは16px未満の入力欄にフォーカスすると画面を自動で拡大してしまう。
    fontSize: 16,
    color: palette.text,
    backgroundColor: palette.card,
  },
  errorText: { color: palette.danger, fontSize: 11 },
});
