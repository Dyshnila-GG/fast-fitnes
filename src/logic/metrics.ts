import { getExercise, getTemplate, getVariant } from '../data/program';
import { defaultData } from '../store/defaults';
import { migrateData } from '../store/migrate';
import type { AppData, BodyWeightEntry, MeasurementEntry, Mode, Session } from '../types';
import { newId } from './id';

// Точка графика: x — время (мс), y — значение.
export type Point = { x: number; y: number; date: string };

import { dayDate } from './dates';

export { dayDate, dayKey, shiftDay } from './dates';

// «161,3» → 161.3; пусто или не число → undefined.
export function parseNum(text: string): number | undefined {
  const t = text.trim().replace(',', '.');
  if (t === '') return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

// ---- Вес тела и замеры ----

const byDay = <T extends { date: string }>(a: T, b: T) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

// Одна запись веса на день: повторный ввод за тот же день заменяет значение.
export function addBodyWeight(d: AppData, date: string, value: number): AppData {
  const rest = d.bodyWeight.filter((e) => e.date !== date);
  return { ...d, bodyWeight: [...rest, { id: newId(), date, value }].sort(byDay) };
}

export type MeasurementValues = Omit<MeasurementEntry, 'id' | 'date'>;

// Замеры за тот же день объединяются (новые значения поверх старых).
export function addMeasurement(d: AppData, date: string, values: MeasurementValues): AppData {
  const same = d.measurements.find((e) => e.date === date);
  const clean = Object.fromEntries(Object.entries(values).filter(([, v]) => v != null)) as MeasurementValues;
  const entry: MeasurementEntry = { ...same, ...clean, id: same?.id ?? newId(), date };
  return { ...d, measurements: [...d.measurements.filter((e) => e.date !== date), entry].sort(byDay) };
}

export function removeEntry(d: AppData, list: 'bodyWeight' | 'measurements', id: string): AppData {
  return list === 'bodyWeight'
    ? { ...d, bodyWeight: d.bodyWeight.filter((e) => e.id !== id) }
    : { ...d, measurements: d.measurements.filter((e) => e.id !== id) };
}

// Записи по дате, новые сверху (импорт может принести любой порядок).
export function latestFirst<T extends { date: string }>(entries: T[]): T[] {
  return [...entries].sort(byDay).reverse();
}

export function weightSeries(entries: BodyWeightEntry[]): Point[] {
  return [...entries].sort(byDay).map((e) => ({ x: dayDate(e.date).getTime(), y: e.value, date: e.date }));
}

// ---- История ----

// Завершённые тренировки, новые сверху.
export function finishedSessions(sessions: Session[]): Session[] {
  return sessions
    .filter((s) => s.finishedAt)
    .sort((a, b) => (a.finishedAt! < b.finishedAt! ? 1 : a.finishedAt! > b.finishedAt! ? -1 : 0));
}

// ---- Прогресс по упражнению ----

// Ключ — название варианта: одно движение из разных тренировок (напр. жим ногами в A и C) — один график.
export type ProgressItem = { key: string; mode: Mode; count: number };

function bestValue(log: Session['exercises'][number], mode: Mode): number | undefined {
  const work = log.sets.filter((s) => s.type === 'work');
  const values = work
    .map((s) => (mode === 'weight' ? s.factWeight : mode === 'time' ? s.factSeconds : s.factReps))
    .filter((v): v is number => v != null && v > 0);
  return values.length > 0 ? Math.max(...values) : undefined;
}

function* results(sessions: Session[]) {
  for (const s of finishedSessions(sessions).reverse()) {
    for (const log of s.exercises) {
      const variant = getVariant(getExercise(log.exerciseId), log.variant);
      const value = bestValue(log, variant.mode);
      if (value != null) yield { session: s, key: variant.name, mode: variant.mode, value };
    }
  }
}

export function progressItems(sessions: Session[]): ProgressItem[] {
  const map = new Map<string, ProgressItem>();
  for (const r of results(sessions)) {
    const item = map.get(r.key) ?? { key: r.key, mode: r.mode, count: 0 };
    map.set(r.key, { ...item, count: item.count + 1 });
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key, 'ru'));
}

// Рабочий вес (свой вес — повторы, планка — секунды): максимум среди рабочих подходов за тренировку.
export function progressSeries(sessions: Session[], key: string): Point[] {
  const out: Point[] = [];
  for (const r of results(sessions)) {
    if (r.key !== key) continue;
    const date = r.session.finishedAt!;
    out.push({ x: new Date(date).getTime(), y: r.value, date });
  }
  return out;
}

// ---- Экспорт / импорт ----

export function exportData(d: AppData): string {
  return JSON.stringify(d);
}

export type ImportResult = { ok: true; data: AppData } | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v);

function validSession(s: unknown): boolean {
  if (!isObj(s) || typeof s.id !== 'string' || typeof s.startedAt !== 'string') return false;
  try {
    getTemplate(String(s.templateId));
  } catch {
    return false;
  }
  if (!Array.isArray(s.exercises)) return false;
  return s.exercises.every((l) => {
    if (!isObj(l) || !Array.isArray(l.sets) || (l.variant !== 'machine' && l.variant !== 'free')) return false;
    try {
      getExercise(String(l.exerciseId));
      return true;
    } catch {
      return false;
    }
  });
}

export function parseImport(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text.trim());
  } catch {
    return { ok: false, error: 'Это не JSON. Скопируйте текст экспорта целиком.' };
  }
  if (!isObj(raw) || (raw.version !== 1 && raw.version !== 2)) return { ok: false, error: 'Неизвестный формат: это не экспорт TOCHKA Fitness.' };
  const p = raw.profile;
  if (!isObj(p) || !isNum(p.age) || !isNum(p.heightIn) || !isNum(p.startWeight)) {
    return { ok: false, error: 'Повреждён профиль.' };
  }
  const { sessions, bodyWeight, measurements } = raw;
  if (!Array.isArray(sessions) || !sessions.every(validSession)) return { ok: false, error: 'Повреждена история тренировок.' };
  if (!Array.isArray(bodyWeight) || !bodyWeight.every((e) => isObj(e) && typeof e.date === 'string' && isNum(e.value))) {
    return { ok: false, error: 'Повреждены записи веса.' };
  }
  if (!Array.isArray(measurements) || !measurements.every((e) => isObj(e) && typeof e.date === 'string')) {
    return { ok: false, error: 'Повреждены замеры.' };
  }
  const base = defaultData();
  return {
    ok: true,
    data: migrateData({
      ...base,
      version: raw.version,
      profile: { age: p.age as number, heightIn: p.heightIn as number, startWeight: p.startWeight as number },
      lengthChoice: isObj(raw.lengthChoice) ? (raw.lengthChoice as AppData['lengthChoice']) : base.lengthChoice,
      variantChoice: isObj(raw.variantChoice) ? (raw.variantChoice as AppData['variantChoice']) : base.variantChoice,
      plans: isObj(raw.plans) ? (raw.plans as AppData['plans']) : base.plans,
      records: isObj(raw.records) ? (raw.records as AppData['records']) : base.records,
      sessions: sessions as Session[],
      bodyWeight: bodyWeight as BodyWeightEntry[],
      measurements: measurements as MeasurementEntry[],
      // Еда, сон и пробежки проверяются в migrateData.
      food: raw.food as AppData['food'],
      sleep: raw.sleep as AppData['sleep'],
      runs: raw.runs as AppData['runs'],
      // Незавершённые тренировка и пробежка и открытый итог не переносятся.
      activeSession: null,
      activeRun: null,
      summaryId: null,
    }),
  };
}
