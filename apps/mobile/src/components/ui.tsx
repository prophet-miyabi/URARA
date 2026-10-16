import { Platform, Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const palette = {
  bg: '#050505',
  bgElevated: '#151517',
  card: '#151517',
  // 黒ガラスの縁。暗い背景の上で、うっすら光る線に見える。
  cardBorder: 'rgba(255, 255, 255, 0.12)',
  hairline: 'rgba(255, 255, 255, 0.08)',
  text: '#F5F5F7',
  textMuted: '#8E8E93',
  textFaint: '#6C6C70',
  silver: '#E0E0E0',
  silverBright: '#FFFFFF',
  silverDeep: '#9E9E9E',
  onSilver: '#000000',
  success: '#7CB88B',
  successBg: '#16241C',
  warning: '#D0D0D5',
  warningBg: '#242424',
  danger: '#D97F72',
  dangerBg: '#2A1815',
  neutralBg: '#1E1E21',
};

// 日本語の見出しは明朝体で。Web版のみ配信のため、明朝が無い端末では
// ブラウザ既定のセリフ体に落ちる（ネイティブは既定フォントのまま）。
export const serifJa = Platform.select({
  web: "'Hiragino Mincho ProN', 'Yu Mincho', YuMincho, 'Noto Serif JP', 'Noto Serif CJK JP', serif",
  default: undefined,
});

export function Card({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest} />;
}

export function PressableCard({
  style,
  onPress,
  children,
}: {
  style?: ViewProps['style'];
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View style={[styles.card, style, pressed && styles.cardPressed]}>{children}</View>
      )}
    </Pressable>
  );
}

// ホーム画面の主ボタンと同じ、銀の箔押し風のグラデーションを持つ主ボタン。
export function PlatinumButton({
  label,
  onPress,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.platinumButton, { opacity: disabled ? 0.35 : pressed ? 0.85 : 1 }]}
    >
      <LinearGradient
        colors={[palette.silverBright, palette.silver, palette.silverDeep]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {icon}
      <Text style={styles.platinumButtonLabel}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

// Legacy aliases kept for screens not yet fully re-themed.
export const PrimaryButton = PlatinumButton;
export const SecondaryButton = ({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [styles.outlineButton, { opacity: disabled ? 0.35 : pressed ? 0.6 : 1 }]}
  >
    <Text style={styles.outlineButtonLabel}>{label}</Text>
  </Pressable>
);

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  const bg = { neutral: palette.neutralBg, success: palette.successBg, warning: palette.warningBg, danger: palette.dangerBg }[tone];
  const fg = { neutral: palette.textMuted, success: palette.success, warning: palette.warning, danger: palette.danger }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeLabel, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function PlatinumDivider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <View style={styles.dividerDot} />
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(22, 22, 24, 0.78)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 16,
  },
  cardPressed: {
    opacity: 0.6,
  },
  platinumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    minHeight: 54,
    paddingVertical: 14,
    paddingHorizontal: 20,
    overflow: 'hidden',
    backgroundColor: palette.silver,
  },
  platinumButtonLabel: {
    color: palette.onSilver,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  chevron: {
    color: palette.onSilver,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 2,
  },
  outlineButton: {
    borderRadius: 999,
    paddingVertical: 12,
    // 指で押しやすい最小サイズ（44pt）を確保する。
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  outlineButtonLabel: {
    color: palette.silver,
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: palette.cardBorder },
  dividerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: palette.silver },
});
