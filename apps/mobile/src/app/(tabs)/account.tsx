import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth-store';
import { useRemoteReservations } from '@/lib/use-remote-reservations';
import { STATUS_LABEL } from '@/lib/types';
import { formatDateTimeJST } from '@/lib/format';
import { Badge, Card, PressableCard, SecondaryButton, palette } from '@/components/ui';
import { GlamourStrip } from '@/components/glamour';
import { EmailVerificationField } from '@/components/email-verification';
import { ProfileForm } from '@/components/profile-form';

export default function AccountScreen() {
  const router = useRouter();
  const { isLoggedIn, needsProfile, profile, signOut } = useAuthStore();
  const [email, setEmail] = useState('');
  const { reservations } = useRemoteReservations();
  const [editing, setEditing] = useState(false);

  const activeReservation = reservations.find((r) => r.status !== 'completed' && r.status !== 'cancelled');

  if (!isLoggedIn) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <GlamourStrip title="マイページ" />
        <Card style={styles.card}>
          <Text style={styles.rowLabel}>ログイン</Text>
          <Text style={styles.emailHint}>メールアドレスで認証コードを受け取り、ログインしてください</Text>
          <EmailVerificationField email={email} onEmailChange={setEmail} />
        </Card>
      </ScrollView>
    );
  }

  if (needsProfile) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <GlamourStrip title="マイページ" />
        <Card style={styles.card}>
          <ProfileForm />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <GlamourStrip title="マイページ" />

      {activeReservation && (
        <PressableCard style={styles.activeCard} onPress={() => router.push(`/reservation/${activeReservation.id}`)}>
          <View style={styles.activeCardHeader}>
            <Text style={styles.activeCardTitle}>進行中の予約</Text>
            <Badge label={STATUS_LABEL[activeReservation.status]} tone="warning" />
          </View>
          <Text style={styles.activeCardBody}>
            {formatDateTimeJST(activeReservation.requested_datetime)} ・ 女の子{activeReservation.companion_count}名
          </Text>
        </PressableCard>
      )}

      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>お客様情報</Text>
          <SecondaryButton label={editing ? '閉じる' : '編集'} onPress={() => setEditing((v) => !v)} />
        </View>
        {editing ? (
          <ProfileForm
            initialValues={{ fullName: profile!.fullName, phoneNumber: profile!.phoneNumber, address: profile!.address }}
            onSaved={() => setEditing(false)}
          />
        ) : (
          <>
            <Text style={styles.profileValue}>{profile!.fullName}</Text>
            <Text style={styles.profileValue}>{profile!.phoneNumber}</Text>
            <Text style={styles.profileValue}>{profile!.address}</Text>
            <Text style={styles.emailHint}>{profile!.email}</Text>
          </>
        )}
      </Card>

      <Card style={styles.row}>
        <Text style={styles.rowLabel}>お問い合わせ</Text>
        <Text style={styles.rowValue}>予約や当日の内容についてのご相談はこちら</Text>
      </Card>

      <SecondaryButton label="ログアウト" onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, gap: 12 },
  card: { gap: 8 },
  activeCard: { gap: 6 },
  activeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeCardTitle: { fontSize: 14, fontWeight: '700', color: palette.text },
  activeCardBody: { fontSize: 13, color: palette.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: palette.text },
  rowValue: { fontSize: 13, color: palette.textMuted, flexShrink: 1, textAlign: 'right' },
  emailHint: { fontSize: 11, color: palette.textFaint, marginTop: -4 },
  profileValue: { fontSize: 14, color: palette.text },
});
