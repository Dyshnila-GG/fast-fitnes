import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope/800ExtraBold';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { BackButton } from '../components/nav/BackButton';
import { FONT } from '../components/Text';
import { useT } from '../i18n/useT';
import { useAutoBackup } from '../services/useAutoBackup';
import { useReminders } from '../services/useReminders';
import { AppStoreProvider, useStore } from '../store/AppStore';
import { colors } from '../theme';

// Заставка держится, пока грузятся шрифт Manrope и данные (SPEC_v3_3 §A3).
SplashScreen.preventAutoHideAsync().catch(() => {});

const loading = <View style={{ flex: 1, backgroundColor: colors.bg }} />;

// Пока идёт тренировка или пробежка, доступен только её экран (в т.ч. сразу при запуске приложения).
// После завершения тренировки — экран итога, пока его не закроют кнопкой «Готово».
function RootStack() {
  const { data } = useStore();
  const active = data.activeSession != null;
  const running = !active && data.activeRun != null;
  const summary = !active && !running && data.summaryId != null;
  const t = useT();
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  useAutoBackup();
  useReminders();
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.bg },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: FONT[700] },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Protected guard={!active && !running && !summary}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="strength" options={{ title: t('nav.strength'), headerLeft: () => <BackButton /> }} />
        <Stack.Screen name="run-start" options={{ title: t('nav.run_start'), headerLeft: () => <BackButton /> }} />
        <Stack.Screen name="weight" options={{ title: t('nav.weight') }} />
        <Stack.Screen name="measurements" options={{ title: t('nav.measurements') }} />
        <Stack.Screen name="history/index" options={{ title: t('nav.history_index') }} />
        <Stack.Screen name="history/[id]" options={{ title: t('nav.history_id') }} />
        <Stack.Screen name="progress" options={{ title: t('nav.progress') }} />
        <Stack.Screen name="personal" options={{ title: t('nav.personal') }} />
        <Stack.Screen name="data" options={{ title: t('nav.data') }} />
        <Stack.Screen name="app-settings" options={{ title: t('nav.app_settings') }} />
        <Stack.Screen name="trash" options={{ title: t('nav.trash') }} />
        <Stack.Screen name="backup" options={{ title: t('nav.backup') }} />
        <Stack.Screen name="reminders" options={{ title: t('nav.reminders') }} />
        <Stack.Screen name="meal" options={{ title: t('nav.meal') }} />
        <Stack.Screen name="food-swap" options={{ title: t('nav.food_swap') }} />
        <Stack.Screen name="food-settings" options={{ title: t('nav.food_settings') }} />
        <Stack.Screen name="menu" options={{ title: t('nav.menu') }} />
        <Stack.Screen name="dish" options={{ title: t('nav.dish') }} />
        <Stack.Screen name="dish-edit" options={{ title: t('nav.dish_edit') }} />
        <Stack.Screen name="slot-dishes" options={{ title: t('nav.slot_dishes') }} />
        <Stack.Screen name="products" options={{ title: t('nav.products') }} />
        <Stack.Screen name="recipe" options={{ title: t('nav.recipe') }} />
        <Stack.Screen name="sleep" options={{ title: t('nav.sleep') }} />
        <Stack.Screen name="sleep-edit" options={{ title: t('nav.sleep_edit'), presentation: 'modal' }} />
        <Stack.Screen name="runs" options={{ title: t('nav.runs') }} />
        <Stack.Screen name="weight-add" options={{ title: t('nav.weight_add'), presentation: 'modal' }} />
        <Stack.Screen name="run-edit" options={{ title: t('nav.run_edit'), presentation: 'modal' }} />
        <Stack.Screen name="workout-preview" options={{ title: t('nav.workout_preview'), presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={active}>
        <Stack.Screen name="workout" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={running}>
        <Stack.Screen name="run" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={summary}>
        <Stack.Screen name="summary" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  // Ошибка загрузки шрифта не должна блокировать приложение — тогда системный шрифт.
  if (!fontsLoaded && !fontError) return null;
  return (
    <AppStoreProvider fallback={loading}>
      <StatusBar style="light" />
      <RootStack />
    </AppStoreProvider>
  );
}
