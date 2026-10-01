import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { t } from '../i18n';
import { plannedReminders } from '../logic/reminders';
import type { Reminders } from '../types';

// Только тип — в бандле статического импорта нет: модуль загружается лениво через require.
type NotificationsModule = typeof import('expo-notifications');

const CHANNEL = 'reminders';

// В Expo Go (SDK 53+) expo-notifications на Android падает уже при импорте — там модуль не загружаем вообще.
export const remindersSupported = Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

let loaded: NotificationsModule | null | undefined;

// Модуль уведомлений или null (Expo Go, web, ошибка загрузки). Загружается один раз.
function notifications(): NotificationsModule | null {
  if (loaded !== undefined) return loaded;
  loaded = null;
  if (!remindersSupported) return loaded;
  try {
    const mod: NotificationsModule = require('expo-notifications');
    // Напоминание показывается и при открытом приложении.
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    loaded = mod;
  } catch {
    loaded = null;
  }
  return loaded;
}

export async function notificationsGranted(): Promise<boolean> {
  const N = notifications();
  if (!N) return false;
  try {
    return (await N.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function requestNotifications(): Promise<boolean> {
  const N = notifications();
  if (!N) return false;
  try {
    if (await notificationsGranted()) return true;
    return (await N.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

// Перепланирует все напоминания по настройкам (без модуля или разрешения — ничего не планирует).
export async function syncReminders(r: Reminders): Promise<void> {
  const N = notifications();
  if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
    const planned = plannedReminders(r);
    if (planned.length === 0 || !(await notificationsGranted())) return;
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync(CHANNEL, {
        name: t('reminders.channel'),
        importance: N.AndroidImportance.HIGH,
      });
    }
    for (const p of planned) {
      const trigger: import('expo-notifications').NotificationTriggerInput =
        p.weekday != null
          ? { type: N.SchedulableTriggerInputTypes.WEEKLY, weekday: p.weekday, hour: p.hour, minute: p.minute, channelId: CHANNEL }
          : { type: N.SchedulableTriggerInputTypes.DAILY, hour: p.hour, minute: p.minute, channelId: CHANNEL };
      await N.scheduleNotificationAsync({ identifier: p.id, content: { title: p.title, body: p.body }, trigger });
    }
  } catch {
    // Планирование не удалось — напоминания просто не ставятся.
  }
}
