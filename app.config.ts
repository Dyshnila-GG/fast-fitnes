import type { ConfigContext, ExpoConfig } from 'expo/config';

// versionCode растёт с каждой CI-сборкой (номер запуска), чтобы APK ставился поверх как обновление.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  android: {
    ...config.android,
    versionCode: Number(process.env.ANDROID_VERSION_CODE ?? 1),
  },
});
