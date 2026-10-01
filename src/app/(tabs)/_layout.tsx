import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../../components/Icon';
import { colors } from '../../theme';

const BAR_HEIGHT = 72;
const ICON = 28;
const DOT = 4;

// Активная вкладка — белая иконка и белая точка под ней, неактивная — серая; подписей нет (SPEC_v3_2 §1).
const icon =
  (name: IconName) =>
  ({ focused }: { focused: boolean }) => (
    <View style={styles.icon}>
      <Icon name={name} size={ICON} color={focused ? colors.text : colors.muted} />
      <View style={[styles.dot, focused && styles.dotActive]} />
    </View>
  );

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        tabBarStyle: {
          height: BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarItemStyle: { minHeight: 56, justifyContent: 'center' },
        tabBarIconStyle: { width: 56, height: 56 },
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

const styles = StyleSheet.create({
  icon: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', gap: 5 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  dotActive: { backgroundColor: colors.text },
});
