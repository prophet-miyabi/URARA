import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useReservationStore } from '@/lib/reservation-store';
import { STATUS_LABEL } from '@/lib/types';
import { formatDateTimeJST } from '@/lib/format';
import { Badge, GoldButton, CreamButton, GoldDivider, PressableCard, palette } from '@/components/ui';
import { BrandHeader } from '@/components/brand';
import { GlamourHero, TrustBadges } from '@/components/glamour';

const SUPPORT_PHONE = '055-000-1234';
const SUPPORT_HOURS = '受付時間 10:00〜24:00（年中無休）';

export default function HomeScreen() {
  const router = useRouter();
  const { reservations } = useReservationStore();

  const activeReservation = reservations.find(
    (r) => r.status !== 'completed' && r.status !== 'cancelled'
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <BrandHeader />

      <GlamourHero>
        <GoldDivider />
        <Text style={styles.heroTitle}>URARA{'\n'}COMPANION</Text>
        <GoldDivider />
        <Text style={styles.heroTagline}>宴会を、もっと華やかに。</Text>
        <Text style={styles.heroSub}>ご希望の場所へ、かんたん予約</Text>
      </GlamourHero>

      <View style={styles.priceCard}>
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>1名・2時間</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceValue}>13,200</Text>
          <Text style={styles.priceUnit}>円（税込）</Text>
        </View>

        <GoldButton
          label="今すぐ予約する"
          icon={<Ionicons name="calendar" size={18} color={palette.onGold} />}
          onPress={() => router.push('/booking')}
        />
        <CreamButton
          label="電話で相談"
          icon={<Ionicons name="call" size={18} color={palette.onGold} />}
          onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE.replace(/-/g, '')}`)}
        />
        <Text style={styles.priceNote}>お困りの方は、お電話でもご予約いただけます。</Text>
        <Text style={styles.priceHours}>{SUPPORT_HOURS}</Text>
        <TrustBadges />
      </View>

      {activeReservation && (
        <PressableCard style={styles.activeCard} onPress={() => router.push(`/reservation/${activeReservation.id}`)}>
          <View style={styles.activeCardHeader}>
            <Text style={styles.activeCardTitle}>進行中の予約</Text>
            <Badge label={STATUS_LABEL[activeReservation.status]} tone="warning" />
          </View>
          <Text style={styles.activeCardBody}>
            {formatDateTimeJST(activeReservation.requestedDatetime)} ・ 女の子{activeReservation.companionCount}名
          </Text>
        </PressableCard>
      )}

      <View style={styles.tileRow}>
        <Tile icon="people" label="キャストを見る" onPress={() => router.push('/cast')} />
        <Tile icon="location" label="料金・対応エリア" onPress={() => router.push('/cast')} />
        <Tile icon="book" label="初めての方へ" onPress={() => router.push('/account')} />
      </View>
    </ScrollView>
  );
}

function Tile({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <PressableCard style={styles.tile} onPress={onPress}>
      <Ionicons name={icon} size={22} color={palette.gold} />
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileChevron}>›</Text>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, paddingBottom: 48, gap: 18 },
  heroTitle: {
    color: palette.cream,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: 1,
  },
  heroTagline: { color: palette.goldBright, fontSize: 15, fontWeight: '700', marginTop: 4 },
  heroSub: { color: palette.textMuted, fontSize: 12 },
  priceCard: {
    backgroundColor: palette.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 20,
    gap: 12,
    alignItems: 'center',
  },
  priceBadge: {
    borderWidth: 1,
    borderColor: palette.goldDeep,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  priceBadgeText: { color: palette.gold, fontSize: 12, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  priceValue: { color: palette.goldBright, fontSize: 34, fontFamily: 'PlayfairDisplay_700Bold' },
  priceUnit: { color: palette.textMuted, fontSize: 13, marginBottom: 5 },
  priceNote: { color: palette.textFaint, fontSize: 11, textAlign: 'center', marginTop: 2 },
  priceHours: { color: palette.textFaint, fontSize: 11 },
  activeCard: { gap: 6 },
  activeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeCardTitle: { fontSize: 14, fontWeight: '700', color: palette.text },
  activeCardBody: { fontSize: 13, color: palette.textMuted },
  tileRow: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 18 },
  tileLabel: { color: palette.text, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  tileChevron: { color: palette.textFaint, fontSize: 14 },
});
