import { ScrollView, StyleSheet, Text } from 'react-native';
import { Badge, Card, palette } from '@/components/ui';
import { GlamourStrip } from '@/components/glamour';

export default function AccountScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <GlamourStrip title="マイページ" />

      <Card style={styles.card}>
        <Text style={styles.name}>山本 太郎 様</Text>
        <Text style={styles.phone}>080-1234-5678</Text>
      </Card>

      <Card style={styles.row}>
        <Text style={styles.rowLabel}>本人確認</Text>
        <Badge label="確認済み" tone="success" />
      </Card>

      <Card style={styles.row}>
        <Text style={styles.rowLabel}>デフォルト支払い方法</Text>
        <Text style={styles.rowValue}>カード（Visa •••• 1234）</Text>
      </Card>

      <Card style={styles.row}>
        <Text style={styles.rowLabel}>通知設定</Text>
        <Text style={styles.rowValue}>予約確定通知: ON</Text>
      </Card>

      <Card style={styles.row}>
        <Text style={styles.rowLabel}>お問い合わせ</Text>
        <Text style={styles.rowValue}>予約や当日の内容についてのご相談はこちら</Text>
      </Card>

      <Text style={styles.note}>
        ※本画面はモックデータで動作するプレビューです。会員登録・本人確認アップロード等は次フェーズで実装します。
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, gap: 12 },
  card: { gap: 4 },
  name: { fontSize: 18, fontWeight: '800', color: palette.text },
  phone: { fontSize: 13, color: palette.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: palette.text },
  rowValue: { fontSize: 13, color: palette.textMuted, flexShrink: 1, textAlign: 'right' },
  note: { fontSize: 11, color: palette.textFaint, marginTop: 8 },
});
