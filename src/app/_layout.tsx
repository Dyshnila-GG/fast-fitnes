import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AppStoreProvider, useStore } from '../store/AppStore';
import { colors } from '../theme';

const loading = (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
    <ActivityIndicator />
  </View>
);

// Пока идёт тренировка или пробежка, доступен только её экран (в т.ч. сразу при запуске приложения).
// После завершения тренировки — экран итога, пока его не закроют кнопкой «Готово».
function RootStack() {
  const { data } = useStore();
  const active = data.activeSession != null;
  const running = !active && data.activeRun != null;
  const summary = !active && !running && data.summaryId != null;
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.bg },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Protected guard={!active && !running && !summary}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
  return (
    <AppStoreProvider fallback={loading}>
      <StatusBar style="light" />
      <RootStack />
    </AppStoreProvider>
  );
}
