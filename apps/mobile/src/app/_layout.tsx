import { useEffect } from 'react';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// バレルの index.js から読み込むと、実際に使う2ウェイトだけでなく
// パッケージ内の全12ウェイト（Regular〜Black×Italic、計2MB超）が
// require() されてWebバンドルに含まれてしまうため、各ウェイトを
// 個別のサブパスから直接読み込んでいる（同じ理由で@expo/vector-iconsも
// 各アイコンセットを直接インポートしている）。
import { useFonts } from '@expo-google-fonts/playfair-display/useFonts';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import { ReservationProvider } from '@/lib/reservation-store';
import { AuthProvider } from '@/lib/auth-store';
import { palette } from '@/components/ui';
import { HeaderBackButton, HeaderHomeButton } from '@/components/header-nav-buttons';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // 検索結果やLINE等での共有表示に使われるため、フォント読み込み前でも出す。
  const head = (
    <Head>
      <title>URARA COMPANION | コンパニオン予約</title>
      <meta
        name="description"
        content="山梨県内の飲食店・宴会場・イベント会場へ、コンパニオンを派遣いたします。スマートフォンからかんたんにご予約いただけます。"
      />
      <meta property="og:title" content="URARA COMPANION | コンパニオン予約" />
      <meta property="og:description" content="山梨県内の宴会・接待に、コンパニオンを派遣いたします。" />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="ja_JP" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="URARA" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </Head>
  );

  if (!fontsLoaded) return head;

  return (
    <SafeAreaProvider>
      {head}
      <AuthProvider>
        <ReservationProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: palette.bg },
              headerTintColor: palette.silver,
              headerTitleStyle: { color: palette.text },
              contentStyle: { backgroundColor: palette.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="booking/index"
              options={{
                title: '予約する',
                headerLeft: () => <HeaderBackButton />,
                headerRight: () => <HeaderHomeButton />,
              }}
            />
            <Stack.Screen
              name="pricing/index"
              options={{
                title: '料金・対応エリア',
                headerLeft: () => <HeaderBackButton />,
                headerRight: () => <HeaderHomeButton />,
              }}
            />
            <Stack.Screen
              name="reservation/[id]"
              options={{
                title: '予約状況',
                headerLeft: () => <HeaderBackButton />,
                headerRight: () => <HeaderHomeButton />,
              }}
            />
          </Stack>
        </ReservationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
