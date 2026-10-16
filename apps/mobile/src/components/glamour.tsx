import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { palette, serifJa } from './ui';

const LOGO_IMAGE = require('../../assets/urara-crest.webp');

// 予約手続き・予約状況・料金など、写真の帯を持たない画面の見出し。
// 明朝の見出しの右に紋章を置き、タブ画面の帯と同じ黒の地に揃える。
export function GlamourStrip({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.strip}>
      <View style={styles.text}>
        <Text style={styles.stripTitle}>{title}</Text>
        {subtitle ? <Text style={styles.stripSubtitle}>{subtitle}</Text> : null}
      </View>
      <Image source={LOGO_IMAGE} style={styles.stripLogo} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: palette.hairline,
    paddingBottom: 14,
  },
  text: { flexShrink: 1, gap: 4 },
  stripTitle: { color: palette.silverBright, fontFamily: serifJa, fontSize: 22, letterSpacing: 1.5 },
  stripSubtitle: { color: palette.textMuted, fontSize: 12, lineHeight: 18 },
  stripLogo: { width: 72, height: 50, flexShrink: 0, opacity: 0.9 },
});
