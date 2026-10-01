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
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
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
        <Stack.Screen name="strength" options={{ title: 'Силовые', headerLeft: () => <BackButton /> }} />
        <Stack.Screen name="run-start" options={{ title: 'Пробежка', headerLeft: () => <BackButton /> }} />
        <Stack.Screen name="weight" options={{ title: 'Вес тела' }} />
        <Stack.Screen name="measurements" options={{ title: 'Замеры' }} />
        <Stack.Screen name="history/index" options={{ title: 'История тренировок' }} />
        <Stack.Screen name="history/[id]" options={{ title: 'Тренировка' }} />
        <Stack.Screen name="progress" options={{ title: 'Прогресс по упражнению' }} />
        <Stack.Screen name="personal" options={{ title: 'Возраст, рост, старт' }} />
        <Stack.Screen name="data" options={{ title: 'Экспорт / импорт' }} />
        <Stack.Screen name="meal" options={{ title: 'Блюдо' }} />
        <Stack.Screen name="food-swap" options={{ title: 'Заменить блюдо' }} />
        <Stack.Screen name="food-settings" options={{ title: 'Время приёмов пищи' }} />
        <Stack.Screen name="products" options={{ title: 'Продукты на неделю' }} />
        <Stack.Screen name="recipe" options={{ title: 'Рецепт' }} />
        <Stack.Screen name="sleep" options={{ title: 'Сон' }} />
        <Stack.Screen name="sleep-edit" options={{ title: 'Сон', presentation: 'modal' }} />
        <Stack.Screen name="runs" options={{ title: 'Пробежки' }} />
        <Stack.Screen name="weight-add" options={{ title: 'Вес тела', presentation: 'modal' }} />
        <Stack.Screen name="run-edit" options={{ title: 'Пробежка', presentation: 'modal' }} />
        <Stack.Screen name="workout-preview" options={{ title: 'Тренировка', presentation: 'modal' }} />
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
