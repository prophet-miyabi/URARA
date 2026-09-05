import { StyleSheet, Text, View } from 'react-native';
import { palette } from './ui';

export function Crest({ size = 64 }: { size?: number }) {
  const inner = size * 0.44;
  return (
    <View style={[styles.crest, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.crestInner, { width: inner, height: inner }]}>
        <Text style={[styles.crestLetter, { fontSize: inner * 0.62 }]}>UR</Text>
      </View>
    </View>
  );
}

export function Wordmark({ size = 'large' }: { size?: 'large' | 'small' }) {
  return (
    <Text style={[styles.wordmark, size === 'large' ? styles.wordmarkLarge : styles.wordmarkSmall]}>
      URARA
    </Text>
  );
}

export function BrandHeader() {
  return (
    <View style={styles.header}>
      <Crest size={68} />
      <Wordmark />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  crest: {
    borderWidth: 1.5,
    borderColor: palette.silver,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestInner: {
    borderWidth: 1,
    borderColor: palette.silverBright,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestLetter: {
    color: palette.silver,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  wordmark: {
    color: palette.silverBright,
    fontFamily: 'PlayfairDisplay_600SemiBold',
    letterSpacing: 6,
  },
  wordmarkLarge: { fontSize: 22 },
  wordmarkSmall: { fontSize: 15, letterSpacing: 4 },
});
