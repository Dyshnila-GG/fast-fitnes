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

// ---- Календарь активности: месяц, строки — недели пн–вс ----

// Месяц — «YYYY-MM».
export type Month = string;
export type CalendarDay = { day: string; date: number; active: boolean; today: boolean; future: boolean };
export type MonthGrid = { month: Month; title: string; weeks: (CalendarDay | null)[][] };

const MONTHS_FULL = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export const monthOf = (day: string): Month => day.slice(0, 7);

export function shiftMonth(month: Month, delta: number): Month {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// «Октябрь 2026»
export function monthTitle(month: Month): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS_FULL[m - 1]} ${y}`;
}

// Дни с завершённой тренировкой или пробежкой.
export function activeDays(data: Pick<AppData, 'sessions' | 'runs'>): Set<string> {
  const days = new Set(finishedSessions(data.sessions).map(sessionDay));
  for (const day of Object.keys(data.runs)) days.add(day);
  return days;
}

export function monthGrid(data: Pick<AppData, 'sessions' | 'runs'>, month: Month, today: string): MonthGrid {
  const active = activeDays(data);
  const first = `${month}-01`;
  const days = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const lead = (dayDate(first).getDay() + 6) % 7; // пустые ячейки до 1-го числа (неделя с пн)
  const cells: (CalendarDay | null)[] = Array.from({ length: lead }, () => null);
  for (let i = 0; i < days; i++) {
    const day = shiftDay(first, i);
    cells.push({ day, date: i + 1, active: active.has(day), today: day === today, future: day > today });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (CalendarDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return { month, title: monthTitle(month), weeks };
}
