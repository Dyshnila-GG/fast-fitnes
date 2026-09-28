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

// Пока идёт тренировка, доступен только её экран (в т.ч. сразу при запуске приложения).
// После завершения — экран итога, пока его не закроют кнопкой «Готово».
function RootStack() {
  const { data } = useStore();
  const active = data.activeSession != null;
  const summary = !active && data.summaryId != null;
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
      <Stack.Protected guard={!active && !summary}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="weight" options={{ title: 'Вес тела' }} />
        <Stack.Screen name="measurements" options={{ title: 'Замеры' }} />
        <Stack.Screen name="history/index" options={{ title: 'История тренировок' }} />
        <Stack.Screen name="history/[id]" options={{ title: 'Тренировка' }} />
        <Stack.Screen name="progress" options={{ title: 'Прогресс по упражнению' }} />
        <Stack.Screen name="profile" options={{ title: 'Профиль' }} />
        <Stack.Screen name="data" options={{ title: 'Экспорт / импорт' }} />
      </Stack.Protected>
      <Stack.Protected guard={active}>
        <Stack.Screen name="workout" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
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
