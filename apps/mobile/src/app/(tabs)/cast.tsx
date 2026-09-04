import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, GoldButton, GoldDivider, SecondaryButton, palette } from '@/components/ui';
import { GlamourStrip } from '@/components/glamour';

const BODY_TYPES = ['スレンダー', '普通体型', 'グラマー', 'ぽっちゃり'];
const PERSONALITIES = ['朗らか', '上品', '社交的', '癒し', '気配り', '華やか'];

export default function CastScreen() {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [bodyType, setBodyType] = useState<string | null>(null);
  const [companionCount, setCompanionCount] = useState(1);
  const [personalities, setPersonalities] = useState<string[]>([]);

  const togglePersonality = (p: string) => {
    setPersonalities((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleProceed = () => {
    const parts: string[] = [];
    if (bodyType) parts.push(`体型: ${bodyType}`);
    parts.push(`女の子人数: ${companionCount}名`);
    if (personalities.length > 0) parts.push(`性格・雰囲気: ${personalities.join('・')}`);
    const notes = `【ご希望】${parts.join(' / ')}`;
    router.push({ pathname: '/booking', params: { notes, companionCount: String(companionCount) } });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <GlamourStrip title="キャスト" />
      <Text style={styles.hint}>
        個別のキャストのご指名は承っておりません。下のボタンからご希望のイメージをお伝えいただければ、運営が当日ご希望に近いキャストを手配いたします。
      </Text>
      <GoldDivider />

      {!formOpen ? (
        <GoldButton label="キャストを呼ぶ" onPress={() => setFormOpen(true)} />
      ) : (
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>ご希望をお聞かせください</Text>

          <Text style={styles.fieldLabel}>体型</Text>
          <View style={styles.chipRow}>
            {BODY_TYPES.map((b) => (
              <Chip key={b} label={b} selected={bodyType === b} onPress={() => setBodyType(bodyType === b ? null : b)} />
            ))}
          </View>

          <Text style={styles.fieldLabel}>女の子の人数</Text>
          <View style={styles.stepperControl}>
            <SecondaryButton label="−" onPress={() => setCompanionCount((v) => Math.max(1, v - 1))} />
            <Text style={styles.stepperValue}>{companionCount}名</Text>
            <SecondaryButton label="＋" onPress={() => setCompanionCount((v) => v + 1)} />
          </View>

          <Text style={styles.fieldLabel}>性格・雰囲気（複数選択可）</Text>
          <View style={styles.chipRow}>
            {PERSONALITIES.map((p) => (
              <Chip key={p} label={p} selected={personalities.includes(p)} onPress={() => togglePersonality(p)} />
            ))}
          </View>

          <GoldButton label="この内容で予約に進む" onPress={handleProceed} />
          <Text style={styles.formNote}>
            ※ あくまでご希望としてお伺いするものです。必ずしもご希望通りのキャストになるとは限りません。
          </Text>
        </Card>
      )}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, gap: 14 },
  hint: { color: palette.textMuted, fontSize: 12, lineHeight: 18 },
  formCard: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: palette.text },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: palette.text, marginTop: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: palette.bgElevated,
  },
  chipSelected: { borderColor: palette.gold, backgroundColor: palette.gold },
  chipText: { color: palette.text, fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: palette.onGold, fontWeight: '800' },
  stepperControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperValue: { fontSize: 16, fontWeight: '700', minWidth: 48, textAlign: 'center', color: palette.text },
  formNote: { fontSize: 11, color: palette.textFaint, lineHeight: 16, marginTop: 4 },
});
