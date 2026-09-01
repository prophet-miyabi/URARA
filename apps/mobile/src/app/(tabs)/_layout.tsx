import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/components/ui';

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
        headerTintColor: palette.gold,
        headerTitleStyle: { color: palette.text },
        tabBarStyle: {
          backgroundColor: palette.bg,
          borderTopColor: palette.hairline,
          height: 66 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
        },
        tabBarActiveTintColor: palette.gold,
        tabBarInactiveTintColor: palette.textFaint,
        tabBarLabelStyle: { fontSize: 10, lineHeight: 13 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'ホーム', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="cast"
        options={{ title: 'キャスト', tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }}
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
