import { getExercise, getVariant } from '../data/program';
import { defaultData } from '../store/defaults';
import { migrateData } from '../store/migrate';
import type { AppData, BodyWeightEntry, MeasurementEntry, Mode, Session } from '../types';
import { t } from '../i18n';
import { newId } from './id';
import { isNum, isObj, validSession } from './validate';

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

const newerIso = (a?: string, b?: string) => (!a ? b : !b ? a : a >= b ? a : b);
const uniqBy = <T>(items: T[], key: (x: T) => string): T[] => {
  const m = new Map<string, T>();
  for (const x of items) m.set(key(x), x);
  return [...m.values()];
};

/** Add an old backup to current data without deleting newer history. Current-day values win conflicts. */
export function mergeImportedData(current: AppData, old: AppData): AppData {
  const sessions = uniqBy([...old.sessions, ...current.sessions], (x) => x.id || `${x.startedAt}:${x.templateId}`);
  const bodyWeight = uniqBy([...old.bodyWeight, ...current.bodyWeight], (x) => x.date).sort(byDay);
  const measurements = uniqBy([...old.measurements, ...current.measurements], (x) => x.date).sort(byDay);
  const sleep = { ...old.sleep, ...current.sleep };
  const runs = { ...old.runs, ...current.runs };
  const food = {
    ...old.food,
    ...current.food,
    eaten: { ...old.food.eaten, ...current.food.eaten },
    swaps: { ...old.food.swaps, ...current.food.swaps },
    photos: { ...old.food.photos, ...current.food.photos },
    recipes: { ...old.food.recipes, ...current.food.recipes },
    dishes: { ...old.food.dishes, ...current.food.dishes },
    products: { ...old.food.products, ...current.food.products },
    schedule: current.food.schedule?.length ? current.food.schedule : old.food.schedule,
  };
  const trash = uniqBy([...old.trash, ...current.trash], (x) => x.session.id);
  const v4 = {
    ...old.v4,
    ...current.v4,
    facts: uniqBy([...old.v4.facts, ...current.v4.facts], (x) => x.id),
    batches: uniqBy([...old.v4.batches, ...current.v4.batches], (x) => x.id),
    activities: uniqBy([...old.v4.activities, ...current.v4.activities], (x) => x.id),
    bodyFlags: uniqBy([...old.v4.bodyFlags, ...current.v4.bodyFlags], (x) => x.id),
  };
  return {
    ...old,
    ...current,
    profile: { ...old.profile, ...current.profile },
    sessions,
    bodyWeight,
    measurements,
    sleep,
    runs,
    food,
    trash,
    v4,
    records: { ...old.records, ...current.records },
    plans: { ...old.plans, ...current.plans },
    lengthChoice: { ...old.lengthChoice, ...current.lengthChoice },
    variantChoice: { ...old.variantChoice, ...current.variantChoice },
    installedPlan: current.installedPlan ?? old.installedPlan,
    activeSession: current.activeSession,
    activeRun: current.activeRun,
    summaryId: current.summaryId,
    backup: current.backup,
    reminders: current.reminders,
    settings: current.settings,
  };
}


export function parseImport(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text.trim());
  } catch {
    return { ok: false, error: t('import.notJson') };
  }
  if (!isObj(raw) || (raw.version !== 1 && raw.version !== 2 && raw.version !== 3)) return { ok: false, error: t('import.unknown') };
  const p = raw.profile;
  if (!isObj(p) || !isNum(p.age) || !isNum(p.heightIn) || !isNum(p.startWeight)) {
    return { ok: false, error: t('import.badProfile') };
  }
  const { sessions, bodyWeight, measurements } = raw;
  if (!Array.isArray(sessions) || !sessions.every(validSession)) return { ok: false, error: t('import.badHistory') };
  if (!Array.isArray(bodyWeight) || !bodyWeight.every((e) => isObj(e) && typeof e.date === 'string' && isNum(e.value))) {
    return { ok: false, error: t('import.badWeight') };
  }
  if (!Array.isArray(measurements) || !measurements.every((e) => isObj(e) && typeof e.date === 'string')) {
    return { ok: false, error: t('import.badMeasurements') };
  }
  const base = defaultData();
  return {
    ok: true,
    data: migrateData({
      ...base,
      version: raw.version,
      profile: { ...(isObj(raw.profile) ? (raw.profile as AppData['profile']) : {}), age: p.age as number, heightIn: p.heightIn as number, startWeight: p.startWeight as number },
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
      // Корзина, бэкап, напоминания и настройки проверяются в migrateData.
      trash: raw.trash as AppData['trash'],
      backup: raw.backup as AppData['backup'],
      reminders: raw.reminders as AppData['reminders'],
      settings: raw.settings as AppData['settings'],
      // v4 Plan Pack is configuration, not personal history; preserve it across backup restore.
      installedPlan: raw.installedPlan as AppData['installedPlan'],
      // v4: факты питания, заготовки, активности, сигналы тела — проверяются в migrateData.
      v4: raw.v4 as AppData['v4'],
      // Незавершённые тренировка и пробежка и открытый итог не переносятся.
      activeSession: null,
      activeRun: null,
      summaryId: null,
    }),
  };
}
