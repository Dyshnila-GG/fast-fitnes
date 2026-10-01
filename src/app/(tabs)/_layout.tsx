import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../../components/Icon';
import { FONT } from '../../components/Text';
import { colors } from '../../theme';

const BAR_HEIGHT = 72;
const ICON = 28;

// Активная вкладка — белая иконка, неактивная — серая; подписей и точек нет (SPEC_v3_3 §A4).
const icon =
  (name: IconName) =>
  ({ focused }: { focused: boolean }) => (
    <View style={styles.icon}>
      <Icon name={name} size={ICON} color={focused ? colors.text : colors.muted} />
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
        headerTitleStyle: { color: colors.text, fontFamily: FONT[700] },
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
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push('/products')}
                hitSlop={8}
                accessibilityRole="button"
                style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
              >
                <Icon name="cart-outline" size={18} />
                <Text style={styles.headerText}>Продукты</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/food-settings')}
                hitSlop={8}
                accessibilityRole="button"
                style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
              >
                <Text style={styles.headerText}>Время</Text>
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Профиль', tabBarIcon: icon('account-outline') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: colors.card,
  },
  headerText: { fontSize: 15, fontWeight: '600', color: colors.text },
  pressed: { opacity: 0.7 },
});
