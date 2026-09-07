import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { palette } from './ui';

// 直接URLでの読み込みや再読み込みでは戻り先の履歴が空になるため、標準の
// 戻るボタン（router.canGoBack()がfalseだと自動的に消える）に頼らず、
// このカスタムボタンでは戻り先が無い場合ホームへ遷移させて必ず何かしらの
// 「戻る」手段を確保する。
export function HeaderBackButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      hitSlop={12}
      style={styles.button}
    >
      <Ionicons name="chevron-back" size={26} color={palette.silver} />
    </Pressable>
  );
}

export function HeaderHomeButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.replace('/')} hitSlop={12} style={styles.button}>
      <Ionicons name="home-outline" size={22} color={palette.silver} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: 4, paddingVertical: 4 },
});
