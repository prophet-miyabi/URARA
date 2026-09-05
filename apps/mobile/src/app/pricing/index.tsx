import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { calculatePrice, DEFAULT_PRICING_RULES } from '@companion-dispatch/pricing';
import { formatYen } from '@/lib/format';
import { Card, PlatinumButton, SecondaryButton, PlatinumDivider, palette } from '@/components/ui';
import { GlamourStrip } from '@/components/glamour';

const COVERAGE_AREAS = ['甲府市', '笛吹市（石和温泉エリア）', '中巨摩郡昭和町'];

export default function PricingScreen() {
  const router = useRouter();
  const [companionCount, setCompanionCount] = useState(1);
  const [durationHours, setDurationHours] = useState(DEFAULT_PRICING_RULES.baseHours);

  const price = calculatePrice({ companionCount, durationHours });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <GlamourStrip title="料金・対応エリア" />

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>対応エリア</Text>
        <Text style={styles.sectionHint}>現在、山梨県内の下記エリアを中心に対応しております。</Text>
        <View style={styles.areaList}>
          {COVERAGE_AREAS.map((area) => (
            <View key={area} style={styles.areaChip}>
              <Ionicons name="location" size={14} color={palette.silver} />
              <Text style={styles.areaChipText}>{area}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.sectionNote}>
          ※ 上記以外のエリアもご相談に応じます。お気軽にお問い合わせください。出張料は場所確定後に別途ご案内いたします。
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>料金シミュレーション</Text>
        <Text style={styles.sectionHint}>女の子の人数・ご利用時間を選ぶと、目安の料金が表示されます。</Text>

        <PlatinumDivider />

        <Stepper
          label="女の子の人数"
          value={companionCount}
          min={DEFAULT_PRICING_RULES.minCompanionCount}
          onChange={setCompanionCount}
        />
        <Stepper
          label="ご利用時間"
          value={durationHours}
          min={DEFAULT_PRICING_RULES.baseHours}
          suffix="時間"
          onChange={setDurationHours}
        />

        <View style={styles.priceBreakdown}>
          <Row label={`基本料金（${DEFAULT_PRICING_RULES.baseHours}時間・女の子${companionCount}名）`} value={formatYen(price.basePrice)} />
          {price.extensionPrice > 0 && (
            <Row label={`延長料金（${price.extensionHours}時間分）`} value={formatYen(price.extensionPrice)} />
          )}
          <View style={styles.divider} />
          <Row label="合計目安" value={formatYen(price.totalPrice)} bold />
        </View>
        <Text style={styles.sectionNote}>※ 出張料は含まれておりません。場所確定後に別途加算されます。</Text>
      </Card>

      <PlatinumButton label="この内容で予約する" onPress={() => router.push('/booking')} />
    </ScrollView>
  );
}

function Stepper({
  label,
  value,
  min,
  suffix = '名',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControl}>
        <SecondaryButton label="−" onPress={() => onChange(Math.max(min, value - 1))} />
        <Text style={styles.stepperValue}>
          {value}
          {suffix}
        </Text>
        <SecondaryButton label="＋" onPress={() => onChange(value + 1)} />
      </View>
    </View>
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
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  card: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: palette.text },
  sectionHint: { fontSize: 12, color: palette.textMuted, marginTop: -4 },
  sectionNote: { fontSize: 11, color: palette.textFaint, lineHeight: 16, marginTop: 4 },
  areaList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: palette.bgElevated,
  },
  areaChipText: { color: palette.text, fontSize: 12, fontWeight: '600' },
  stepperRow: { gap: 6 },
  stepperLabel: { fontSize: 13, fontWeight: '700', color: palette.text },
  stepperControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperValue: { fontSize: 16, fontWeight: '700', minWidth: 56, textAlign: 'center', color: palette.text },
  priceBreakdown: { gap: 6, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 13, color: palette.textMuted, flexShrink: 1 },
  rowValue: { fontSize: 13, fontWeight: '600', color: palette.text },
  rowValueBold: { fontSize: 18, fontWeight: '800', color: palette.silverBright },
  divider: { height: 1, backgroundColor: palette.cardBorder, marginVertical: 2 },
});
