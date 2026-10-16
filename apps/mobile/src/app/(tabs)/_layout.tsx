import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/components/ui';
import { serifJa } from '@/components/scene';

// 各タブの右上に置くブランド表記。
function HeaderWordmark() {
  return <Text style={styles.wordmark}>URARA</Text>;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Some mobile browsers (notably Android Chrome) don't report a real
  // safe-area-inset-bottom for their own gesture nav bar, so `insets.bottom`
  // can come back as 0 even though the bar is still there. A fixed floor
  // guarantees the tab labels always have breathing room either way.
  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.bg },
        headerShadowVisible: false,
        headerTintColor: palette.silver,
        headerTitleAlign: 'center',
        headerTitleStyle: { color: palette.text, fontFamily: serifJa, fontSize: 17, letterSpacing: 2 },
        headerRight: () => <HeaderWordmark />,
        tabBarStyle: {
          backgroundColor: palette.bg,
          borderTopColor: palette.hairline,
          height: 66 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
        },
        tabBarActiveTintColor: palette.silverBright,
        tabBarInactiveTintColor: palette.textFaint,
        tabBarLabelStyle: { fontSize: 10, lineHeight: 13 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'ホーム', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="booking-tab"
        options={{ title: '予約', tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: '履歴', tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'マイページ', tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    color: palette.silver,
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 15,
    letterSpacing: 3,
    marginRight: 18,
  },
});
