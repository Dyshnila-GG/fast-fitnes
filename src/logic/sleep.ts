import { t } from '../i18n';
import type { AppData, RunEntry, SleepEntry } from '../types';
import { shiftDay } from './dates';
import { isTime, toMinutes } from './time';

// ---- Сон ----

export const MAX_SLEEP_MIN = 24 * 60;

// Длительность между «лёг» и «встал» через полночь: 23:30 → 7:10 = 460 мин.
export function minutesBetween(bed: string, wake: string): number {
  return (toMinutes(wake) - toMinutes(bed) + 1440) % 1440;
}

// 460 → «7 ч 40 мин»
export function formatSleep(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return t('duration.min', { m });
  return m === 0 ? t('duration.h', { h }) : t('duration.hMin', { h, m });
}

// 390 → «6:30»
export const formatSleepClock = (min: number) => `${Math.floor(min / 60)}:${String(Math.round(min % 60)).padStart(2, '0')}`;

// Записи за последние `days` ночей (включая сегодняшнюю).
function recent(sleep: Record<string, SleepEntry>, today: string, days: number): SleepEntry[] {
  const out: SleepEntry[] = [];
  for (let i = 0; i < days; i++) {
    const e = sleep[shiftDay(today, -i)];
    if (e) out.push(e);
  }
  return out;
}

const avg = (values: number[]) => (values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : undefined);

// Средняя длительность за `days` ночей — только по ночам с записью; нет записей — undefined.
export function sleepAverage(sleep: Record<string, SleepEntry>, today: string, days: number): number | undefined {
  return avg(recent(sleep, today, days).map((e) => e.minutes));
}

// Средняя оценка Garmin — по ночам, где она есть.
export function garminAverage(sleep: Record<string, SleepEntry>, today: string, days: number): number | undefined {
  return avg(recent(sleep, today, days).flatMap((e) => (e.garmin != null ? [e.garmin] : [])));
}

// «Garmin 82» / «качество 4/5» (старые записи) / «».
export function sleepScore(e: SleepEntry): string {
  if (e.garmin != null) return `Garmin ${e.garmin}`;
  if (e.quality != null) return t('sleep.quality', { q: e.quality });
  return '';
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

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

// Старые записи v3 (лёг/встал + качество) переносятся: длительность считается через полночь.
export function sanitizeSleep(raw: unknown): Record<string, SleepEntry> {
  const out: Record<string, SleepEntry> = {};
  if (!isObj(raw)) return out;
  for (const [k, e] of Object.entries(raw)) {
    if (!isDay(k) || !isObj(e)) continue;
    const times = isTime(e.bed) && isTime(e.wake);
    const minutes = isInt(e.minutes, 1, MAX_SLEEP_MIN) ? e.minutes : times ? minutesBetween(e.bed as string, e.wake as string) : 0;
    if (minutes <= 0) continue;
    const entry: SleepEntry = { minutes };
    if (isInt(e.garmin, 0, 100)) entry.garmin = e.garmin;
    if (times) {
      entry.bed = e.bed as string;
      entry.wake = e.wake as string;
    }
    if (isInt(e.quality, 1, 5)) entry.quality = e.quality;
    out[k] = entry;
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
