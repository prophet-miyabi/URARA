import { StyleSheet, Text, View } from 'react-native';
import type { Location } from '@/lib/types';
import { palette } from './ui';

export const isMapConfigured = false;

// 地図によるピン留め選択は現在Web版のみ対応（map-picker.web.tsx）。ネイティブ版は
// @stripe/stripe-react-native 同様、実際にネイティブビルドする段階で
// react-native-maps 等を使って実装する。
export function MapPicker({ onChange: _onChange }: { initialLocation: Location | null; onChange: (location: Location) => void }) {
  return (
    <View style={styles.box}>
      <Text style={styles.noticeText}>※ 地図での選択は現在Web版のみ対応しています。キーワード検索をご利用ください。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 10,
    padding: 14,
    backgroundColor: palette.card,
  },
  noticeText: { color: palette.textFaint, fontSize: 11, lineHeight: 16 },
});
