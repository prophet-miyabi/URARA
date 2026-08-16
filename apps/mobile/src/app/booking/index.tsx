import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { calculatePrice } from '@companion-dispatch/pricing';
import { useReservationStore } from '@/lib/reservation-store';
import type { BookingType, PaymentMethod } from '@/lib/types';
import { formatDateTimeJST, formatYen } from '@/lib/format';
import { Card, PressableCard, GoldButton, SecondaryButton, palette } from '@/components/ui';
import { GlamourStrip, TrustBadges } from '@/components/glamour';

const STEP_LABELS = ['店舗選択', '予約内容', 'お支払い・確認'];

function presetTimeSlots(): { label: string; iso: string }[] {
  const now = new Date();
  const slots: { label: string; iso: string }[] = [];
  for (const daysAhead of [0, 1, 2]) {
    for (const hour of [18, 20, 22]) {
      const d = new Date(now);
      d.setDate(d.getDate() + daysAhead);
      d.setHours(hour, 0, 0, 0);
      if (d.getTime() <= now.getTime()) continue;
      slots.push({ label: formatDateTimeJST(d.toISOString()), iso: d.toISOString() });
    }
  }
  return slots.slice(0, 6);
}

export default function BookingScreen() {
  const router = useRouter();
  const { venues, createReservation } = useReservationStore();
  const [step, setStep] = useState(0);

  const [venueId, setVenueId] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<BookingType>('scheduled');
  const [scheduledIso, setScheduledIso] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(4);
  const [companionCount, setCompanionCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [notes, setNotes] = useState('');

  const slots = useMemo(presetTimeSlots, []);
  const price = calculatePrice({ companionCount, durationHours: 2 });

  const requestedDatetime = bookingType === 'now' ? new Date().toISOString() : scheduledIso;

  const canProceedStep0 = venueId !== null;
  const canProceedStep1 = bookingType === 'now' || scheduledIso !== null;

  const handleSubmit = () => {
    if (!venueId || !requestedDatetime) return;
    const reservation = createReservation({
      venueId,
      bookingType,
      requestedDatetime,
      guestCount,
      companionCount,
      durationHours: 2,
      paymentMethod,
      notes,
    });
    router.replace(`/reservation/${reservation.id}`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <GlamourStrip title="ご予約手続き" />
      <View style={styles.progress}>
        {STEP_LABELS.map((label, i) => (
          <View key={label} style={styles.progressItem}>
            <View style={[styles.progressDot, i <= step && styles.progressDotActive]}>
              <Text style={[styles.progressDotText, i <= step && styles.progressDotTextActive]}>{i + 1}</Text>
            </View>
            <Text style={styles.progressLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {step === 0 && (
        <View style={styles.stepBody}>
          <Text style={styles.stepTitle}>利用する店舗を選択してください</Text>
          <Text style={styles.stepHint}>登録済みの飲食店・宴会場・イベント会場のみご利用いただけます</Text>
          {venues.map((v) => (
            <PressableCard
              key={v.id}
              style={[styles.venueCard, venueId === v.id && styles.venueCardSelected]}
              onPress={() => setVenueId(v.id)}
            >
              <Text style={styles.venueName}>{v.name}</Text>
              <Text style={styles.venueCity}>{v.city}</Text>
            </PressableCard>
          ))}
        </View>
      )}

      {step === 1 && (
        <View style={styles.stepBody}>
          <Text style={styles.stepTitle}>予約内容</Text>

          <Text style={styles.fieldLabel}>ご利用日時</Text>
          <View style={styles.toggleRow}>
            <SecondaryButton
              label={bookingType === 'now' ? '✓ 今すぐ予約' : '今すぐ予約'}
              onPress={() => setBookingType('now')}
            />
            <SecondaryButton
              label={bookingType === 'scheduled' ? '✓ 日時指定' : '日時指定'}
              onPress={() => setBookingType('scheduled')}
            />
          </View>

          {bookingType === 'scheduled' && (
            <View style={styles.slotGrid}>
              {slots.map((s) => (
                <PressableCard
                  key={s.iso}
                  style={[styles.slotCard, scheduledIso === s.iso && styles.venueCardSelected]}
                  onPress={() => setScheduledIso(s.iso)}
                >
                  <Text style={styles.slotLabel}>{s.label}</Text>
                </PressableCard>
              ))}
            </View>
          )}

          <Stepper label="お客様の人数" value={guestCount} min={1} onChange={setGuestCount} />
          <Stepper label="希望する女の子の人数" value={companionCount} min={1} onChange={setCompanionCount} />

          <Card style={styles.priceCard}>
            <Text style={styles.priceLabel}>料金目安（基本2時間）</Text>
            <Text style={styles.priceValue}>{formatYen(price.totalPrice)}</Text>
            <Text style={styles.priceNote}>※出張料は店舗確定後に別途加算されます</Text>
          </Card>
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepBody}>
          <Text style={styles.stepTitle}>お支払い方法・確認</Text>

          <Text style={styles.fieldLabel}>お支払い方法</Text>
          <View style={styles.toggleRow}>
            <SecondaryButton
              label={paymentMethod === 'cash' ? '✓ 現金' : '現金'}
              onPress={() => setPaymentMethod('cash')}
            />
            <SecondaryButton
              label={paymentMethod === 'card' ? '✓ カード' : 'カード'}
              onPress={() => setPaymentMethod('card')}
            />
          </View>

          <Text style={styles.fieldLabel}>ご要望・連絡事項</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="任意でご記入ください"
            placeholderTextColor={palette.textFaint}
            value={notes}
            onChangeText={setNotes}
          />

          <Card style={styles.priceCard}>
            <Text style={styles.priceLabel}>お支払い予定金額</Text>
            <Text style={styles.priceValue}>{formatYen(price.totalPrice)}</Text>
            <Text style={styles.priceNote}>
              {paymentMethod === 'card'
                ? 'このお申込み時点でカードに課金されます（出張料は後日追加）'
                : '当日、現地にて現金でお支払いください'}
            </Text>
          </Card>
          <Text style={styles.disclaimer}>
            ご注意: お申込み時点ではまだ予約は確定しません。手配完了後、運営から「予約確定」通知が届いた時点で成立となります。
          </Text>
          <TrustBadges compact />
        </View>
      )}

      <View style={styles.nav}>
        {step > 0 && <SecondaryButton label="戻る" onPress={() => setStep((s) => s - 1)} />}
        {step < 2 && (
          <GoldButton
            label="次へ"
            disabled={step === 0 ? !canProceedStep0 : !canProceedStep1}
            onPress={() => setStep((s) => s + 1)}
          />
        )}
        {step === 2 && <GoldButton label="この内容で申し込む" onPress={handleSubmit} />}
      </View>
    </ScrollView>
  );
}

function Stepper({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.stepperControl}>
        <SecondaryButton label="−" onPress={() => onChange(Math.max(min, value - 1))} />
        <Text style={styles.stepperValue}>{value}名</Text>
        <SecondaryButton label="＋" onPress={() => onChange(value + 1)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, gap: 20, paddingBottom: 60 },
  progress: { flexDirection: 'row', justifyContent: 'space-between' },
  progressItem: { alignItems: 'center', gap: 4, flex: 1 },
  progressDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.neutralBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: palette.gold },
  progressDotText: { fontSize: 12, fontWeight: '700', color: palette.textMuted },
  progressDotTextActive: { color: palette.onGold },
  progressLabel: { fontSize: 10, color: palette.textMuted, textAlign: 'center' },
  stepBody: { gap: 14 },
  stepTitle: { fontSize: 18, fontWeight: '800', color: palette.text },
  stepHint: { fontSize: 12, color: palette.textMuted, marginTop: -8 },
  venueCard: { gap: 2 },
  venueCardSelected: { borderColor: palette.gold, borderWidth: 2 },
  venueName: { fontSize: 15, fontWeight: '700', color: palette.text },
  venueCity: { fontSize: 12, color: palette.textMuted },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: palette.text, marginTop: 4 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotCard: { paddingVertical: 10, paddingHorizontal: 12 },
  slotLabel: { fontSize: 12, fontWeight: '600', color: palette.text },
  stepperRow: { gap: 6 },
  stepperControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperValue: { fontSize: 16, fontWeight: '700', minWidth: 40, textAlign: 'center', color: palette.text },
  priceCard: { gap: 4, backgroundColor: palette.neutralBg },
  priceLabel: { fontSize: 12, color: palette.textMuted },
  priceValue: { fontSize: 24, fontWeight: '800', color: palette.goldBright },
  priceNote: { fontSize: 11, color: palette.textMuted },
  textArea: {
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: palette.card,
    color: palette.text,
  },
  disclaimer: { fontSize: 11, color: palette.textMuted, lineHeight: 16 },
  nav: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
});
