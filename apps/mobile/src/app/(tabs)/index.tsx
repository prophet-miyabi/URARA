import { View, Text, StyleSheet, Dimensions, Platform, ScrollView, Pressable, Linking, type TextStyle } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { palette } from '@/components/ui';

// いただいた最高品質のアセットを読み込みます（ロゴは背景を透過済みのPNG）
const LOGO_IMAGE = require('../../../assets/2661.png');
const HERO_IMAGE = require('../../../assets/2746.png');

const CHROME_GRADIENT_CSS =
  'linear-gradient(180deg, #FDFDFD 0%, #D4D4D4 30%, #8A8A8A 55%, #EAEAEA 75%, #FFFFFF 100%)';

// 画像イメージのようなシルバーの箔押し風（クロムグラデーション）テキスト。
// react-native-web は Text の style に未知のCSSプロパティをそのまま透過するため、
// background-clip:text の定番テクニックがネイティブ依存なしで使える
// （このアプリは現状Web版のみ配信のため、ネイティブでは単色フォールバックにする）。
function ChromeText({ children, style }: { children: string; style: TextStyle }) {
  if (Platform.OS === 'web') {
    return (
      <Text
        style={[
          style,
          {
            backgroundImage: CHROME_GRADIENT_CSS,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
          } as TextStyle,
        ]}
      >
        {children}
      </Text>
    );
  }
  return <Text style={[style, { color: palette.textMuted }]}>{children}</Text>;
}

const MAX_CONTENT_WIDTH = 520; // Web環境向けの中央寄せ最大幅
const SUPPORT_PHONE = '055-000-1234';

interface AnimatedButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'gold' | 'white';
  icon?: string;
}

function AnimatedButton({ label, onPress, variant = 'gold', icon }: AnimatedButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    // Reanimated shared values are mutated via `.value` by design — React
    // Compiler's immutability check doesn't know that pattern, hence the disable.
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.95, { damping: 12, stiffness: 300 });
  };

  const handlePressOut = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const isGold = variant === 'gold';

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.buttonWrapper}>
      <Animated.View style={[styles.buttonBase, isGold ? null : styles.buttonWhite, animatedStyle]}>
        {isGold && (
          <LinearGradient
            colors={[palette.goldBright, palette.gold, palette.goldDeep]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.buttonContent}>
          {icon && <Text style={[styles.buttonIcon, { color: isGold ? palette.onGold : palette.bg }]}>{icon}</Text>}
          <Text style={[styles.buttonText, { color: isGold ? palette.onGold : palette.bg }]}>{label}</Text>
          <Text style={[styles.buttonChevron, { color: isGold ? palette.onGold : palette.bg }]}>›</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.contentWrapper}>
          {/* --- Hero Image & Seamless Scrim --- */}
          <View style={styles.heroSection}>
            <Image
              source={HERO_IMAGE}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={800}
              placeholder={{ blurhash: 'L0095f~q~q^k^k^k^k^k^k^k^k^k' }}
            />

            {/* 上部（ロゴ周り）と下部（コンテンツへのトランジション）のグラデーション暗幕 */}
            <LinearGradient
              colors={['rgba(11,11,12,0.8)', 'rgba(11,11,12,0)', 'rgba(11,11,12,0.6)', '#0B0B0C']}
              locations={[0, 0.3, 0.7, 1]}
              style={StyleSheet.absoluteFill}
            />

            {/* --- ブランドロゴ --- */}
            <View style={styles.logoContainer}>
              <Image source={LOGO_IMAGE} style={styles.brandLogo} contentFit="contain" transition={500} />
            </View>

            {/* --- タイトル & キャッチコピー --- */}
            <View style={styles.titleContainer}>
              <ChromeText style={styles.brandTitle}>COMPANION</ChromeText>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerOrnaments}>⚜</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.catchCopy} numberOfLines={1}>宴会を、もっと華やかに。</Text>
              <Text style={styles.subCopy}>ご希望の場所へ、かんたん予約</Text>
            </View>
          </View>

          {/* --- Reservation Card (Glassmorphism) --- */}
          <View style={styles.cardContainer}>
            <BlurView intensity={30} tint="dark" style={styles.glassCard}>
              <Text style={styles.priceRow} allowFontScaling={false}>
                <Text style={styles.priceLabel}>キャスト1名・2時間 </Text>
                <Text style={styles.priceText}>
                  13,200<Text style={styles.priceUnit}>円（税込）</Text>
                </Text>
              </Text>

              <View style={styles.actionGroup}>
                <AnimatedButton icon="🗓" label="今すぐ予約する" onPress={() => router.push('/booking')} variant="gold" />
                <AnimatedButton
                  label="電話で相談"
                  onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE.replace(/-/g, '')}`)}
                  variant="white"
                />
              </View>

              <Text style={styles.footerNote}>お困りの方は、お電話でもご予約いただけます。</Text>
            </BlurView>
          </View>

          {/* --- Bottom Navigation Cards --- */}
          <View style={styles.navCardsRow}>
            <Pressable style={({ pressed }) => [styles.navCard, pressed && { opacity: 0.7 }]} onPress={() => router.push('/cast')}>
              <View style={styles.navCardIconBox}>
                <MaterialCommunityIcons name="human-female" size={32} color={palette.gold} />
              </View>
              <Text style={styles.navCardText}>キャストを見る ›</Text>
            </Pressable>

            <Pressable style={({ pressed }) => [styles.navCard, pressed && { opacity: 0.7 }]} onPress={() => router.push('/cast')}>
              <View style={styles.navCardIconBox}>
                <Ionicons name="location" size={32} color={palette.gold} />
              </View>
              <Text style={styles.navCardText}>料金・対応エリア ›</Text>
            </Pressable>

            <Pressable style={({ pressed }) => [styles.navCard, pressed && { opacity: 0.7 }]} onPress={() => router.push('/account')}>
              <View style={styles.navCardIconBox}>
                <Ionicons name="book" size={32} color={palette.gold} />
              </View>
              <Text style={styles.navCardText}>初めての方へ ›</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const serifFont = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  heroSection: {
    // minHeight (not a fixed height) so the absoluteFill photo always covers
    // whatever the content (logo + title block) actually needs — a fixed
    // height let the content overflow past the box on taller titles/logo,
    // and the glass card below (which intentionally overlaps the hero's
    // bottom edge) ended up covering live text instead of just empty margin.
    minHeight: Dimensions.get('window').height * 0.58,
    alignItems: 'center',
    position: 'relative',
    paddingTop: 64,
  },
  logoContainer: {
    width: 260,
    height: 260,
    marginBottom: 16,
    zIndex: 10,
    borderRadius: 130,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(216, 184, 114, 0.3)',
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    alignItems: 'center',
    zIndex: 10,
    marginTop: 'auto',
    marginBottom: 72,
  },
  brandTitle: {
    fontFamily: serifFont,
    fontSize: 32,
    color: palette.text,
    letterSpacing: 6,
    fontWeight: '300',
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    width: 200,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(216, 184, 114, 0.5)',
  },
  dividerOrnaments: {
    color: palette.gold,
    fontSize: 16,
    marginHorizontal: 12,
  },
  catchCopy: {
    fontFamily: serifFont,
    fontSize: 22,
    color: palette.goldBright,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 12,
  },
  subCopy: {
    fontSize: 16,
    color: palette.text,
    letterSpacing: 1,
  },
  cardContainer: {
    marginTop: -48,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  glassCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(216, 184, 114, 0.3)',
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'android' ? 'rgba(27, 26, 24, 0.95)' : 'rgba(27, 26, 24, 0.6)',
  },
  priceRow: {
    textAlign: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  priceLabel: {
    fontSize: 12,
    color: palette.textMuted,
    fontWeight: '600',
  },
  priceText: {
    fontFamily: serifFont,
    color: palette.goldBright,
    fontSize: 20,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  priceUnit: {
    fontSize: 11,
    color: palette.gold,
  },
  actionGroup: {
    gap: 16,
  },
  buttonWrapper: {
    width: '100%',
  },
  buttonBase: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonWhite: {
    backgroundColor: '#FFFFFF',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 2,
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 4,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonChevron: {
    fontSize: 20,
    fontWeight: '400',
  },
  footerNote: {
    color: palette.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  navCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 48,
    gap: 12,
  },
  navCard: {
    flex: 1,
    aspectRatio: 0.85,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 12,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  navCardIconBox: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  navCardText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
});
