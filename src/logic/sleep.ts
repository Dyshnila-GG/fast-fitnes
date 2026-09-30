import type { AppData, RunEntry, SleepEntry } from '../types';
import { shiftDay } from './dates';
import { isTime, toMinutes } from './time';

// ---- Сон ----

// Длительность через полночь: лёг 23:30, встал 7:10 → 460 мин.
export function sleepMinutes(e: Pick<SleepEntry, 'bed' | 'wake'>): number {
  return (toMinutes(e.wake) - toMinutes(e.bed) + 1440) % 1440;
}

// 460 → «7 ч 40 мин»
export function formatSleep(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m} мин`;
  return m === 0 ? `${h} ч` : `${h} ч ${m} мин`;
}

// Средняя длительность за последние `days` ночей (включая сегодняшнюю); нет записей — undefined.
export function sleepAverage(sleep: Record<string, SleepEntry>, today: string, days: number): number | undefined {
  const values: number[] = [];
  for (let i = 0; i < days; i++) {
    const e = sleep[shiftDay(today, -i)];
    if (e) values.push(sleepMinutes(e));
  }
  if (values.length === 0) return undefined;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function setSleep(d: AppData, day: string, entry: SleepEntry): AppData {
  return { ...d, sleep: { ...d.sleep, [day]: entry } };
}

export function removeSleep(d: AppData, day: string): AppData {
  const sleep = { ...d.sleep };
  delete sleep[day];
  return { ...d, sleep };
}

// ---- Пробежки ----

export function setRun(d: AppData, day: string, run: RunEntry): AppData {
  return { ...d, runs: { ...d.runs, [day]: run } };
}

export function removeRun(d: AppData, day: string): AppData {
  const runs = { ...d.runs };
  delete runs[day];
  return { ...d, runs };
}

// ---- Импорт: берём только корректные записи ----

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isDay = (k: string) => /^\d{4}-\d{2}-\d{2}$/.test(k);
const isPos = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;

export function sanitizeSleep(raw: unknown): Record<string, SleepEntry> {
  const out: Record<string, SleepEntry> = {};
  if (!isObj(raw)) return out;
  for (const [k, e] of Object.entries(raw)) {
    if (!isDay(k) || !isObj(e) || !isTime(e.bed) || !isTime(e.wake)) continue;
    const q = e.quality;
    if (typeof q !== 'number' || !Number.isInteger(q) || q < 1 || q > 5) continue;
    out[k] = { bed: e.bed, wake: e.wake, quality: q };
  }
  return out;
}

export function sanitizeRuns(raw: unknown): Record<string, RunEntry> {
  const out: Record<string, RunEntry> = {};
  if (!isObj(raw)) return out;
  for (const [k, e] of Object.entries(raw)) {
    if (!isDay(k) || !isObj(e) || !isPos(e.minutes)) continue;
    out[k] = isPos(e.distanceMi) ? { minutes: e.minutes, distanceMi: e.distanceMi } : { minutes: e.minutes };
  }
  return out;
}
