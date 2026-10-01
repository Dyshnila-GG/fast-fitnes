import { useEffect } from 'react';
import { anyReminderOn } from '../logic/reminders';
import { useStore } from '../store/AppStore';
import { requestNotifications, syncReminders } from './notifications';

// Первый запуск с включёнными напоминаниями — запрос разрешения; при любом изменении — перепланирование.
export function useReminders() {
  const { data, update } = useStore();
  const { reminders } = data;
  const key = JSON.stringify([reminders.sleep, reminders.workout]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!reminders.asked && anyReminderOn(reminders)) {
        await requestNotifications();
        if (!cancelled) update((d) => ({ ...d, reminders: { ...d.reminders, asked: true } }));
      }
      if (!cancelled) await syncReminders(reminders);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
