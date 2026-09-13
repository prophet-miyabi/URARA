import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { calculatePrice } from '@companion-dispatch/pricing';
import { useReservationStore } from '@/lib/reservation-store';
import { isValidEmail } from '@/lib/profile';
import type { BookingType, Location } from '@/lib/types';
import { formatDateTimeJST, formatYen } from '@/lib/format';
import { Card, PlatinumButton, SecondaryButton, palette } from '@/components/ui';
import { GlamourStrip } from '@/components/glamour';
import { CalendarPicker, TimeWheelPicker, firstAvailableHour, isSameDay } from '@/components/calendar';
import { LocationPicker } from '@/components/location-picker';
import { EmailVerificationField } from '@/components/email-verification';

const STEP_LABELS = ['ご予約内容', 'お支払い・確認'];
const BODY_TYPES = ['スレンダー', '普通体型', 'グラマー', 'ぽっちゃり'];
const PERSONALITIES = ['朗らか', '上品', '社交的', '癒し', '気配り', '華やか'];

export default function BookingScreen() {
  const router = useRouter();
  const { savedLocations, recordLocationUsage, contactEmail, updateContactEmail, createReservation, verifiedEmail } =
    useReservationStore();
  const [step, setStep] = useState(0);

  const [location, setLocation] = useState<Location | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());
  const [selectedHour, setSelectedHour] = useState<number | null>(() => firstAvailableHour(new Date()));
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [guestCount, setGuestCount] = useState(4);
  const [companionCount, setCompanionCount] = useState(1);
  // キャストの希望: デフォルトは「おまかせ」（ワンタップで完了）。
  // 「こだわりを伝える」を選んだ時だけ、体型・性格の簡単な選択肢を表示する。
  const [wantsPreference, setWantsPreference] = useState(false);
  const [bodyType, setBodyType] = useState<string | null>(null);
  const [personalities, setPersonalities] = useState<string[]>([]);
  const [preferenceNotes, setPreferenceNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [email, setEmail] = useState(contactEmail);
  const [emailTouched, setEmailTouched] = useState(false);
  const [lastSeenContactEmail, setLastSeenContactEmail] = useState(contactEmail);

  // contactEmail loads asynchronously from storage after mount; sync the
  // field once it arrives, but never once the user has started typing.
  if (!emailTouched && contactEmail !== lastSeenContactEmail) {
    setLastSeenContactEmail(contactEmail);
    setEmail(contactEmail);
  }

  const price = calculatePrice({ companionCount, durationHours: 2 });

  const scheduledIso = useMemo(() => {
    if (!selectedDate || selectedHour === null) return null;
    const d = new Date(selectedDate);
    d.setHours(selectedHour, selectedMinute, 0, 0);
    return d.toISOString();
  }, [selectedDate, selectedHour, selectedMinute]);

  const requestedDatetime = scheduledIso;
  // 「今すぐ予約」ボタンは廃止し、カレンダーで当日を選べばそれが「今すぐ」に相当する。
  // 運営側の即日フラグ（電話確認を促す）は選択日が当日かどうかから自動判定する。
  const bookingType: BookingType = selectedDate && isSameDay(selectedDate, new Date()) ? 'now' : 'scheduled';

  const canProceedStep0 = location !== null && scheduledIso !== null;
  const isEmailVerified = verifiedEmail !== null && verifiedEmail === email.trim().toLowerCase();
  const canSubmit = isValidEmail(email) && isEmailVerified && agreedToPolicy;

  const handleSelectLocation = (loc: Location) => {
    setLocation(loc);
    recordLocationUsage(loc);
  };

  const togglePersonality = (p: string) => {
    setPersonalities((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const finalizeReservation = (trimmedEmail: string) => {
    if (!location || !requestedDatetime) return;
    const preferenceParts: string[] = [];
    if (wantsPreference && bodyType) preferenceParts.push(`体型: ${bodyType}`);
    if (wantsPreference && personalities.length > 0) preferenceParts.push(`性格・雰囲気: ${personalities.join('・')}`);
    const preferenceSummary = preferenceParts.length > 0 ? `【キャストのご希望】${preferenceParts.join(' / ')}` : null;
    const preferenceNoteLine =
      wantsPreference && preferenceNotes.trim() ? `【服装・その他のご希望】${preferenceNotes.trim()}` : null;
    const combinedNotes = [preferenceSummary, preferenceNoteLine, notes.trim()].filter(Boolean).join('\n');

    const reservation = createReservation({
      location,
      bookingType,
      requestedDatetime,
      guestCount,
      companionCount,
      durationHours: 2,
      paymentMethod: 'cash',
      notes: combinedNotes,
      contactEmail: trimmedEmail,
    });
    router.replace(`/reservation/${reservation.id}`);
  };

  const handleSubmit = () => {
    if (!location || !requestedDatetime || !canSubmit) return;
    const trimmedEmail = email.trim();
    if (trimmedEmail !== contactEmail) updateContactEmail(trimmedEmail);
    finalizeReservation(trimmedEmail);
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
          <Text style={styles.stepTitle}>ご利用の場所</Text>
          <Text style={styles.stepHint}>
            飲食店・宴会場・イベント会場からお選びください（個人宅・ホテルのお部屋へは派遣できません）
          </Text>
          <LocationPicker value={location} onChange={handleSelectLocation} savedLocations={savedLocations} />

          <Text style={[styles.fieldLabel, { marginTop: 8 }]}>ご利用日時</Text>
          <View style={styles.dateTimeSection}>
            <CalendarPicker
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                setSelectedDate(d);
                setSelectedHour(firstAvailableHour(d));
                setSelectedMinute(0);
              }}
            />
            {selectedDate && selectedHour !== null && (
              <>
                <Text style={styles.fieldLabel}>開始時間</Text>
                <TimeWheelPicker
                  key={selectedDate.toDateString()}
                  date={selectedDate}
                  hour={selectedHour}
                  minute={selectedMinute}
                  onChange={(h, m) => {
                    setSelectedHour(h);
                    setSelectedMinute(m);
                  }}
                />
              </>
            )}
            {scheduledIso && <Text style={styles.selectedDateTime}>選択中: {formatDateTimeJST(scheduledIso)}〜</Text>}
          </View>

          <Stepper label="お客様の人数" value={guestCount} min={1} onChange={setGuestCount} />
          <Stepper label="希望する女の子の人数" value={companionCount} min={1} onChange={setCompanionCount} />

          <Text style={[styles.fieldLabel, { marginTop: 8 }]}>キャストのご希望</Text>
          <View style={styles.toggleRow}>
            <SecondaryButton
              label={!wantsPreference ? '✓ おまかせで手配' : 'おまかせで手配'}
              onPress={() => setWantsPreference(false)}
            />
            <SecondaryButton
              label={wantsPreference ? '✓ こだわりを伝える' : 'こだわりを伝える'}
              onPress={() => setWantsPreference(true)}
            />
          </View>

          {wantsPreference && (
            <View style={styles.preferenceBox}>
              <Text style={styles.fieldLabel}>体型</Text>
              <View style={styles.chipRow}>
                {BODY_TYPES.map((b) => (
                  <Chip key={b} label={b} selected={bodyType === b} onPress={() => setBodyType(bodyType === b ? null : b)} />
                ))}
              </View>

              <Text style={styles.fieldLabel}>性格・雰囲気（複数選択可）</Text>
              <View style={styles.chipRow}>
                {PERSONALITIES.map((p) => (
                  <Chip key={p} label={p} selected={personalities.includes(p)} onPress={() => togglePersonality(p)} />
                ))}
              </View>

              <Text style={styles.fieldLabel}>服装・その他のご希望</Text>
              <TextInput
                style={styles.preferenceNotesInput}
                multiline
                numberOfLines={3}
                placeholder="服装の系統やその他のご希望があればご自由にご記入ください（任意）"
                placeholderTextColor={palette.textFaint}
                value={preferenceNotes}
                onChangeText={setPreferenceNotes}
              />

              <Text style={styles.formNote}>
                ※ あくまでご希望としてお伺いするものです。必ずしもご希望通りのキャストになるとは限りません。
              </Text>
            </View>
          )}

          <Card style={styles.priceCard}>
            <Text style={styles.priceLabel}>料金目安（基本2時間）</Text>
            <Text style={styles.priceValue}>{formatYen(price.totalPrice)}</Text>
            <Text style={styles.priceNote}>※出張料は場所確定後に別途加算されます</Text>
          </Card>
        </View>
      )}

      {step === 1 && (
        <View style={styles.stepBody}>
          <Text style={styles.stepTitle}>お支払い方法・確認</Text>

          <Text style={styles.fieldLabel}>メールアドレス</Text>
          <Text style={styles.stepHint}>本人確認のため、認証コードの送信が必要です</Text>
          <EmailVerificationField
            email={email}
            onEmailChange={(v) => {
              setEmail(v);
              setEmailTouched(true);
            }}
          />

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
            <Text style={styles.priceNote}>当日、現地にて現金でお支払いください</Text>
          </Card>
          <Text style={styles.disclaimer}>
            ご注意: お申込み時点ではまだ予約は確定しません。手配完了後、運営から「予約確定」通知が届いた時点で成立となります。
          </Text>

          <View style={styles.policyBox}>
            <Text style={styles.policyText}>
              キャンセルはご利用日の前日20時まで無料です。それ以降のキャンセル、または無断キャンセルの場合、キャンセル料が発生する場合や、今後のご利用をお断りする場合があります。
            </Text>
            <Pressable style={styles.agreeRow} onPress={() => setAgreedToPolicy((v) => !v)}>
              <Ionicons
                name={agreedToPolicy ? 'checkbox' : 'square-outline'}
                size={20}
                color={agreedToPolicy ? palette.silver : palette.textMuted}
              />
              <Text style={styles.agreeText}>上記のキャンセルポリシーに同意します</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.nav}>
        {step > 0 && <SecondaryButton label="戻る" onPress={() => setStep((s) => s - 1)} />}
        {step < 1 && <PlatinumButton label="次へ" disabled={!canProceedStep0} onPress={() => setStep((s) => s + 1)} />}
        {step === 1 && (
          <PlatinumButton
            label="この内容で申し込む"
            disabled={!canSubmit}
            onPress={handleSubmit}
          />
        )}
      </View>
    </ScrollView>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
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
  progressDotActive: { backgroundColor: palette.silver },
  progressDotText: { fontSize: 12, fontWeight: '700', color: palette.textMuted },
  progressDotTextActive: { color: palette.onSilver },
  progressLabel: { fontSize: 10, color: palette.textMuted, textAlign: 'center' },
  stepBody: { gap: 14 },
  stepTitle: { fontSize: 18, fontWeight: '800', color: palette.text },
  stepHint: { fontSize: 12, color: palette.textMuted, marginTop: -8 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: palette.text, marginTop: 4 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  dateTimeSection: { gap: 12 },
  selectedDateTime: { color: palette.silverBright, fontSize: 13, fontWeight: '700' },
  stepperRow: { gap: 6 },
  stepperControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperValue: { fontSize: 16, fontWeight: '700', minWidth: 40, textAlign: 'center', color: palette.text },
  preferenceBox: { gap: 8 },
  preferenceNotesInput: {
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    backgroundColor: palette.card,
    color: palette.text,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: palette.card,
  },
  chipSelected: { borderColor: palette.silver, backgroundColor: palette.silver },
  chipText: { color: palette.text, fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: palette.onSilver, fontWeight: '800' },
  formNote: { fontSize: 11, color: palette.textFaint, lineHeight: 16 },
  priceCard: { gap: 4, backgroundColor: palette.neutralBg },
  priceLabel: { fontSize: 12, color: palette.textMuted },
  priceValue: { fontSize: 24, fontWeight: '800', color: palette.silverBright },
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
  policyBox: {
    gap: 10,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 10,
    padding: 12,
    backgroundColor: palette.card,
  },
  policyText: { fontSize: 12, color: palette.textMuted, lineHeight: 18 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  agreeText: { fontSize: 13, color: palette.text, fontWeight: '600', flexShrink: 1 },
  emailError: { color: palette.danger, fontSize: 11, marginTop: -8 },
  nav: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
});
