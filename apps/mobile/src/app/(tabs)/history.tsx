import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth-store';
import { useRemoteReservations, type RemoteReservation } from '@/lib/use-remote-reservations';
import { palette } from '@/components/ui';
import { GlassCard, HeroBand, MAX_SCENE_WIDTH, ReservationRow } from '@/components/scene';

const HERO_IMAGE = require('../../../assets/scene/hero-history.webp');

export default function HistoryScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { reservations } = useRemoteReservations();

  const renderItem = ({ item }: { item: RemoteReservation }) => (
    <View style={styles.item}>
      <ReservationRow reservation={item} onPress={() => router.push(`/reservation/${item.id}`)} />
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={reservations}
      keyExtractor={(r) => r.id}
      renderItem={renderItem}
      ListHeaderComponent={
        <HeroBand
          image={HERO_IMAGE}
          title={'これまでの\n特別な時間を\n振り返って。'}
          subtitle={'ご利用いただいた予約の履歴を\nご確認いただけます。'}
          height={250}
        />
      }
      ListHeaderComponentStyle={styles.header}
      ListEmptyComponent={
        <View style={styles.item}>
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.empty}>
              {isLoggedIn ? '予約履歴はありません' : 'ログインすると予約履歴が確認できます（マイページからログイン）'}
            </Text>
          </GlassCard>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { paddingBottom: 32, width: '100%', maxWidth: MAX_SCENE_WIDTH, alignSelf: 'center' },
  header: { marginBottom: 6 },
  item: { paddingHorizontal: 18, paddingBottom: 12 },
  emptyCard: { paddingVertical: 28, paddingHorizontal: 16 },
  empty: { textAlign: 'center', color: palette.textMuted, fontSize: 13, lineHeight: 20 },
});
