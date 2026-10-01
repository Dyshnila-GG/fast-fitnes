import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { FONT, Text } from '../../components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../../components/Icon';
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

const FOOD_ACTIONS: { label: string; icon: IconName; href: '/products' | '/menu' | '/food-settings' }[] = [
  { label: 'Продукты', icon: 'cart-outline', href: '/products' },
  { label: 'Меню', icon: 'book-open-variant', href: '/menu' },
  { label: 'Настройки', icon: 'cog-outline', href: '/food-settings' },
];

// Шапка «Еды» (SPEC_v3_3 §C1): «Продукты», «Меню», «Настройки». На узком экране — только иконки.
function FoodHeader() {
  const { width } = useWindowDimensions();
  const labels = width >= 400;
  return (
    <View style={styles.headerActions}>
      {FOOD_ACTIONS.map((a) => (
        <Pressable
          key={a.href}
          onPress={() => router.push(a.href)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={a.label}
          style={({ pressed }) => [styles.headerButton, !labels && styles.headerIconButton, pressed && styles.pressed]}
        >
          <Icon name={a.icon} size={18} />
          {labels && <Text style={styles.headerText}>{a.label}</Text>}
        </Pressable>
      ))}
    </View>
  );
}

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
          headerRight: () => <FoodHeader />,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Профиль', tabBarIcon: icon('account-outline') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 11,
    borderRadius: 18,
    backgroundColor: colors.card,
  },
  headerIconButton: { width: 40, paddingHorizontal: 0, justifyContent: 'center' },
  headerText: { fontSize: 14, fontWeight: '600', color: colors.text },
  pressed: { opacity: 0.7 },
});
