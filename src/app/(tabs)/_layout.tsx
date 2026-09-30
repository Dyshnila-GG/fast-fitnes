import { Tabs } from 'expo-router/js-tabs';
import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { colors } from '../../theme';

const icon = (glyph: string) => ({ focused }: { focused: boolean }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{glyph}</Text>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Тренировки', tabBarIcon: icon('🏋') }} />
      <Tabs.Screen
        name="food"
        options={{
          title: 'Еда',
          tabBarIcon: icon('🍽'),
          headerRight: () => (
            <Pressable onPress={() => router.push('/food-settings')} hitSlop={10} style={{ paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 15, color: colors.text }}>Время</Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="metrics" options={{ title: 'Метрики', tabBarIcon: icon('📈') }} />
    </Tabs>
  );
}
