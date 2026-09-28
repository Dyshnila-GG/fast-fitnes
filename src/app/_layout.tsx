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
function RootStack() {
  const { data } = useStore();
  const active = data.activeSession != null;
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.bg },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Protected guard={!active}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={active}>
        <Stack.Screen name="workout" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
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
