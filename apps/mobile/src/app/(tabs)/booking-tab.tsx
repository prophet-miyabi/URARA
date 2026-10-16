import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRemoteReservations } from '@/lib/use-remote-reservations';
import { PlatinumButton, palette } from '@/components/ui';
import { GlassCard, HeroBand, ReservationRow, SceneWrapper, SectionLabel } from '@/components/scene';

const HERO_IMAGE = require('../../../assets/scene/hero-booking.webp');

export default function BookingTabScreen() {
  const router = useRouter();
  const { reservations } = useRemoteReservations();

  const activeReservations = reservations.filter(
    (r) => r.status !== 'completed' && r.status !== 'cancelled'
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SceneWrapper>
        <HeroBand
          image={HERO_IMAGE}
          imageAlign="cover"
          title={'ご希望の日時で\n特別なひとときを。'}
          subtitle={'人気のキャストから\nご希望の時間でご予約いただけます。'}
        />

        <View style={styles.body}>
          <PlatinumButton
            label="今すぐ予約する"
            icon={<Ionicons name="calendar-outline" size={18} color={palette.onSilver} />}
            onPress={() => router.push('/booking')}
          />

          <SectionLabel>進行中の予約</SectionLabel>
          {activeReservations.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.empty}>進行中の予約はありません</Text>
            </GlassCard>
          ) : (
            activeReservations.map((r) => (
              <ReservationRow key={r.id} reservation={r} onPress={() => router.push(`/reservation/${r.id}`)} />
            ))
          )}
        </View>
      </SceneWrapper>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { paddingBottom: 32 },
  body: { paddingHorizontal: 18, paddingTop: 6, gap: 12 },
  emptyCard: { paddingVertical: 28, paddingHorizontal: 16 },
  empty: { color: palette.textMuted, textAlign: 'center', fontSize: 13 },
});
