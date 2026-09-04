import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useReservationStore } from '@/lib/reservation-store';
import { STATUS_LABEL, STATUS_STEPS, type ReservationStatus } from '@/lib/types';
import { formatDateTimeJST } from '@/lib/format';
import { Badge, GoldButton, PressableCard, palette } from '@/components/ui';
import { GlamourStrip } from '@/components/glamour';

export default function BookingTabScreen() {
  const router = useRouter();
  const { reservations } = useReservationStore();

  const activeReservations = reservations.filter(
    (r) => r.status !== 'completed' && r.status !== 'cancelled'
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <GlamourStrip title="ご予約" />

      <GoldButton
        label="新しく予約する"
        icon={<Ionicons name="add-circle" size={18} color={palette.onGold} />}
        onPress={() => router.push('/booking')}
      />

      {activeReservations.length === 0 ? (
        <Text style={styles.empty}>進行中の予約はありません</Text>
      ) : (
        <View style={styles.list}>
          <Text style={styles.sectionLabel}>進行中の予約</Text>
          {activeReservations.map((r) => {
            const currentIndex = STATUS_STEPS.indexOf(r.status as ReservationStatus);
            return (
              <PressableCard key={r.id} style={styles.card} onPress={() => router.push(`/reservation/${r.id}`)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardVenue}>{r.location.name}</Text>
                  <Badge label={STATUS_LABEL[r.status]} tone="warning" />
                </View>
                <Text style={styles.cardMeta}>{formatDateTimeJST(r.requestedDatetime)}</Text>
                <View style={styles.stepDots}>
                  {STATUS_STEPS.map((s, i) => (
                    <View key={s} style={[styles.dot, i <= currentIndex && styles.dotActive]} />
                  ))}
                </View>
              </PressableCard>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, gap: 18 },
  empty: { color: palette.textMuted, textAlign: 'center', marginTop: 30, fontSize: 13 },
  list: { gap: 10 },
  sectionLabel: { color: palette.textMuted, fontSize: 12, fontWeight: '700' },
  card: { gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardVenue: { color: palette.text, fontSize: 15, fontWeight: '700' },
  cardMeta: { color: palette.textMuted, fontSize: 12 },
  stepDots: { flexDirection: 'row', gap: 6, marginTop: 2 },
  dot: { flex: 1, height: 3, borderRadius: 2, backgroundColor: palette.hairline },
  dotActive: { backgroundColor: palette.gold },
});
