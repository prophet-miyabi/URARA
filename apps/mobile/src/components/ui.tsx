import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

export const palette = {
  bg: '#050505',
  bgElevated: '#121212',
  card: '#121212',
  cardBorder: '#2A2A2A',
  hairline: '#232323',
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
  neutralBg: '#1C1C1E',
};

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
    backgroundColor: palette.card,
    borderRadius: 14,
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
    paddingVertical: 16,
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
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.bgElevated,
  },
  outlineButtonLabel: {
    color: palette.text,
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
