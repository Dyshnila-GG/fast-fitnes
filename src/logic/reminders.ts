import { PROGRAM } from '../data/program';
import type { AppData, Reminder, Reminders } from '../types';
import { workoutName } from './report';
import { toMinutes } from './time';

// Локальные напоминания (SPEC_v3_3 §B4): сон — ежедневно, тренировка — в дни зала (Вт, Чт, Сб).

export const GYM_TIME = '6:00';
export const WAKE_TIME = '5:00';

// weekday — 1…7, 1 = воскресенье (как в expo-notifications); без weekday — ежедневно.
export type PlannedReminder = { id: string; title: string; body: string; weekday?: number; hour: number; minute: number };

const at = (time: string) => ({ hour: Math.floor(toMinutes(time) / 60), minute: toMinutes(time) % 60 });

export function plannedReminders(r: Reminders): PlannedReminder[] {
  const out: PlannedReminder[] = [];
  if (r.sleep.on) {
    out.push({ id: 'sleep', title: 'Сон', body: `Через 30 минут спать. Подъём в ${WAKE_TIME}`, ...at(r.sleep.time) });
  }
  if (r.workout.on) {
    for (const t of PROGRAM) {
      out.push({
        id: `workout-${t.id}`,
        title: 'Тренировка',
        body: `Сегодня: ${workoutName(t.title)}. Зал в ${GYM_TIME}`,
        weekday: t.weekday + 1,
        ...at(r.workout.time),
      });
    }
  }
  return out;
}

export const anyReminderOn = (r: Reminders) => r.sleep.on || r.workout.on;

export function setReminder(d: AppData, key: 'sleep' | 'workout', patch: Partial<Reminder>): AppData {
  return { ...d, reminders: { ...d.reminders, [key]: { ...d.reminders[key], ...patch } } };
}
