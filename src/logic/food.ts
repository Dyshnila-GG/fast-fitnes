import {
  DISHES,
  GYM_WEEKDAYS,
  PRODUCT_SECTIONS,
  PRODUCTS,
  SCHEDULE,
  type DayType,
  type DishId,
  type ProductId,
  type ProductSection,
} from '../data/food';
import { defaultFood } from '../store/defaults';
import type { AppData, FoodData } from '../types';
import { dayDate, shiftDay, weekStart } from './dates';
import { fromMinutes, isTime, toMinutes } from './time';

// Приём пищи на конкретную дату (с учётом Вс-исключений, замен и своего времени).
export type Meal = {
  slot: string;
  title: string;
  time: string; // «HH:MM»
  dishes: DishId[];
  swapped: boolean;
  kcal: number;
  protein: number;
};

export function dayType(day: string): DayType {
  return GYM_WEEKDAYS.includes(dayDate(day).getDay()) ? 'gym' : 'rest';
}

export const sumKcal = (dishes: DishId[]) => dishes.reduce((n, id) => n + DISHES[id].kcal, 0);
export const sumProtein = (dishes: DishId[]) => dishes.reduce((n, id) => n + DISHES[id].protein, 0);

export function mealsFor(food: FoodData, day: string): Meal[] {
  const type = dayType(day);
  const sunday = dayDate(day).getDay() === 0;
  const swaps = food.swaps[day] ?? {};
  return SCHEDULE[type].map((s) => {
    const swap = swaps[s.id];
    const dishes = swap ? [swap] : sunday && s.sunday ? s.sunday : s.dishes;
    return {
      slot: s.id,
      title: s.title,
      time: food.times[type][s.id] ?? s.time,
      dishes,
      swapped: swap != null,
      kcal: sumKcal(dishes),
      protein: sumProtein(dishes),
    };
  });
}

export function isEaten(food: FoodData, day: string, slot: string): boolean {
  return (food.eaten[day] ?? []).includes(slot);
}

export type DayTotals = {
  eaten: number;
  total: number;
  kcalEaten: number;
  kcalTotal: number;
  proteinEaten: number;
  proteinTotal: number;
};

// Сумма отмеченных приёмов / сумма всех приёмов дня.
export function dayTotals(food: FoodData, day: string): DayTotals {
  const t: DayTotals = { eaten: 0, total: 0, kcalEaten: 0, kcalTotal: 0, proteinEaten: 0, proteinTotal: 0 };
  for (const m of mealsFor(food, day)) {
    t.total += 1;
    t.kcalTotal += m.kcal;
    t.proteinTotal += m.protein;
    if (isEaten(food, day, m.slot)) {
      t.eaten += 1;
      t.kcalEaten += m.kcal;
      t.proteinEaten += m.protein;
    }
  }
  return t;
}

const withFood = (d: AppData, food: Partial<FoodData>): AppData => ({ ...d, food: { ...d.food, ...food } });

// Повторное нажатие снимает отметку.
export function toggleEaten(d: AppData, day: string, slot: string): AppData {
  const list = d.food.eaten[day] ?? [];
  const next = list.includes(slot) ? list.filter((s) => s !== slot) : [...list, slot];
  const eaten = { ...d.food.eaten, [day]: next };
  if (next.length === 0) delete eaten[day];
  return withFood(d, { eaten });
}

// Замена блюда только на эту дату; null — вернуть блюдо по расписанию.
export function setSwap(d: AppData, day: string, slot: string, dish: DishId | null): AppData {
  const dayMap = { ...(d.food.swaps[day] ?? {}) };
  if (dish) dayMap[slot] = dish;
  else delete dayMap[slot];
  const swaps = { ...d.food.swaps, [day]: dayMap };
  if (Object.keys(dayMap).length === 0) delete swaps[day];
  return withFood(d, { swaps });
}

export function setPhoto(d: AppData, dish: DishId, uri: string | null): AppData {
  const photos = { ...d.food.photos };
  if (uri) photos[dish] = uri;
  else delete photos[dish];
  return withFood(d, { photos });
}

// ---- Свой рецепт блюда (SPEC_v3_2 §5.3): по dishId, во всех приёмах и днях ----

// Стандартный рецепт — шаги блюда (у блюд с рисом — и салат).
export function standardRecipe(dish: DishId): string {
  const d = DISHES[dish];
  const steps = d.steps.map((step, i) => `${i + 1}. ${step}`);
  if (d.salad) steps.push(`Салат: ${DISHES.salad.steps.join(', ').toLowerCase()}`);
  return steps.join('\n');
}

export function recipeOf(food: FoodData, dish: DishId): { text: string; custom: boolean } {
  const own = food.recipes[dish];
  return own ? { text: own, custom: true } : { text: standardRecipe(dish), custom: false };
}

// Пустой текст или null — вернуть стандартный.
export function setRecipe(d: AppData, dish: DishId, text: string | null): AppData {
  const recipes = { ...d.food.recipes };
  const clean = text?.trim();
  if (clean) recipes[dish] = clean;
  else delete recipes[dish];
  return withFood(d, { recipes });
}

// ---- Продукты на неделю (SPEC_v3_2 §5.2): меню пн–вс с заменами, салат у блюд с рисом ----

export type ProductRow = { product: ProductId; name: string; g: number; count?: number; amount: string; text: string };
export type ProductGroup = { section: ProductSection; title: string; rows: ProductRow[] };

// «Рис (сухой) — 880 г», «Бананы — 8 шт. (~960 г)»
export function formatProductRow(product: ProductId, g: number): ProductRow {
  const p = PRODUCTS[product];
  const grams = `${formatNum(g)} г`;
  const count = p.piece ? Math.round((g / p.piece.g) * 10) / 10 : undefined;
  const amount = p.piece ? `${String(count).replace('.', ',')} ${p.piece.unit} (~${grams})` : grams;
  return { product, name: p.name, g, count, amount, text: `${p.name} — ${amount}` };
}

// Сумма граммов по продуктам за дни [from, from + days).
export function productTotals(food: FoodData, from: string, days = 7): Partial<Record<ProductId, number>> {
  const totals: Partial<Record<ProductId, number>> = {};
  for (let i = 0; i < days; i++) {
    for (const meal of mealsFor(food, shiftDay(from, i))) {
      for (const id of meal.dishes) {
        const items = DISHES[id].salad ? [...DISHES[id].items, ...DISHES.salad.items] : DISHES[id].items;
        for (const { product, g } of items) totals[product] = (totals[product] ?? 0) + g;
      }
    }
  }
  return totals;
}

// Сгруппировано по разделам (порядок разделов фиксирован), внутри — по алфавиту; пустых разделов нет.
export function weekProducts(food: FoodData, day: string): ProductGroup[] {
  const totals = productTotals(food, weekStart(day));
  return PRODUCT_SECTIONS.map(({ id, title }) => ({
    section: id,
    title,
    rows: (Object.keys(totals) as ProductId[])
      .filter((p) => PRODUCTS[p].section === id)
      .map((p) => formatProductRow(p, totals[p]!))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
  })).filter((g) => g.rows.length > 0);
}

// Напоминание про лосось — накануне дня, где в меню лосось.
export function salmonTomorrow(food: FoodData, day: string): boolean {
  return mealsFor(food, shiftDay(day, 1)).some((m) => m.dishes.includes('salmon_rice'));
}

// ---- Время приёмов ----

// «07:00» → «~7:00»
export const formatMealTime = (time: string) => `~${Number(time.slice(0, 2))}:${time.slice(3)}`;

export function mealTime(food: FoodData, type: DayType, slot: string): string {
  return food.times[type][slot] ?? SCHEDULE[type].find((s) => s.id === slot)!.time;
}

// Сдвиг времени приёма (кнопки −/+ в настройках); по умолчанию — запись удаляется.
export function shiftMealTime(d: AppData, type: DayType, slot: string, deltaMin: number): AppData {
  const def = SCHEDULE[type].find((s) => s.id === slot)!.time;
  const next = fromMinutes(toMinutes(mealTime(d.food, type, slot)) + deltaMin);
  const map = { ...d.food.times[type] };
  if (next === def) delete map[slot];
  else map[slot] = next;
  return withFood(d, { times: { ...d.food.times, [type]: map } });
}

export function resetMealTimes(d: AppData): AppData {
  return withFood(d, { times: { gym: {}, rest: {} } });
}

// Ближайший неотмеченный приём: первый, чьё время не раньше чем час назад;
// если все такие уже прошли — последний неотмеченный. Все отмечены — undefined.
export const NEXT_GRACE_MIN = 60;

export function nextMeal(food: FoodData, day: string, nowMin: number): Meal | undefined {
  const open = mealsFor(food, day).filter((m) => !isEaten(food, day, m.slot));
  return open.find((m) => toMinutes(m.time) >= nowMin - NEXT_GRACE_MIN) ?? open[open.length - 1];
}

// ---- Статистика за 7 дней (включая сегодня) ----

export type FoodStats = { eaten: number; total: number; avgKcal: number; avgProtein: number };

export function foodStats(food: FoodData, today: string, days = 7): FoodStats {
  const s = { eaten: 0, total: 0, kcal: 0, protein: 0 };
  for (let i = 0; i < days; i++) {
    const t = dayTotals(food, shiftDay(today, -i));
    s.eaten += t.eaten;
    s.total += t.total;
    s.kcal += t.kcalEaten;
    s.protein += t.proteinEaten;
  }
  return { eaten: s.eaten, total: s.total, avgKcal: Math.round(s.kcal / days), avgProtein: Math.round(s.protein / days) };
}

// 3320 → «3 320»
export const formatNum = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// ---- Импорт: берём только корректные записи ----

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isDay = (k: string) => /^\d{4}-\d{2}-\d{2}$/.test(k);
const isDish = (v: unknown): v is DishId => typeof v === 'string' && v in DISHES;

// Переименованные и удалённые блюда (SPEC_v3_1): старые записи переносятся.
const RENAMED: Record<string, DishId> = { chicken_sandwich: 'meat_sandwich', rotisserie_rice: 'chicken_rice' };
const dishOf = (v: unknown): DishId | undefined =>
  typeof v !== 'string' ? undefined : isDish(v) ? v : RENAMED[v];

function strLists(v: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!isObj(v)) return out;
  for (const [k, list] of Object.entries(v)) {
    if (!isDay(k) || !Array.isArray(list)) continue;
    const items = list.filter((x): x is string => typeof x === 'string');
    if (items.length > 0) out[k] = items;
  }
  return out;
}

function times(v: unknown): Record<string, string> {
  if (!isObj(v)) return {};
  return Object.fromEntries(Object.entries(v).filter(([, t]) => isTime(t))) as Record<string, string>;
}

export function sanitizeFood(raw: unknown): FoodData {
  const food = defaultFood();
  if (!isObj(raw)) return food;
  food.eaten = strLists(raw.eaten);
  if (isObj(raw.swaps)) {
    for (const [k, map] of Object.entries(raw.swaps)) {
      if (!isDay(k) || !isObj(map)) continue;
      const clean: Record<string, DishId> = {};
      for (const [slot, dish] of Object.entries(map)) {
        const id = dishOf(dish);
        if (id) clean[slot] = id;
      }
      if (Object.keys(clean).length > 0) food.swaps[k] = clean;
    }
  }
  if (isObj(raw.photos)) {
    // Своё фото курицы-гриль не переносится: блюда больше нет.
    for (const [k, uri] of Object.entries(raw.photos)) {
      const id = k === 'rotisserie_rice' ? undefined : dishOf(k);
      if (id && typeof uri === 'string' && (k === id || food.photos[id] == null)) food.photos[id] = uri;
    }
  }
  if (isObj(raw.recipes)) {
    for (const [k, text] of Object.entries(raw.recipes)) {
      const id = dishOf(k);
      if (id && typeof text === 'string' && text.trim() && (k === id || food.recipes[id] == null)) food.recipes[id] = text.trim();
    }
  }
  if (isObj(raw.times)) food.times = { gym: times(raw.times.gym), rest: times(raw.times.rest) };
  return food;
}
