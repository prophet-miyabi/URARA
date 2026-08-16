import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

export const palette = {
  bg: '#0B0B0C',
  bgElevated: '#171716',
  card: '#1B1A18',
  cardBorder: '#3A3427',
  hairline: '#2A2723',
  text: '#F3EEE3',
  textMuted: '#B9AF9C',
  textFaint: '#7C7568',
  gold: '#D8B872',
  goldBright: '#F3DDA0',
  goldDeep: '#A7822F',
  cream: '#F3EEE3',
  onGold: '#1A1509',
  accentRed: '#B5231A',
  success: '#7CB88B',
  successBg: '#1B2A1F',
  warning: '#D8B872',
  warningBg: '#2A2410',
  danger: '#D97F72',
  dangerBg: '#2A1815',
  neutralBg: '#201F1C',
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

export function GoldButton({
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
      style={({ pressed }) => [styles.goldButton, { opacity: disabled ? 0.35 : pressed ? 0.85 : 1 }]}
    >
      {icon}
      <Text style={styles.goldButtonLabel}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export function CreamButton({
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
      style={({ pressed }) => [styles.creamButton, { opacity: disabled ? 0.35 : pressed ? 0.8 : 1 }]}
    >
      {icon}
      <Text style={styles.creamButtonLabel}>{label}</Text>
      <Text style={[styles.chevron, { color: palette.onGold }]}>›</Text>
    </Pressable>
  );
}

// Legacy aliases kept for screens not yet fully re-themed.
export const PrimaryButton = GoldButton;
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

export function GoldDivider() {
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
  goldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 16,
    backgroundColor: palette.gold,
  },
  goldButtonLabel: {
    color: palette.onGold,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  creamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 15,
    backgroundColor: palette.cream,
  },
  creamButtonLabel: {
    color: palette.onGold,
    fontSize: 15,
    fontWeight: '700',
  },
  chevron: {
    color: palette.onGold,
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
  dividerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: palette.gold },
});
