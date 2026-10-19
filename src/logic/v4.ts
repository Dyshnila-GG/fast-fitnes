import { isStdProduct, PRODUCTS, type DishId } from '../data/food';
import { NUTRITION, type Per100 } from '../data/nutrition';
import type {
  Activity,
  ActivityType,
  AppData,
  BodyFlag,
  BodyWeightEntry,
  FoodBatch,
  FoodData,
  FoodFact,
  FoodFactItem,
  MeasurementEntry,
  NutritionMode,
  V4Data,
} from '../types';
import { dayDate, shiftDay } from './dates';
import { mealsFor, isEaten } from './food';
import { newId } from './id';
import { isNum, isObj } from './validate';

const DAY_MS = 86_400_000;
const round1 = (n: number) => Math.round(n * 10) / 10;
const withV4 = (d: AppData, patch: Partial<V4Data>): AppData => ({ ...d, v4: { ...d.v4, ...patch } });

// =====================================================================
// Питание (handoff §16–19): рецепт — шаблон, съеденное — факт в граммах.
// =====================================================================

export function per100Of(food: FoodData, product?: string): Per100 | undefined {
  if (!product) return undefined;
  if (isStdProduct(product)) return NUTRITION[product];
  return food.products[product]?.per100;
}

export function productName(food: FoodData, product?: string): string {
  if (!product) return '';
  return isStdProduct(product) ? PRODUCTS[product].name : (food.products[product]?.name ?? product);
}

/** Факт по продукту: граммы известны → считаем из справочника на 100 г. */
export function itemFromProduct(food: FoodData, product: string, g: number): FoodFactItem {
  const n = per100Of(food, product);
  return {
    product,
    name: productName(food, product),
    g,
    kcal: n ? Math.round((n.kcal * g) / 100) : 0,
    protein: n ? round1((n.protein * g) / 100) : 0,
  };
}

/** Свой продукт без справочника: калории и белок порции вводятся вручную. */
export function manualItem(name: string, g: number, kcal: number, protein: number, estimated = false): FoodFactItem {
  return { name, g, kcal: Math.round(kcal), protein: round1(protein), estimated: estimated || undefined };
}

export function sumItems(items: { kcal: number; protein: number }[]): { kcal: number; protein: number } {
  return items.reduce((t, i) => ({ kcal: t.kcal + i.kcal, protein: round1(t.protein + i.protein) }), { kcal: 0, protein: 0 });
}

/** Шаблон блюда → редактируемые строки факта (граммы по рецепту, их можно поправить). */
export function itemsFromDish(food: FoodData, dishId: DishId): FoodFactItem[] {
  const dish = food.dishes[dishId];
  if (!dish) return [];
  const items = dish.items.map((i) => itemFromProduct(food, i.product, i.g));
  const known = sumItems(items.filter((i) => per100Of(food, i.product)));
  // Если у блюда есть продукты без справочника — недостающее берём из калорийности блюда.
  const unknown = items.some((i) => !per100Of(food, i.product));
  if (unknown && dish.kcal > known.kcal) {
    return [...items.filter((i) => per100Of(food, i.product)), manualItem(`${dish.name}: остальное`, 0, dish.kcal - known.kcal, Math.max(0, dish.protein - known.protein), true)];
  }
  return items;
}

export function makeFact(date: string, title: string, items: FoodFactItem[], extra: Partial<Pick<FoodFact, 'slot' | 'batchId'>> = {}): FoodFact {
  const t = sumItems(items);
  return { id: newId(), date, title, items, kcal: t.kcal, protein: t.protein, ...extra };
}

export function addFact(d: AppData, fact: FoodFact): AppData {
  // Один факт на приём из расписания: новый заменяет старый.
  const rest = d.v4.facts.filter((f) => !(fact.slot && f.date === fact.date && f.slot === fact.slot));
  return withV4(d, { facts: [...rest, fact] });
}

export const removeFact = (d: AppData, id: string): AppData => withV4(d, { facts: d.v4.facts.filter((f) => f.id !== id) });

export const factsOn = (d: AppData, day: string) => d.v4.facts.filter((f) => f.date === day);

/**
 * Съедено за день: факты + отмеченные приёмы расписания, у которых нет факта.
 * Факт с привязкой к приёму заменяет шаблон этого приёма — двойного подсчёта нет.
 */
export function eatenTotals(d: AppData, day: string): { kcal: number; protein: number; facts: number } {
  const facts = factsOn(d, day);
  const bySlot = new Set(facts.map((f) => f.slot).filter(Boolean));
  let kcal = 0;
  let protein = 0;
  for (const m of mealsFor(d.food, day)) {
    if (bySlot.has(m.slot) || !isEaten(d.food, day, m.slot)) continue;
    kcal += m.kcal;
    protein += m.protein;
  }
  for (const f of facts) {
    kcal += f.kcal;
    protein += f.protein;
  }
  return { kcal: Math.round(kcal), protein: round1(protein), facts: facts.length };
}

// ---- Заготовки (§17): масса после готовки меняется из-за воды, калории — нет. ----

export function makeBatch(date: string, title: string, inputs: FoodBatch['inputs'], outputG: number): FoodBatch {
  const t = sumItems(inputs);
  return { id: newId(), date, title, inputs, outputG, kcal: t.kcal, protein: t.protein };
}

export const addBatch = (d: AppData, b: FoodBatch): AppData => withV4(d, { batches: [...d.v4.batches.filter((x) => x.id !== b.id), b] });
export const removeBatch = (d: AppData, id: string): AppData => withV4(d, { batches: d.v4.batches.filter((x) => x.id !== id) });

/** Порция готового блюда из заготовки: доля от сырых калорий. */
export function portionItem(b: FoodBatch, portionG: number): FoodFactItem {
  const share = b.outputG > 0 ? portionG / b.outputG : 0;
  return { name: b.title, g: portionG, kcal: Math.round(b.kcal * share), protein: round1(b.protein * share) };
}

// ---- Цель (§19) ----

export const NUTRITION_MODES: { value: NutritionMode; label: string; surplus: number }[] = [
  { value: 'maintain', label: 'Maintain', surplus: 0 },
  { value: 'lean_gain', label: 'Lean Gain', surplus: 250 },
  { value: 'fast_gain', label: 'Fast Gain', surplus: 500 },
];

/** Поддержка при высокой активности: ~16 ккал на фунт веса тела (оценка, не точный расчёт). */
export const KCAL_PER_LB = 16;

export type NutritionTarget = {
  mode: NutritionMode;
  weightLb: number;
  maintenance: number;
  kcal: number;
  protein: number;
  excessFat: boolean;
};

export function nutritionTarget(d: AppData, today: string): NutritionTarget {
  const weightLb = trendSummary(d.bodyWeight, today).trend ?? d.profile.startWeight;
  const maintenance = Math.round((weightLb * KCAL_PER_LB) / 10) * 10;
  const mode = d.v4.nutrition.mode;
  const surplus = NUTRITION_MODES.find((m) => m.value === mode)?.surplus ?? 0;
  return {
    mode,
    weightLb,
    maintenance,
    kcal: d.v4.nutrition.kcalOverride ?? maintenance + surplus,
    protein: d.v4.nutrition.proteinG,
    excessFat: recentExcessFat(d, today),
  };
}

export const setNutrition = (d: AppData, patch: Partial<V4Data['nutrition']>): AppData =>
  withV4(d, { nutrition: { ...d.v4.nutrition, ...patch } });

// =====================================================================
// Тело (§20): сглаженный тренд, талия раз в неделю, «замечаю лишний жир».
// =====================================================================

/** Экспоненциальное сглаживание с учётом пропусков: 10% нового веса за каждый день. */
export function weightTrend(entries: BodyWeightEntry[]): { date: string; value: number; trend: number }[] {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1));
  const out: { date: string; value: number; trend: number }[] = [];
  for (const e of sorted) {
    const prev = out[out.length - 1];
    if (!prev) {
      out.push({ date: e.date, value: e.value, trend: e.value });
      continue;
    }
    const days = Math.max(1, Math.round((dayDate(e.date).getTime() - dayDate(prev.date).getTime()) / DAY_MS));
    const k = 1 - Math.pow(0.9, days);
    out.push({ date: e.date, value: e.value, trend: prev.trend + k * (e.value - prev.trend) });
  }
  return out;
}

/** Текущий тренд и изменение за неделю (lb/нед) — по тренду, а не по одному взвешиванию. */
export function trendSummary(entries: BodyWeightEntry[], today: string): { trend?: number; weekly?: number } {
  const series = weightTrend(entries.filter((e) => e.date <= today));
  const last = series[series.length - 1];
  if (!last) return {};
  const weekAgo = shiftDay(last.date, -7);
  const base = [...series].reverse().find((p) => p.date <= weekAgo);
  if (!base) return { trend: round1(last.trend) };
  const days = (dayDate(last.date).getTime() - dayDate(base.date).getTime()) / DAY_MS;
  return { trend: round1(last.trend), weekly: round1(((last.trend - base.trend) * 7) / days) };
}

export function waistStatus(measurements: MeasurementEntry[], today: string): { due: boolean; daysSince?: number; last?: number } {
  const last = [...measurements].filter((m) => m.waist != null && m.date <= today).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  if (!last) return { due: true };
  const daysSince = Math.round((dayDate(today).getTime() - dayDate(last.date).getTime()) / DAY_MS);
  return { due: daysSince >= 7, daysSince, last: last.waist };
}

export function addBodyFlag(d: AppData, date: string): AppData {
  const flag: BodyFlag = { id: newId(), date, kind: 'excess_fat' };
  return withV4(d, { bodyFlags: [...d.v4.bodyFlags.filter((f) => f.date !== date), flag] });
}

export const removeBodyFlag = (d: AppData, id: string): AppData => withV4(d, { bodyFlags: d.v4.bodyFlags.filter((f) => f.id !== id) });

export function recentExcessFat(d: AppData, today: string, days = 14): boolean {
  const from = shiftDay(today, -days);
  return d.v4.bodyFlags.some((f) => f.kind === 'excess_fat' && f.date >= from && f.date <= today);
}

// =====================================================================
// Активности и восстановление (§22)
// =====================================================================

export const ACTIVITY_TYPES: { value: ActivityType; label: string; legs: boolean }[] = [
  { value: 'volleyball', label: 'Волейбол', legs: true },
  { value: 'run', label: 'Бег', legs: true },
  { value: 'walk', label: 'Ходьба', legs: false },
  { value: 'cycling', label: 'Велосипед', legs: true },
  { value: 'gym', label: 'Зал', legs: false },
  { value: 'custom', label: 'Другое', legs: false },
];

export const activityLabel = (a: Activity) => a.title || ACTIVITY_TYPES.find((t) => t.value === a.type)?.label || a.type;

export function addActivity(d: AppData, a: Omit<Activity, 'id' | 'source'>): AppData {
  // Дедупликация: та же активность того же типа в тот же день и с той же длительностью — одна запись.
  const dup = d.v4.activities.find((x) => x.date === a.date && x.type === a.type && Math.abs(x.minutes - a.minutes) <= 5);
  const next: Activity = { ...a, id: dup?.id ?? newId(), source: dup?.source ?? 'manual' };
  return withV4(d, { activities: [...d.v4.activities.filter((x) => x.id !== next.id), next] });
}

export const removeActivity = (d: AppData, id: string): AppData => withV4(d, { activities: d.v4.activities.filter((x) => x.id !== id) });

/**
 * Тяжёлая нагрузка на ноги за последние 48 ч (например, волейбол). Это подсказка, а не запрет:
 * плохое восстановление само по себе тренировку не отменяет; боль — отдельный сигнал.
 */
export function legsFatigue(d: AppData, today: string): Activity | undefined {
  const from = shiftDay(today, -2);
  return d.v4.activities
    .filter((a) => a.legs && a.date >= from && a.date <= today && ((a.rpe ?? 5) >= 6 || a.minutes >= 45))
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

export const LEG_EXERCISES = new Set(['leg-press', 'seated-leg-curl', 'calf-raise']);

// =====================================================================
// Проверка сохранённых/импортированных данных
// =====================================================================

const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const day = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const nonneg = (v: unknown): v is number => isNum(v) && v >= 0;

function cleanItem(raw: unknown): FoodFactItem | null {
  if (!isObj(raw) || !str(raw.name) || !nonneg(raw.g) || !nonneg(raw.kcal) || !nonneg(raw.protein)) return null;
  return {
    name: raw.name,
    g: raw.g,
    kcal: raw.kcal,
    protein: raw.protein,
    ...(str(raw.product) ? { product: raw.product } : {}),
    ...(raw.estimated === true ? { estimated: true } : {}),
  };
}

export function sanitizeV4(raw: unknown): V4Data {
  const r = isObj(raw) ? raw : {};
  const n = isObj(r.nutrition) ? r.nutrition : {};
  const mode: NutritionMode = n.mode === 'maintain' || n.mode === 'lean_gain' || n.mode === 'fast_gain' ? n.mode : 'fast_gain';
  const facts: FoodFact[] = (Array.isArray(r.facts) ? r.facts : []).flatMap((f) => {
    if (!isObj(f) || !str(f.id) || !day(f.date) || !Array.isArray(f.items)) return [];
    const items = f.items.map(cleanItem).filter((x): x is FoodFactItem => x != null);
    const t = sumItems(items);
    return [{ id: f.id, date: f.date, title: str(f.title) ? f.title : 'Приём пищи', items, kcal: t.kcal, protein: t.protein, ...(str(f.slot) ? { slot: f.slot } : {}), ...(str(f.batchId) ? { batchId: f.batchId } : {}) }];
  });
  const batches: FoodBatch[] = (Array.isArray(r.batches) ? r.batches : []).flatMap((b) => {
    if (!isObj(b) || !str(b.id) || !day(b.date) || !str(b.title) || !nonneg(b.outputG) || !Array.isArray(b.inputs)) return [];
    const inputs = b.inputs.map(cleanItem).filter((x): x is FoodFactItem => x != null);
    const t = sumItems(inputs);
    return [{ id: b.id, date: b.date, title: b.title, inputs, outputG: b.outputG, kcal: t.kcal, protein: t.protein }];
  });
  const types = ACTIVITY_TYPES.map((t) => t.value) as string[];
  const activities: Activity[] = (Array.isArray(r.activities) ? r.activities : []).flatMap((a) => {
    if (!isObj(a) || !str(a.id) || !day(a.date) || !types.includes(a.type as string) || !nonneg(a.minutes)) return [];
    return [{
      id: a.id, date: a.date, type: a.type as ActivityType, minutes: a.minutes, legs: a.legs === true,
      source: a.source === 'garmin' ? 'garmin' : 'manual',
      ...(str(a.title) ? { title: a.title } : {}),
      ...(isNum(a.rpe) && a.rpe >= 1 && a.rpe <= 10 ? { rpe: a.rpe } : {}),
    } as Activity];
  });
  const bodyFlags: BodyFlag[] = (Array.isArray(r.bodyFlags) ? r.bodyFlags : []).flatMap((f) =>
    isObj(f) && str(f.id) && day(f.date) && f.kind === 'excess_fat' ? [{ id: f.id, date: f.date, kind: 'excess_fat' as const }] : [],
  );
  return {
    nutrition: {
      mode,
      proteinG: isNum(n.proteinG) && n.proteinG > 0 && n.proteinG < 500 ? n.proteinG : 150,
      ...(isNum(n.kcalOverride) && n.kcalOverride > 0 && n.kcalOverride < 10000 ? { kcalOverride: n.kcalOverride } : {}),
    },
    facts,
    batches,
    activities,
    bodyFlags,
  };
}
