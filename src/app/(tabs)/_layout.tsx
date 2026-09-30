import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, Text } from 'react-native';
import { Icon, type IconName } from '../../components/Icon';
import { colors } from '../../theme';

// Активная вкладка — белая иконка, неактивная — серая; подписей нет (SPEC_v3_1 §5).
const icon =
  (name: IconName) =>
  ({ focused }: { focused: boolean }) => <Icon name={name} size={26} color={focused ? colors.text : colors.muted} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
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
      <Tabs.Screen name="index" options={{ title: 'Главная', headerShown: false, tabBarIcon: icon('view-grid-outline') }} />
      <Tabs.Screen name="workouts" options={{ title: 'Тренировки', tabBarIcon: icon('dumbbell') }} />
      <Tabs.Screen
        name="food"
        options={{
          title: 'Еда',
          tabBarIcon: icon('silverware-fork-knife'),
          headerRight: () => (
            <Pressable onPress={() => router.push('/food-settings')} hitSlop={10} style={{ paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 15, color: colors.text }}>Время</Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Профиль', tabBarIcon: icon('account-outline') }} />
    </Tabs>
  );
}
