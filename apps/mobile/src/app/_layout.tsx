import { useEffect } from 'react';
import { Stack } from 'expo-router';
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
import { palette } from '@/components/ui';
import { HeaderBackButton, HeaderHomeButton } from '@/components/header-nav-buttons';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
