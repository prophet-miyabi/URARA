import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { palette } from './ui';

const LOGO_IMAGE = require('../../assets/urara-crest.webp');

export function GlamourStrip({ title }: { title: string }) {
  return (
    <View style={styles.strip}>
      <Text style={styles.stripTitle}>{title}</Text>
      <Image source={LOGO_IMAGE} style={styles.stripLogo} contentFit="contain" />
    </View>
  );
}

export function TrustBadges({ compact = false }: { compact?: boolean }) {
  const items = ['本人確認 徹底', '明朗会計', '前日まで無料キャンセル'];
  return (
    <View style={[styles.trustRow, compact && styles.trustRowCompact]}>
      {items.map((label) => (
        <View key={label} style={styles.trustBadge}>
          <MaterialCommunityIcons name="shield-check" size={12} color={palette.silver} />
          <Text style={styles.trustLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  stripTitle: { color: '#000000', fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, flexShrink: 1 },
  stripLogo: { width: 64, height: 46, flexShrink: 0 },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 },
  trustRowCompact: { justifyContent: 'flex-start' },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: palette.silverDeep,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  trustLabel: { color: palette.textMuted, fontSize: 10, fontWeight: '600' },
});
