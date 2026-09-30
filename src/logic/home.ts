import { getExercise, getVariant, isLegacyTemplate, PROGRAM } from '../data/program';
import type { AppData, BodyWeightEntry, Session, WorkoutTemplate } from '../types';
import { dayDate, dayKey, shiftDay } from './dates';
import { formatBest } from './format';
import { finishedSessions } from './metrics';
import { getBest, startBest } from './records';
import { tonnage } from './tonnage';

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
  // Все завершённые тренировки недели, включая старые A/B/C.
  const workouts = finishedSessions(data.sessions).filter((s) => inWeek(sessionDay(s))).length;
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

// ---- Плитки «Главной» ----

const WEEKDAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// «Сегодня» / «Завтра» / «Сб»
export function dayLabel(day: string, today: string): string {
  if (day === today) return 'Сегодня';
  if (day === shiftDay(today, 1)) return 'Завтра';
  return WEEKDAY_SHORT[dayDate(day).getDay()];
}

const plural = (n: number, one: string, few: string, many: string) =>
  n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many;

// «сегодня» / «вчера» / «3 дня назад»
export function daysAgo(day: string, today: string): string {
  const n = Math.round((dayDate(today).getTime() - dayDate(day).getTime()) / 86_400_000);
  if (n <= 0) return 'сегодня';
  if (n === 1) return 'вчера';
  return `${n} ${plural(n, 'день', 'дня', 'дней')} назад`;
}

// Суммарный тоннаж тренировок за последние 7 дней (включая сегодня), lb.
export function volume7(data: AppData, today: string): number {
  const from = shiftDay(today, -6);
  const total = finishedSessions(data.sessions)
    .filter((s) => {
      const day = sessionDay(s);
      return day >= from && day <= today;
    })
    .reduce((n, s) => n + tonnage(s), 0);
  return Math.round(total);
}

// Точечный календарь активности: столбцы — недели (пн–вс), последние `weeks` недель до текущей.
export type ActivityDay = { day: string; workout: boolean; run: boolean; future: boolean };
export type ActivityGrid = { columns: ActivityDay[][]; months: (string | null)[] };

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export function activityGrid(data: AppData, today: string, weeks = 13): ActivityGrid {
  const workoutDays = new Set(finishedSessions(data.sessions).map(sessionDay));
  const start = shiftDay(weekStart(today), -7 * (weeks - 1));
  const columns: ActivityDay[][] = [];
  const months: (string | null)[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const col: ActivityDay[] = [];
    for (let i = 0; i < 7; i++) {
      const day = shiftDay(start, w * 7 + i);
      col.push({ day, workout: workoutDays.has(day), run: data.runs[day] != null, future: day > today });
    }
    // Подпись месяца — над неделей, где он начинается (и над первой неделей).
    const first = col.find((c) => c.day.endsWith('-01'));
    const label = first ? dayDate(first.day).getMonth() : w === 0 ? dayDate(col[0].day).getMonth() : -1;
    months.push(label >= 0 && label !== lastMonth ? MONTHS_SHORT[label] : null);
    if (label >= 0) lastMonth = label;
    columns.push(col);
  }
  return { columns, months };
}
