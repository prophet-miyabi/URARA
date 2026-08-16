import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useReservationStore } from '@/lib/reservation-store';
import { STATUS_LABEL, type Reservation, type ReservationStatus } from '@/lib/types';
import { formatDateTimeJST } from '@/lib/format';
import { Badge, PressableCard, palette } from '@/components/ui';
import { GlamourStrip } from '@/components/glamour';

const STATUS_TONE: Record<ReservationStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  received: 'neutral',
  arranging: 'warning',
  confirmed: 'success',
  completed: 'neutral',
  cancelled: 'danger',
};

export default function HistoryScreen() {
  const router = useRouter();
  const { reservations, venues } = useReservationStore();

  const venueName = (id: string) => venues.find((v) => v.id === id)?.name ?? '';

  const renderItem = ({ item }: { item: Reservation }) => (
    <PressableCard style={styles.item} onPress={() => router.push(`/reservation/${item.id}`)}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemVenue}>{venueName(item.venueId)}</Text>
        <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
      </View>
      <Text style={styles.itemMeta}>{formatDateTimeJST(item.requestedDatetime)}</Text>
      <Text style={styles.itemMeta}>
        女の子{item.companionCount}名 ・ {item.durationHours}時間
      </Text>
    </PressableCard>
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={reservations}
      keyExtractor={(r) => r.id}
      renderItem={renderItem}
      ListHeaderComponent={<GlamourStrip title="予約履歴" />}
      ListEmptyComponent={<Text style={styles.empty}>予約履歴はありません</Text>}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, gap: 12 },
  item: { gap: 6 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemVenue: { fontSize: 15, fontWeight: '700', color: palette.text },
  itemMeta: { fontSize: 13, color: palette.textMuted },
  empty: { textAlign: 'center', color: palette.textMuted, marginTop: 40 },
});
