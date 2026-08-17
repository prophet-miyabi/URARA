import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette } from './ui';

const HERO_IMAGE = require('../../assets/images/hero-toast.png');
const STRIP_IMAGE = require('../../assets/images/dinner-toast.png');

const BOKEH_LARGE = [
  { top: '6%', left: '78%', size: 46, opacity: 0.16 },
  { top: '58%', left: '4%', size: 60, opacity: 0.12 },
  { top: '80%', left: '70%', size: 34, opacity: 0.14 },
  { top: '20%', left: '10%', size: 22, opacity: 0.18 },
  { top: '38%', left: '88%', size: 18, opacity: 0.2 },
  { top: '68%', left: '40%', size: 14, opacity: 0.22 },
  { top: '10%', left: '46%', size: 12, opacity: 0.2 },
  { top: '86%', left: '20%', size: 16, opacity: 0.16 },
] as const;

export function BokehField({ dense = false }: { dense?: boolean }) {
  const dots = dense ? BOKEH_LARGE : BOKEH_LARGE.slice(0, 5);
  return (
    <View style={[StyleSheet.absoluteFill, styles.noPointerEvents]}>
      {dots.map((d, i) => (
        <View
          key={i}
          style={[
            styles.bokehDot,
            {
              top: d.top,
              left: d.left,
              width: d.size,
              height: d.size,
              borderRadius: d.size / 2,
              opacity: d.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function SilhouetteMotif({
  size = 220,
  opacity = 0.14,
  style,
}: {
  size?: number;
  opacity?: number;
  style?: object;
}) {
  return (
    <MaterialCommunityIcons
      name="human-female"
      size={size}
      color={palette.goldBright}
      style={[{ opacity }, style]}
    />
  );
}

export function GlamourHero({ children }: { children: React.ReactNode }) {
  return (
    <ImageBackground source={HERO_IMAGE} style={styles.hero} imageStyle={styles.heroImage}>
      <LinearGradient
        colors={['rgba(11,11,12,0.55)', 'rgba(11,11,12,0.75)', 'rgba(11,11,12,0.92)']}
        style={StyleSheet.absoluteFill}
      />
      <BokehField dense />
      <View style={styles.heroContent}>{children}</View>
    </ImageBackground>
  );
}

export function GlamourStrip({ title }: { title: string }) {
  return (
    <ImageBackground source={STRIP_IMAGE} style={styles.strip} imageStyle={styles.heroImage}>
      <LinearGradient colors={['rgba(11,11,12,0.72)', 'rgba(11,11,12,0.88)']} style={StyleSheet.absoluteFill} />
      <BokehField />
      <SilhouetteMotif size={140} opacity={0.3} style={styles.stripSilhouette} />
      <Text style={styles.stripTitle}>{title}</Text>
    </ImageBackground>
  );
}

export function TrustBadges({ compact = false }: { compact?: boolean }) {
  const items = ['本人確認 徹底', '明朗会計', '前日まで無料キャンセル'];
  return (
    <View style={[styles.trustRow, compact && styles.trustRowCompact]}>
      {items.map((label) => (
        <View key={label} style={styles.trustBadge}>
          <MaterialCommunityIcons name="shield-check" size={12} color={palette.gold} />
          <Text style={styles.trustLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bokehDot: {
    position: 'absolute',
    backgroundColor: palette.goldBright,
  },
  noPointerEvents: { pointerEvents: 'none' },
  hero: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    overflow: 'hidden',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  heroImage: { resizeMode: 'cover' },
  heroContent: { alignItems: 'center', gap: 10 },
  strip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    overflow: 'hidden',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  stripSilhouette: { position: 'absolute', right: -10, bottom: -20 },
  stripTitle: { color: palette.cream, fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22 },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 },
  trustRowCompact: { justifyContent: 'flex-start' },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: palette.goldDeep,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  trustLabel: { color: palette.textMuted, fontSize: 10, fontWeight: '600' },
});
