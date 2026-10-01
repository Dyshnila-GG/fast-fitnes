import { t } from '../i18n';
import { distanceUnit, paceValue } from './units';
import type { ActiveRun, AppData, RunEntry, Stopwatch } from '../types';
import { stopwatchMs, stopwatchState, type StopwatchState } from './session';
import { setRun } from './sleep';

// Активная пробежка (SPEC_v3_2 §4): секундомер как у разминки, переживает перезапуск.
// Сохранённая пробежка — обычная запись data.runs за день (как отметка с «Главной»).

export function startRun(d: AppData, now = Date.now()): AppData {
  if (d.activeRun || d.activeSession) return d;
  return { ...d, activeRun: { startedAt: new Date(now).toISOString(), sw: { ms: 0 } } };
}

// Без изменений возвращает те же данные (лишнего сохранения и ререндера нет).
function patchSw(d: AppData, fn: (sw: Stopwatch) => Stopwatch): AppData {
  if (!d.activeRun) return d;
  const sw = fn(d.activeRun.sw);
  return sw === d.activeRun.sw ? d : { ...d, activeRun: { ...d.activeRun, sw } };
}

const paused = (sw: Stopwatch, now: number): Stopwatch => ({ ...sw, ms: stopwatchMs(sw, now), since: undefined });

// «Старт» / «Продолжить» — с того же времени.
export function resumeRun(d: AppData, now = Date.now()): AppData {
  return patchSw(d, (sw) => (sw.since || sw.done ? sw : { ...sw, since: new Date(now).toISOString() }));
}

export function pauseRun(d: AppData, now = Date.now()): AppData {
  return patchSw(d, (sw) => paused(sw, now));
}

// «Завершить» — время зафиксировано, открывается итог.
export function finishRun(d: AppData, now = Date.now()): AppData {
  return patchSw(d, (sw) => ({ ...paused(sw, now), done: true }));
}

export function resetRun(d: AppData): AppData {
  return patchSw(d, () => ({ ms: 0 }));
}

export function cancelRun(d: AppData): AppData {
  return { ...d, activeRun: null };
}

// Сохранить в пробежки за день (запись за этот день заменяется — подтверждение в UI).
export function saveRun(d: AppData, day: string, run: RunEntry): AppData {
  return { ...setRun(d, day, run), activeRun: null };
}

export const runMs = (run: ActiveRun, now = Date.now()) => stopwatchMs(run.sw, now);
export const runState = (run: ActiveRun): StopwatchState => stopwatchState(run.sw);

// Минуты из миллисекунд — с точностью до секунды.
export const msToMinutes = (ms: number) => Math.round(Math.round(ms / 1000) / 60 * 100) / 100;

// «23:20» / «1:05:00» → минуты; мусор → undefined.
export function parseRunTime(text: string): number | undefined {
  const parts = text.trim().split(':');
  if (parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return undefined;
  const nums = parts.map(Number);
  const [h, m, s] = nums.length === 3 ? nums : nums.length === 2 ? [0, ...nums] : [0, nums[0], 0];
  if (nums.length > 1 && s >= 60) return undefined;
  if (nums.length === 3 && m >= 60) return undefined;
  const total = (h * 3600 + m * 60 + s) / 60;
  return total > 0 ? Math.round(total * 100) / 100 : undefined;
}

const pad = (n: number) => String(n).padStart(2, '0');

// Минуты → «23:20» (с часами — «1:05:00»).
export function formatClock(minutes: number): string {
  const sec = Math.round(minutes * 60);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(sec % 60)}` : `${m}:${pad(sec % 60)}`;
}

// «30 мин» / «23 мин 20 с»
export function formatRunTime(minutes: number): string {
  const sec = Math.round(minutes * 60);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? t('duration.min', { m }) : t('duration.minSec', { m, s });
}

// Темп, мин/mi; без дистанции — нет темпа.
export function paceMinPerMi(minutes: number, distanceMi?: number): number | undefined {
  return distanceMi != null && distanceMi > 0 && minutes > 0 ? minutes / distanceMi : undefined;
}

// Темп хранится в мин/mi: «9:30 мин/mi» / «5:54 мин/km».
export const formatPace = (pace: number) => `${formatClock(paceValue(pace))} ${t('unit.pacePer', { u: distanceUnit() })}`;

// ---- Импорт / восстановление ----

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isIso = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v));

export function sanitizeActiveRun(raw: unknown): ActiveRun | null {
  if (!isObj(raw) || !isIso(raw.startedAt) || !isObj(raw.sw)) return null;
  const { ms, since, done } = raw.sw;
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return null;
  const sw: Stopwatch = { ms };
  if (isIso(since) && done !== true) sw.since = since;
  if (done === true) sw.done = true;
  return { startedAt: raw.startedAt, sw };
}
