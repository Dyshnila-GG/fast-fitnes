import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { FONT, Text } from '../../components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../../components/Icon';
import { colors } from '../../theme';
import type { Key } from '../../i18n';
import { useT } from '../../i18n/useT';

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

const FOOD_ACTIONS: { label: Key; icon: IconName; href: '/products' | '/menu' | '/food-settings' }[] = [
  { label: 'food.products', icon: 'cart-outline', href: '/products' },
  { label: 'profile.menu', icon: 'book-open-variant', href: '/menu' },
  { label: 'common.settings', icon: 'cog-outline', href: '/food-settings' },
];

// Шапка «Еды» (SPEC_v3_3 §C1): «Продукты», «Меню», «Настройки». Если подписи на этом языке не помещаются — только иконки.
const TITLE_SPACE = 76; // заголовок «Еда» и отступ слева
const CHAR_W = 7.4; // средняя ширина символа подписи (13 px)
const BUTTON_EXTRA = 46; // иконка, отступы и промежуток
function FoodHeader() {
  const t = useT();
  const { width } = useWindowDimensions();
  const need = TITLE_SPACE + FOOD_ACTIONS.reduce((n, a) => n + t(a.label).length * CHAR_W + BUTTON_EXTRA, 0);
  const labels = need <= width;
  return (
    <View style={styles.headerActions}>
      {FOOD_ACTIONS.map((a) => (
        <Pressable
          key={a.href}
          onPress={() => router.push(a.href)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t(a.label)}
          style={({ pressed }) => [styles.headerButton, !labels && styles.headerIconButton, pressed && styles.pressed]}
        >
          <Icon name={a.icon} size={18} />
          {labels && <Text style={styles.headerText}>{t(a.label)}</Text>}
        </Pressable>
      ))}
    </View>
  );
}

export default function TabsLayout() {
  const t = useT();
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
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), headerShown: false, tabBarIcon: icon('view-grid-outline') }} />
      <Tabs.Screen name="workouts" options={{ title: t('tabs.workouts'), tabBarIcon: icon('dumbbell') }} />
      <Tabs.Screen
        name="food"
        options={{
          title: t('tabs.food'),
          tabBarIcon: icon('silverware-fork-knife'),
          headerRight: () => <FoodHeader />,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: icon('account-outline') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingRight: 10 },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: 9,
    borderRadius: 18,
    backgroundColor: colors.card,
  },
  headerIconButton: { width: 40, paddingHorizontal: 0, justifyContent: 'center' },
  headerText: { fontSize: 13, fontWeight: '600', color: colors.text },
  pressed: { opacity: 0.7 },
});
