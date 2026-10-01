import { t } from '../i18n';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { plannedReminders } from '../logic/reminders';
import type { Reminders } from '../types';

const CHANNEL = 'reminders';

// Напоминание показывается и при открытом приложении.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function notificationsGranted(): Promise<boolean> {
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function requestNotifications(): Promise<boolean> {
  try {
    if (await notificationsGranted()) return true;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

// Перепланирует все напоминания по настройкам (без разрешения — ничего не планирует).
export async function syncReminders(r: Reminders): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const planned = plannedReminders(r);
    if (planned.length === 0 || !(await notificationsGranted())) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: t('reminders.channel'),
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    for (const p of planned) {
      const trigger: Notifications.NotificationTriggerInput =
        p.weekday != null
          ? { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: p.weekday, hour: p.hour, minute: p.minute, channelId: CHANNEL }
          : { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: p.hour, minute: p.minute, channelId: CHANNEL };
      await Notifications.scheduleNotificationAsync({ identifier: p.id, content: { title: p.title, body: p.body }, trigger });
    }
  } catch {
    // Нет модуля уведомлений (например, web) — напоминания просто не планируются.
  }
}
