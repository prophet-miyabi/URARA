import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
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
});
