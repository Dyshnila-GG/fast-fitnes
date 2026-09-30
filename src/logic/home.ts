import { getExercise, getVariant, isLegacyTemplate, PROGRAM } from '../data/program';
import type { AppData, BodyWeightEntry, Session, WorkoutTemplate } from '../types';
import { dayDate, dayKey, shiftDay } from './dates';
import { formatBest } from './format';
import { finishedSessions } from './metrics';
import { getBest, startBest } from './records';

// Тип дня на «Главной»: Вт/Чт/Сб — зал, Ср/Пт — пробежка, Пн/Вс — отдых.
export type HomeDayType = 'gym' | 'run' | 'rest';

export const HOME_DAY_LABEL: Record<HomeDayType, string> = { gym: 'День зала', run: 'Пробежка', rest: 'Отдых' };

export const WORKOUTS_PER_WEEK = 3;
export const RUNS_PER_WEEK = 2;
const RUN_WEEKDAYS = [3, 5];

export function homeDayType(day: string): HomeDayType {
  const w = dayDate(day).getDay();
  if (PROGRAM.some((t) => t.weekday === w)) return 'gym';
  return RUN_WEEKDAYS.includes(w) ? 'run' : 'rest';
}

export function templateForDay(day: string): WorkoutTemplate | undefined {
  const w = dayDate(day).getDay();
  return PROGRAM.find((t) => t.weekday === w);
}

const sessionDay = (s: Session) => dayKey(new Date(s.finishedAt!));

// Последняя тренировка, завершённая в этот день.
export function finishedOn(data: AppData, day: string): Session | undefined {
  return finishedSessions(data.sessions).find((s) => sessionDay(s) === day);
}

export function lastSession(data: AppData): Session | undefined {
  return finishedSessions(data.sessions)[0];
}

// Следующая тренировка по расписанию: сегодня (если ещё не сделана) или ближайший день зала.
export function nextWorkout(data: AppData, today: string): { day: string; template: WorkoutTemplate } {
  const from = finishedOn(data, today) ? 1 : 0;
  for (let i = from; i < from + 7; i++) {
    const day = shiftDay(today, i);
    const template = templateForDay(day);
    if (template) return { day, template };
  }
  throw new Error('В программе нет дней зала');
}

// Выросшие рекорды тренировки: «Жим лёжа в Смите 75 lb → 80 lb».
// «Было» — рекорд на начало тренировки, «стало» — текущий рекорд (для последней тренировки это её итог).
export function recordGains(data: AppData, s: Session): string[] {
  if (isLegacyTemplate(s.templateId)) return [];
  const out: string[] = [];
  for (const log of s.exercises) {
    const variant = getVariant(getExercise(log.exerciseId), log.variant);
    const field = variant.mode === 'weight' ? 'weight' : variant.mode === 'time' ? 'seconds' : 'reps';
    const before = log.record ?? startBest(variant);
    const after = getBest(data, variant);
    if ((after[field] ?? 0) > (before[field] ?? 0)) {
      out.push(`${variant.name} ${formatBest(variant, before)} → ${formatBest(variant, after)}`);
    }
  }
  return out;
}

// ---- Неделя пн–вс ----

export function weekStart(day: string): string {
  const w = dayDate(day).getDay();
  return shiftDay(day, -((w + 6) % 7));
}

export type WeekCounts = { workouts: number; runs: number };

export function weekCounts(data: AppData, today: string): WeekCounts {
  const from = weekStart(today);
  const to = shiftDay(from, 6);
  const inWeek = (day: string) => day >= from && day <= to;
  const workouts = finishedSessions(data.sessions).filter((s) => !isLegacyTemplate(s.templateId) && inWeek(sessionDay(s))).length;
  const runs = Object.keys(data.runs).filter(inWeek).length;
  return { workouts, runs };
}

// Последний вес и изменение за 7 дней: последняя запись минус последняя запись не позже чем 7 дней назад.
export function weightTrend(entries: BodyWeightEntry[], today: string): { value: number; date: string; change?: number } | undefined {
  const sorted = entries.filter((e) => e.date <= today).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const last = sorted[sorted.length - 1];
  if (!last) return undefined;
  const border = shiftDay(today, -7);
  const base = [...sorted].reverse().find((e) => e.date <= border);
  const change = base ? Math.round((last.value - base.value) * 10) / 10 : undefined;
  return { value: last.value, date: last.date, change };
}
