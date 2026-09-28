import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth-store';
import { useRemoteReservations, type RemoteReservation } from '@/lib/use-remote-reservations';
import { STATUS_LABEL, type ReservationStatus } from '@/lib/types';
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
  const { isLoggedIn } = useAuthStore();
  const { reservations } = useRemoteReservations();

  const renderItem = ({ item }: { item: RemoteReservation }) => (
    <PressableCard style={styles.item} onPress={() => router.push(`/reservation/${item.id}`)}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemVenue}>{item.location_name}</Text>
        <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
      </View>
      <Text style={styles.itemMeta}>{formatDateTimeJST(item.requested_datetime)}</Text>
      <Text style={styles.itemMeta}>
        女の子{item.companion_count}名 ・ {item.duration_hours}時間
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
      ListEmptyComponent={
        <Text style={styles.empty}>
          {isLoggedIn ? '予約履歴はありません' : 'ログインすると予約履歴が確認できます（マイページからログイン）'}
        </Text>
      }
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
