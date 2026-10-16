import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuthStore } from '@/lib/auth-store';
import { useRemoteReservations } from '@/lib/use-remote-reservations';
import { palette } from '@/components/ui';
import {
  GlassCard,
  HeroBand,
  MenuRow,
  PromoBanner,
  ReservationRow,
  SceneWrapper,
  SectionLabel,
  serifJa,
} from '@/components/scene';
import { EmailVerificationField } from '@/components/email-verification';
import { ProfileForm } from '@/components/profile-form';

const HERO_IMAGE = require('../../../assets/scene/hero-account.webp');
// 下部のバナーは横長なので、縦長のヒーロー画像とは別に、顔から肩までが
// 収まる切り出しを使う（同じ画像を流用すると頭だけが見えてしまう）。
const BANNER_IMAGE = require('../../../assets/scene/banner-account.webp');
const SUPPORT_PHONE = '090-5671-0985';

export default function AccountScreen() {
  const router = useRouter();
  const { isLoggedIn, needsProfile, profile, signOut } = useAuthStore();
  const [email, setEmail] = useState('');
  const { reservations } = useRemoteReservations();
  const [editing, setEditing] = useState(false);

  const activeReservation = reservations.find((r) => r.status !== 'completed' && r.status !== 'cancelled');

  if (!isLoggedIn) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SceneWrapper>
          <HeroBand
            image={HERO_IMAGE}
            height={300}
            title={'特別なひとときを、\nもっと華やかに。'}
            subtitle={'ログインすると、ご予約の状況や\n履歴をご確認いただけます。'}
          />
          <View style={styles.body}>
            <GlassCard style={styles.formCard}>
              <Text style={styles.formTitle}>ログイン</Text>
              <Text style={styles.formHint}>メールアドレスで認証コードを受け取り、ログインしてください</Text>
              <EmailVerificationField email={email} onEmailChange={setEmail} />
            </GlassCard>
          </View>
        </SceneWrapper>
      </ScrollView>
    );
  }

  if (needsProfile) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SceneWrapper>
          <HeroBand
            image={HERO_IMAGE}
            height={220}
            title={'はじめまして。'}
            subtitle={'次回からログインするだけでご予約いただけるよう\n初回のみご登録をお願いします。'}
          />
          <View style={styles.body}>
            <GlassCard style={styles.formCard}>
              <ProfileForm />
            </GlassCard>
          </View>
        </SceneWrapper>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <SceneWrapper>
        {/* お名前のヘッダー */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={34} color={palette.silver} />
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>
              {profile!.fullName} <Text style={styles.profileHonorific}>様</Text>
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {profile!.email}
            </Text>
            <Text style={styles.profileThanks}>いつもご利用いただきありがとうございます。</Text>
          </View>
        </View>

        <View style={styles.body}>
          {activeReservation && (
            <>
              <SectionLabel>進行中の予約</SectionLabel>
              <ReservationRow
                reservation={activeReservation}
                onPress={() => router.push(`/reservation/${activeReservation.id}`)}
              />
            </>
          )}

          <GlassCard>
            <MenuRow
              icon="person-outline"
              title="お客様情報"
              subtitle={editing ? '編集を閉じる' : 'お名前・電話番号・ご住所の確認・変更'}
              onPress={() => setEditing((v) => !v)}
            />
            <MenuRow icon="call-outline" title="お問い合わせ" subtitle={`予約や当日の内容についてのご相談はこちら ・ ${SUPPORT_PHONE}`} last />
          </GlassCard>

          {editing ? (
            <GlassCard style={styles.formCard}>
              <ProfileForm
                initialValues={{ fullName: profile!.fullName, phoneNumber: profile!.phoneNumber, address: profile!.address }}
                onSaved={() => setEditing(false)}
              />
            </GlassCard>
          ) : (
            <GlassCard style={styles.infoCard}>
              <InfoLine icon="person-outline" value={profile!.fullName} />
              <InfoLine icon="call-outline" value={profile!.phoneNumber} />
              <InfoLine icon="location-outline" value={profile!.address} />
            </GlassCard>
          )}

          <PromoBanner
            image={BANNER_IMAGE}
            title={'宴会・パーティーを\nもっと華やかに。'}
            subtitle="ご希望の日時で、かんたん予約"
            onPress={() => router.push('/booking')}
          />

          <Pressable onPress={signOut} style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}>
            <Ionicons name="log-out-outline" size={16} color={palette.textMuted} />
            <Text style={styles.logoutLabel}>ログアウト</Text>
          </Pressable>
        </View>
      </SceneWrapper>
    </ScrollView>
  );
}

function InfoLine({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Ionicons name={icon} size={14} color={palette.textFaint} />
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { paddingBottom: 32 },
  body: { paddingHorizontal: 18, paddingTop: 6, gap: 12 },
  formCard: { padding: 16, gap: 8 },
  formTitle: { color: palette.text, fontFamily: serifJa, fontSize: 18, letterSpacing: 1 },
  formHint: { color: palette.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 4 },

  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 10 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { flex: 1, gap: 3 },
  profileName: { color: palette.silverBright, fontFamily: serifJa, fontSize: 22, letterSpacing: 2 },
  profileHonorific: { fontSize: 15, letterSpacing: 1 },
  profileEmail: { color: palette.textMuted, fontSize: 11 },
  profileThanks: { color: palette.silver, fontSize: 11, marginTop: 2 },

  infoCard: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoValue: { color: palette.text, fontSize: 14, flex: 1 },

  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, minHeight: 44 },
  logoutPressed: { opacity: 0.6 },
  logoutLabel: { color: palette.textMuted, fontSize: 13, letterSpacing: 0.5 },
});
