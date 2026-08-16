import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MOCK_CAST } from '@/lib/mock-data';
import { Card, GoldDivider, palette } from '@/components/ui';
import { GlamourStrip } from '@/components/glamour';

export default function CastScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <GlamourStrip title="キャスト紹介" />
      <Text style={styles.hint}>
        ご紹介中のキャストの一部です。当日の手配は運営にて調整いたします（このアプリからの指名予約は現在対応しておりません）。
      </Text>
      <GoldDivider />

      <View style={styles.grid}>
        {MOCK_CAST.map((c) => (
          <Card key={c.id} style={styles.castCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{c.nickname.charAt(0)}</Text>
            </View>
            <Text style={styles.nickname}>{c.nickname}</Text>
            <Text style={styles.tone}>{c.tone}</Text>
            <Text style={styles.tagline}>{c.tagline}</Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, gap: 14 },
  hint: { color: palette.textMuted, fontSize: 12, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  castCard: { width: '47%', alignItems: 'center', gap: 4, paddingVertical: 20 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarLetter: { color: palette.gold, fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22 },
  nickname: { color: palette.text, fontSize: 15, fontWeight: '700' },
  tone: { color: palette.goldBright, fontSize: 11, fontWeight: '600' },
  tagline: { color: palette.textMuted, fontSize: 11, textAlign: 'center', marginTop: 2 },
});
