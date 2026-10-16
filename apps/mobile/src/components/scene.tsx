import { Pressable, StyleSheet, Text, View, type ImageSourcePropType, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { RemoteReservation } from '@/lib/use-remote-reservations';
import { STATUS_LABEL, type ReservationStatus } from '@/lib/types';
import { formatDateJST, formatTimeRangeJST } from '@/lib/format';
import { Badge, palette, serifJa } from './ui';

// 予約・履歴・マイページ共通の「黒ガラス」調の部品。写真の上に短いコピーを置く
// ヒーロー帯、半透明のカード、サムネイル付きの予約行、メニュー行をまとめている。

export { serifJa };

// 一覧カードのサムネイル。予約ごとの写真は無いので、雰囲気写真を予約IDから
// 決まる順番で割り当てる（同じ予約はいつ見ても同じ写真になる）。
const THUMBNAILS: ImageSourcePropType[] = [
  require('../../assets/scene/thumb-1.webp'),
  require('../../assets/scene/thumb-2.webp'),
  require('../../assets/scene/thumb-3.webp'),
  require('../../assets/scene/thumb-4.webp'),
  require('../../assets/scene/thumb-5.webp'),
  require('../../assets/scene/thumb-6.webp'),
];

export function thumbnailFor(id: string): ImageSourcePropType {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % THUMBNAILS.length;
  return THUMBNAILS[hash];
}

const STATUS_TONE: Record<ReservationStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  received: 'neutral',
  arranging: 'warning',
  confirmed: 'success',
  completed: 'neutral',
  cancelled: 'danger',
};

export const MAX_SCENE_WIDTH = 560;

// 画面全体を、スマホ幅に合わせて中央に寄せる。PCブラウザで横に間延びしないため。
export function SceneWrapper({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.wrapper, style]}>{children}</View>;
}

// 写真の上に見出しと一言を置く帯。写真は右寄せ（左は黒に溶かして文字を乗せる）か、
// 全面（上下左右を暗くして文字を乗せる）のどちらか。
export function HeroBand({
  image,
  imageAlign = 'right',
  height = 220,
  title,
  subtitle,
}: {
  image: ImageSourcePropType;
  imageAlign?: 'right' | 'cover';
  height?: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={[styles.hero, { height }]}>
      <Image
        source={image}
        style={imageAlign === 'cover' ? StyleSheet.absoluteFill : styles.heroImageRight}
        contentFit="cover"
        contentPosition={imageAlign === 'cover' ? 'center' : 'right center'}
        // フェードイン（transition）は付けない。Web版で不透明度が途中のまま
        // 止まり、写真が暗く見えたままになることがあった。
      />
      {/* 左側を黒く落として文字を読みやすくする */}
      {/* 写真は右の70%に置いているので、その左端（30%）までは完全に黒にして
          継ぎ目を隠し、そこから右へ向けて写真を見せていく。 */}
      <LinearGradient
        colors={[palette.bg, 'rgba(5,5,5,0.97)', 'rgba(5,5,5,0.45)', 'rgba(5,5,5,0)']}
        locations={[0, 0.32, 0.5, 0.72]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      {/* 下端は画面の黒へなめらかにつなぐ（写真そのものは暗くしすぎない） */}
      <LinearGradient
        colors={['rgba(5,5,5,0.15)', 'rgba(5,5,5,0)', 'rgba(5,5,5,0)', palette.bg]}
        locations={[0, 0.12, 0.78, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroText}>
        <Text style={styles.heroTitle}>{title}</Text>
        {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

export function GlassCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.glass, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

// サムネイル・日付・場所・人数と時間・状況・矢印を1行に並べた予約カード。
export function ReservationRow({ reservation, onPress }: { reservation: RemoteReservation; onPress: () => void }) {
  const r = reservation;
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View style={[styles.glass, styles.row, pressed && styles.pressed]}>
          <Image source={thumbnailFor(r.id)} style={styles.thumb} contentFit="cover" />
          <View style={styles.rowBody}>
            <Text style={styles.rowDate}>{formatDateJST(r.requested_datetime)}</Text>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {r.location_name}
            </Text>
            <View style={styles.rowMeta}>
              <Ionicons name="people-outline" size={13} color={palette.textMuted} />
              <Text style={styles.rowMetaText}>{r.guest_count}名</Text>
              <Ionicons name="time-outline" size={13} color={palette.textMuted} style={styles.rowMetaIcon} />
              <Text style={styles.rowMetaText}>{formatTimeRangeJST(r.requested_datetime, r.duration_hours)}</Text>
            </View>
            <View style={styles.rowFooter}>
              <Badge label={STATUS_LABEL[r.status]} tone={STATUS_TONE[r.status]} />
              <Text style={styles.rowCast}>キャスト{r.companion_count}名</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
        </View>
      )}
    </Pressable>
  );
}

// マイページのメニュー行。押せる行だけ矢印を出す。
export function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const body = (pressed: boolean) => (
    <View style={[styles.menuRow, !last && styles.menuRowDivider, pressed && styles.pressed]}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={18} color={palette.silver} />
      </View>
      <View style={styles.menuBody}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={palette.textFaint} /> : null}
    </View>
  );
  if (!onPress) return body(false);
  return <Pressable onPress={onPress}>{({ pressed }) => body(pressed)}</Pressable>;
}

// 写真つきの誘導バナー（マイページ下部）。
export function PromoBanner({
  image,
  title,
  subtitle,
  onPress,
}: {
  image: ImageSourcePropType;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View style={[styles.glass, styles.banner, pressed && styles.pressed]}>
          <Image source={image} style={styles.bannerImage} contentFit="cover" contentPosition="center" />
          {/* 写真の右端（約45%）から先を黒に溶かし、顔の部分には暗幕をかけない */}
          <LinearGradient
            colors={['rgba(18,18,20,0)', 'rgba(18,18,20,0)', 'rgba(18,18,20,0.9)', 'rgba(18,18,20,0.98)']}
            locations={[0, 0.3, 0.5, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>{title}</Text>
            <Text style={styles.bannerSubtitle}>{subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={palette.silver} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', maxWidth: MAX_SCENE_WIDTH, alignSelf: 'center' },
  hero: { width: '100%', backgroundColor: palette.bg, justifyContent: 'center', overflow: 'hidden' },
  heroImageRight: { position: 'absolute', top: 0, bottom: 0, right: 0, width: '70%' },
  heroText: { paddingHorizontal: 22, paddingRight: '34%', gap: 12 },
  heroTitle: {
    fontFamily: serifJa,
    fontSize: 23,
    lineHeight: 34,
    letterSpacing: 1.5,
    color: palette.silverBright,
  },
  heroSubtitle: { fontSize: 12, lineHeight: 19, letterSpacing: 0.5, color: palette.silver },

  glass: {
    backgroundColor: 'rgba(22, 22, 24, 0.78)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  pressed: { opacity: 0.7 },
  sectionLabel: { color: palette.textMuted, fontSize: 12, letterSpacing: 1.5, marginTop: 6 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingRight: 10 },
  thumb: { width: 84, height: 84, borderRadius: 12, backgroundColor: palette.neutralBg },
  rowBody: { flex: 1, gap: 3 },
  rowDate: { color: palette.silver, fontSize: 12, letterSpacing: 0.5 },
  rowTitle: { color: palette.text, fontFamily: serifJa, fontSize: 16, letterSpacing: 0.5 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowMetaIcon: { marginLeft: 8 },
  rowMetaText: { color: palette.textMuted, fontSize: 12 },
  rowFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  rowCast: { color: palette.textFaint, fontSize: 11 },

  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 13 },
  menuRowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBody: { flex: 1, gap: 2 },
  menuTitle: { color: palette.text, fontSize: 15, letterSpacing: 0.3 },
  menuSubtitle: { color: palette.textMuted, fontSize: 11 },

  banner: { flexDirection: 'row', alignItems: 'center', height: 112, paddingLeft: 150, paddingRight: 12 },
  bannerImage: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 190 },
  bannerText: { flex: 1, gap: 6 },
  bannerTitle: { color: palette.silverBright, fontFamily: serifJa, fontSize: 16, letterSpacing: 1 },
  bannerSubtitle: { color: palette.silver, fontSize: 11 },
});
