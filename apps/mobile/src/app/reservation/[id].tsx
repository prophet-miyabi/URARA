import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { calculatePrice } from '@companion-dispatch/pricing';
import { useReservationStore } from '@/lib/reservation-store';
import { STATUS_LABEL, STATUS_STEPS } from '@/lib/types';
import { formatDateTimeJST, formatYen } from '@/lib/format';
import { Badge, Card, palette } from '@/components/ui';
import { GlamourStrip } from '@/components/glamour';

const STAGE_MESSAGE: Record<string, string> = {
  received: 'ご予約依頼を受け付けました。運営が対応可能なキャストを手配中です。',
  arranging: '運営がキャストを手配しています。手配が整い次第、確定通知をお送りします。',
  confirmed: 'ご予約が確定しました。当日はキャストがお店へお伺いします。',
  completed: 'ご利用ありがとうございました。またのご利用をお待ちしております。',
};

export default function ReservationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getReservation, venues } = useReservationStore();
  const reservation = getReservation(id);

  if (!reservation) {
    return (
      <View style={styles.screen}>
        <Text style={styles.notFound}>予約が見つかりませんでした</Text>
      </View>
    );
  }

  const venue = venues.find((v) => v.id === reservation.venueId);
  const price = calculatePrice({
    companionCount: reservation.companionCount,
    durationHours: reservation.durationHours,
    travelFee: reservation.travelFee,
  });
  const currentIndex = STATUS_STEPS.indexOf(reservation.status);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <GlamourStrip title="予約状況" />
      <Card style={styles.stepperCard}>
        {reservation.status === 'cancelled' ? (
          <Badge label="キャンセル済み" tone="danger" />
        ) : (
          <>
            <View style={styles.stepperRow}>
              {STATUS_STEPS.map((s, i) => (
                <View key={s} style={styles.stepperItem}>
                  <View style={[styles.stepDot, i <= currentIndex && styles.stepDotActive]} />
                  <Text style={[styles.stepLabel, i <= currentIndex && styles.stepLabelActive]}>
                    {STATUS_LABEL[s]}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.stageMessage}>{STAGE_MESSAGE[reservation.status]}</Text>
          </>
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>予約内容</Text>
        <Row label="店舗" value={venue?.name ?? '-'} />
        <Row label="日時" value={formatDateTimeJST(reservation.requestedDatetime)} />
        <Row label="お客様人数" value={`${reservation.guestCount}名`} />
        <Row label="女の子人数" value={`${reservation.companionCount}名`} />
        <Row label="利用時間" value={`${reservation.durationHours}時間`} />
        <Row label="お支払い方法" value={reservation.paymentMethod === 'cash' ? '現金' : 'カード'} />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>お支払い金額</Text>
        <Row label="基本料金" value={formatYen(price.basePrice)} />
        {price.extensionPrice > 0 && <Row label="延長料金" value={formatYen(price.extensionPrice)} />}
        <Row label="出張料" value={formatYen(price.travelFee)} />
        <View style={styles.divider} />
        <Row label="合計" value={formatYen(price.totalPrice)} bold />
      </Card>

      {(reservation.status === 'received' || reservation.status === 'arranging' || reservation.status === 'confirmed') && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>キャンセルについて</Text>
          <Text style={styles.cancelNote}>
            前日までのキャンセルは無料です。当日のキャンセルは女の子1名につき¥13,200のキャンセル料が発生します。
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, gap: 16 },
  notFound: { textAlign: 'center', color: palette.textMuted, marginTop: 40 },
  stepperCard: { alignItems: 'center' },
  stepperRow: { flexDirection: 'row', width: '100%' },
  stepperItem: { flex: 1, alignItems: 'center', gap: 4 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: palette.neutralBg },
  stepDotActive: { backgroundColor: palette.gold },
  stepLabel: { fontSize: 10, color: palette.textMuted, textAlign: 'center' },
  stepLabelActive: { color: palette.text, fontWeight: '700' },
  stageMessage: { color: palette.textMuted, fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 18 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: palette.text, marginBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 13, color: palette.textMuted },
  rowValue: { fontSize: 13, fontWeight: '600', color: palette.text },
  rowValueBold: { fontSize: 16, fontWeight: '800', color: palette.goldBright },
  divider: { height: 1, backgroundColor: palette.cardBorder, marginVertical: 2 },
  cancelNote: { fontSize: 12, color: palette.textMuted, lineHeight: 18 },
});
