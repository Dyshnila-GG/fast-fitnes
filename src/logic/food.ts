import {
  defaultDishes,
  defaultSchedule,
  GYM_WEEKDAYS,
  isStdDish,
  isStdProduct,
  PRODUCT_SECTIONS,
  PRODUCTS,
  SALAD,
  type DayType,
  type Dish,
  type DishId,
  type DishItem,
  type MealSlot,
  type Product,
  type ProductSection,
} from '../data/food';
import { formatNumber, getLang, t } from '../i18n';
import { dishIngredientTexts, dishName, dishSteps, mealTitle, pieceUnit, productName, sectionTitle } from '../i18n/content';
import { defaultFood } from '../store/defaults';
import type { AppData, FoodData } from '../types';
import { dayDate, shiftDay, weekStart } from './dates';
import { newId } from './id';
import { isTime, toMinutes } from './time';
import { convertTemps } from './units';

// Приём пищи на конкретную дату (расписание дня недели + замены).
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

export const dayTypeLabel = (type: DayType) => t(`dayType.${type}`);

export const dishOf = (food: FoodData, id: DishId): Dish | undefined => food.dishes[id];
export const productOf = (food: FoodData, id: string): Product | undefined => (isStdProduct(id) ? PRODUCTS[id] : food.products[id]);

export const sumKcal = (food: FoodData, dishes: DishId[]) => dishes.reduce((n, id) => n + (food.dishes[id]?.kcal ?? 0), 0);
export const sumProtein = (food: FoodData, dishes: DishId[]) => dishes.reduce((n, id) => n + (food.dishes[id]?.protein ?? 0), 0);

export const slotsOf = (food: FoodData, weekday: number): MealSlot[] => food.schedule[weekday] ?? [];

const existing = (food: FoodData, ids: DishId[]) => ids.filter((id) => food.dishes[id] != null);

export function mealsFor(food: FoodData, day: string): Meal[] {
  const swaps = food.swaps[day] ?? {};
  return slotsOf(food, dayDate(day).getDay()).map((s) => {
    const swap = swaps[s.id];
    const swapped = swap != null && food.dishes[swap] != null;
    const dishes = swapped ? [swap] : existing(food, s.dishes);
    return {
      slot: s.id,
      title: mealTitle(s.title),
      time: s.time,
      dishes,
      swapped,
      kcal: sumKcal(food, dishes),
      protein: sumProtein(food, dishes),
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

// Итог дня недели по расписанию (без замен) — для «Настроек».
export function scheduleTotals(food: FoodData, weekday: number): { kcal: number; protein: number } {
  const ids = slotsOf(food, weekday).flatMap((s) => existing(food, s.dishes));
  return { kcal: sumKcal(food, ids), protein: sumProtein(food, ids) };
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

// Блюда для «Заменить»: все из «Меню», кроме стандартного салата (он — часть блюд «с салатом»).
export const swapDishes = (food: FoodData): Dish[] => Object.values(food.dishes).filter((d) => d.id !== SALAD);

// ---- Ингредиенты ----

// «Мюсли — 80 г», «Бананы — 1 шт. (~120 г)»
export function itemText(food: FoodData, item: DishItem): string {
  const p = productOf(food, item.product);
  const name = productName(item.product, p);
  const count = item.count ?? (p?.piece ? Math.round((item.g / p.piece.g) * 10) / 10 : undefined);
  const grams = `${formatNum(item.g)}\u00A0${t('unit.g')}`;
  if (count != null) return `${name} — ${formatNumber(count)} ${p?.piece ? pieceUnit(p.piece.unit) : t('unit.pcs')} (~${grams})`;
  return `${name} — ${grams}`;
}

export function ingredientLines(food: FoodData, dish: Dish): string[] {
  return dishIngredientTexts(dish) ?? dish.items.map((i) => itemText(food, i));
}

// Строка салата у блюд «с салатом» (если салат есть в «Меню»).
export function saladLine(food: FoodData): string | undefined {
  const salad = food.dishes[SALAD];
  return salad ? t('food.saladLine', { items: ingredientLines(food, salad).join(', ') }) : undefined;
}

// Название блюда для показа (стандартное — на языке приложения).
export const dishTitle = (food: FoodData, id: DishId) => {
  const d = food.dishes[id];
  return d ? dishName(d) : '';
};

// ---- Рецепт блюда: свой текст по dishId, во всех приёмах и днях ----

// Стандартный рецепт — шаги блюда (у блюд с салатом — и салат). У своего блюда без шагов — пусто.
export function standardRecipe(food: FoodData, id: DishId): string {
  const d = food.dishes[id];
  const own = d && dishSteps(d);
  if (!own) return '';
  const steps = own.map((step, i) => `${i + 1}. ${step}`);
  const salad = food.dishes[SALAD];
  const saladSteps = salad && dishSteps(salad);
  if (d.salad && saladSteps) steps.push(t('food.saladLine', { items: saladSteps.join(', ').toLowerCase() }));
  return steps.join('\n');
}

// display — для показа: температура духовки в выбранных единицах (°F ↔ °C). Для правки — как хранится.
export function recipeOf(food: FoodData, dish: DishId, display = true): { text: string; custom: boolean } {
  const own = food.recipes[dish];
  const r = own ? { text: own, custom: true } : { text: standardRecipe(food, dish), custom: false };
  return display ? { ...r, text: convertTemps(r.text) } : r;
}

// Пустой текст или null — вернуть стандартный.
export function setRecipe(d: AppData, dish: DishId, text: string | null): AppData {
  const recipes = { ...d.food.recipes };
  const clean = text?.trim();
  if (clean) recipes[dish] = clean;
  else delete recipes[dish];
  return withFood(d, { recipes });
}

// ---- «Меню» — библиотека блюд (SPEC_v3_3 §C2) ----

export type DishInput = { name: string; items: DishItem[]; kcal: number; protein: number; salad: boolean };

const sameItems = (a: DishItem[], b: DishItem[]) =>
  a.length === b.length && a.every((x, i) => x.product === b[i].product && x.g === b[i].g && x.count === b[i].count);

const clean = <T extends object>(o: T): T =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

// Новое блюдо (id — null или ещё не существующий id) или изменение. Изменённое стандартное перестаёт быть «стандартным»;
// при смене ингредиентов их текст строится из строк «продукт + граммы».
export function saveDish(d: AppData, id: DishId | null, input: DishInput): { data: AppData; id: DishId } {
  const items = input.items.map((i) => clean({ product: i.product, g: i.g, count: i.count }));
  const prev = id ? d.food.dishes[id] : undefined;
  const dishId = prev?.id ?? id ?? `d_${newId()}`;
  const itemsChanged = !prev || !sameItems(prev.items, items);
  const changed =
    !prev || itemsChanged || prev.name !== input.name.trim() || prev.kcal !== input.kcal || prev.protein !== input.protein || !!prev.salad !== input.salad;
  const dish: Dish = clean({
    ...prev,
    id: dishId,
    name: input.name.trim(),
    items,
    kcal: input.kcal,
    protein: input.protein,
    salad: input.salad || undefined,
    ingredients: itemsChanged ? undefined : prev?.ingredients,
    std: changed ? undefined : prev?.std,
  });
  return { data: withFood(d, { dishes: { ...d.food.dishes, [dishId]: dish } }), id: dishId };
}

// Дни недели, где блюдо стоит в расписании (для предупреждения при удалении).
export function dishUsage(food: FoodData, id: DishId): number[] {
  return food.schedule.flatMap((slots, w) => (slots.some((s) => s.dishes.includes(id)) ? [w] : []));
}

// Удаляет блюдо из «Меню», расписания и замен; свой рецепт и фото тоже.
export function deleteDish(d: AppData, id: DishId): AppData {
  const { [id]: _dish, ...dishes } = d.food.dishes;
  const { [id]: _photo, ...photos } = d.food.photos;
  const { [id]: _recipe, ...recipes } = d.food.recipes;
  const schedule = d.food.schedule.map((slots) => slots.map((s) => (s.dishes.includes(id) ? { ...s, dishes: s.dishes.filter((x) => x !== id) } : s)));
  const swaps: FoodData['swaps'] = {};
  for (const [day, map] of Object.entries(d.food.swaps)) {
    const rest = Object.fromEntries(Object.entries(map).filter(([, dish]) => dish !== id));
    if (Object.keys(rest).length > 0) swaps[day] = rest;
  }
  return withFood(d, { dishes, photos, recipes, schedule, swaps });
}

// «Восстановить стандартное меню»: стандартные блюда и стартовое расписание; свои блюда остаются в «Меню».
export function restoreStandardMenu(d: AppData): AppData {
  const own = Object.fromEntries(Object.entries(d.food.dishes).filter(([id]) => !isStdDish(id)));
  return withFood(d, { dishes: { ...own, ...defaultDishes() }, schedule: defaultSchedule() });
}

// Новый свой продукт; такой же (имя без учёта регистра и раздел) уже есть — возвращается он.
export function addProduct(d: AppData, name: string, section: ProductSection, newProductId = `p_${newId()}`): { data: AppData; id: string } {
  const title = name.trim();
  const all = [...Object.entries(PRODUCTS), ...Object.entries(d.food.products)];
  const same = all.find(([, p]) => p.name.toLowerCase() === title.toLowerCase());
  if (same) return { data: d, id: same[0] };
  const id = newProductId;
  return { data: withFood(d, { products: { ...d.food.products, [id]: { name: title, section } } }), id };
}

// Все известные продукты (стандартные и свои) по алфавиту.
export function knownProducts(food: FoodData): { id: string; product: Product }[] {
  return [...Object.entries(PRODUCTS), ...Object.entries(food.products)]
    .map(([id, product]) => ({ id, product }))
    .sort((a, b) => productName(a.id, a.product).localeCompare(productName(b.id, b.product), getLang()));
}

// ---- «Настройки» — расписание по дням (SPEC_v3_3 §C3) ----

const withDay = (d: AppData, weekday: number, fn: (slots: MealSlot[]) => MealSlot[]): AppData =>
  withFood(d, { schedule: d.food.schedule.map((slots, w) => (w === weekday ? fn(slots) : slots)) });

export function addSlot(d: AppData, weekday: number, slot: Omit<MealSlot, 'id'>): AppData {
  return withDay(d, weekday, (slots) => [...slots, { ...slot, id: `m_${newId()}` }]);
}

export function updateSlot(d: AppData, weekday: number, id: string, patch: Partial<Omit<MealSlot, 'id'>>): AppData {
  return withDay(d, weekday, (slots) => slots.map((s) => (s.id === id ? { ...s, ...patch } : s)));
}

export function removeSlot(d: AppData, weekday: number, id: string): AppData {
  return withDay(d, weekday, (slots) => slots.filter((s) => s.id !== id));
}

// Сдвиг приёма вверх (−1) или вниз (+1).
export function moveSlot(d: AppData, weekday: number, id: string, delta: -1 | 1): AppData {
  return withDay(d, weekday, (slots) => {
    const i = slots.findIndex((s) => s.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= slots.length) return slots;
    const next = [...slots];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
}

// «Скопировать день на…»: приёмы дня заменяют приёмы выбранных дней.
export function copyDay(d: AppData, from: number, to: number[]): AppData {
  const src = slotsOf(d.food, from);
  return withFood(d, {
    schedule: d.food.schedule.map((slots, w) => (w !== from && to.includes(w) ? src.map((s) => ({ ...s, dishes: [...s.dishes] })) : slots)),
  });
}

// ---- Продукты на неделю: меню пн–вс с заменами, салат у блюд «с салатом» ----

export type ProductRow = { product: string; name: string; g: number; count?: number; amount: string; text: string };
export type ProductGroup = { section: ProductSection; title: string; rows: ProductRow[] };

// «Рис (сухой) — 880 г», «Бананы — 8 шт. (~960 г)»
export function formatProductRow(food: FoodData, product: string, g: number): ProductRow {
  const p = productOf(food, product);
  const name = productName(product, p);
  const grams = `${formatNum(g)}\u00A0${t('unit.g')}`;
  const count = p?.piece ? Math.round((g / p.piece.g) * 10) / 10 : undefined;
  const amount = p?.piece && count != null ? `${formatNumber(count)} ${pieceUnit(p.piece.unit)} (~${grams})` : grams;
  return { product, name, g, count, amount, text: `${name} — ${amount}` };
}

// Сумма граммов по продуктам за дни [from, from + days).
export function productTotals(food: FoodData, from: string, days = 7): Record<string, number> {
  const totals: Record<string, number> = {};
  const salad = food.dishes[SALAD]?.items ?? [];
  for (let i = 0; i < days; i++) {
    for (const meal of mealsFor(food, shiftDay(from, i))) {
      for (const id of meal.dishes) {
        const dish = food.dishes[id];
        const items = dish.salad ? [...dish.items, ...salad] : dish.items;
        for (const { product, g } of items) totals[product] = (totals[product] ?? 0) + g;
      }
    }
  }
  return totals;
}

// Сгруппировано по разделам (порядок разделов фиксирован), внутри — по алфавиту; пустых разделов нет.
export function weekProducts(food: FoodData, day: string): ProductGroup[] {
  const totals = productTotals(food, weekStart(day));
  return PRODUCT_SECTIONS.map(({ id }) => ({
    section: id,
    title: sectionTitle(id),
    rows: Object.keys(totals)
      .filter((p) => (productOf(food, p)?.section ?? 'other') === id)
      .map((p) => formatProductRow(food, p, totals[p]))
      .sort((a, b) => a.name.localeCompare(b.name, getLang())),
  })).filter((g) => g.rows.length > 0);
}

// Напоминание про лосось — накануне дня, где в меню лосось.
export function salmonTomorrow(food: FoodData, day: string): boolean {
  return mealsFor(food, shiftDay(day, 1)).some((m) => m.dishes.includes('salmon_rice'));
}

// ---- Время приёмов ----

// «07:00» → «~7:00»
export const formatMealTime = (time: string) => `~${Number(time.slice(0, 2))}:${time.slice(3)}`;

// Ближайший неотмеченный приём: самый ранний, чьё время не раньше чем час назад;
// если все такие уже прошли — последний по времени неотмеченный. Все отмечены — undefined.
export const NEXT_GRACE_MIN = 60;

export function nextMeal(food: FoodData, day: string, nowMin: number): Meal | undefined {
  const open = mealsFor(food, day)
    .filter((m) => !isEaten(food, day, m.slot))
    .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
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

// 3320 → «3 320» (ru/uk) / «3,320» (en)
export const formatNum = (n: number) => formatNumber(Math.round(n), 0);

// ---- Импорт и перенос старых данных: берём только корректные записи ----

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isDay = (k: string) => /^\d{4}-\d{2}-\d{2}$/.test(k);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const SECTIONS = new Set(PRODUCT_SECTIONS.map((s) => s.id));

// Переименованные и удалённые блюда (SPEC_v3_1): старые записи переносятся.
const RENAMED: Record<string, DishId> = { chicken_sandwich: 'meat_sandwich', rotisserie_rice: 'chicken_rice' };

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

function products(v: unknown): Record<string, Product> {
  const out: Record<string, Product> = {};
  if (!isObj(v)) return out;
  for (const [id, p] of Object.entries(v)) {
    if (isStdProduct(id) || !isObj(p) || !isStr(p.name) || !SECTIONS.has(p.section as ProductSection)) continue;
    const product: Product = { name: p.name.trim(), section: p.section as ProductSection };
    if (isObj(p.piece) && isNum(p.piece.g) && p.piece.g > 0 && isStr(p.piece.unit)) product.piece = { g: p.piece.g, unit: p.piece.unit };
    out[id] = product;
  }
  return out;
}

function dish(id: string, v: unknown, known: (product: string) => boolean): Dish | undefined {
  if (!isObj(v) || !isStr(v.name) || !isNum(v.kcal) || !isNum(v.protein) || !Array.isArray(v.items)) return undefined;
  const items: DishItem[] = v.items
    .filter((i): i is Record<string, unknown> => isObj(i) && typeof i.product === 'string' && known(i.product) && isNum(i.g) && i.g > 0)
    .map((i) => clean({ product: i.product as string, g: i.g as number, count: isNum(i.count) && i.count > 0 ? i.count : undefined }));
  const strs = (x: unknown) => (Array.isArray(x) && x.every((s) => typeof s === 'string') ? (x as string[]) : undefined);
  const out: Dish = clean({
    id,
    name: v.name.trim(),
    items,
    kcal: v.kcal,
    protein: v.protein,
    ingredients: strs(v.ingredients),
    steps: strs(v.steps),
    salad: v.salad === true || undefined,
    note: isStr(v.note) ? v.note : undefined,
    std: isStdDish(id) && v.std === id ? id : undefined,
  });
  return out;
}

function schedule(v: unknown, dishes: Record<DishId, Dish>): MealSlot[][] | undefined {
  if (!Array.isArray(v) || v.length !== 7) return undefined;
  return v.map((day) => {
    if (!Array.isArray(day)) return [];
    const seen = new Set<string>();
    const slots: MealSlot[] = [];
    for (const s of day) {
      if (!isObj(s) || !isStr(s.id) || seen.has(s.id) || typeof s.title !== 'string' || !isTime(s.time) || !Array.isArray(s.dishes)) continue;
      seen.add(s.id);
      slots.push({ id: s.id, title: s.title, time: s.time, dishes: s.dishes.filter((x): x is string => typeof x === 'string' && x in dishes) });
    }
    return slots;
  });
}

// Старое «своё время» по типу дня (до SPEC_v3_3) переносится в дни этого типа.
function legacyTimes(sched: MealSlot[][], raw: unknown): MealSlot[][] {
  if (!isObj(raw)) return sched;
  const map = (v: unknown) => (isObj(v) ? Object.fromEntries(Object.entries(v).filter(([, t]) => isTime(t))) : {}) as Record<string, string>;
  const gym = map(raw.gym);
  const rest = map(raw.rest);
  return sched.map((slots, w) => {
    const times = GYM_WEEKDAYS.includes(w) ? gym : rest;
    return slots.map((s) => (times[s.id] ? { ...s, time: times[s.id] } : s));
  });
}

export function sanitizeFood(raw: unknown): FoodData {
  const food = defaultFood();
  if (!isObj(raw)) return food;
  food.products = products(raw.products);
  const known = (p: string) => isStdProduct(p) || p in food.products;
  if (isObj(raw.dishes)) {
    food.dishes = {};
    for (const [id, v] of Object.entries(raw.dishes)) {
      const d = dish(id, v, known);
      if (d) food.dishes[id] = d;
    }
  }
  food.schedule = schedule(raw.schedule, food.dishes) ?? legacyTimes(food.schedule, raw.times);

  const isDish = (v: unknown): v is DishId => typeof v === 'string' && v in food.dishes;
  const dishOfOld = (v: unknown): DishId | undefined =>
    typeof v !== 'string' ? undefined : isDish(v) ? v : RENAMED[v] && isDish(RENAMED[v]) ? RENAMED[v] : undefined;

  food.eaten = strLists(raw.eaten);
  if (isObj(raw.swaps)) {
    for (const [k, map] of Object.entries(raw.swaps)) {
      if (!isDay(k) || !isObj(map)) continue;
      const out: Record<string, DishId> = {};
      for (const [slot, d] of Object.entries(map)) {
        const id = dishOfOld(d);
        if (id) out[slot] = id;
      }
      if (Object.keys(out).length > 0) food.swaps[k] = out;
    }
  }
  if (isObj(raw.photos)) {
    // Своё фото курицы-гриль не переносится: блюда больше нет.
    for (const [k, uri] of Object.entries(raw.photos)) {
      const id = k === 'rotisserie_rice' ? undefined : dishOfOld(k);
      if (id && typeof uri === 'string' && (k === id || food.photos[id] == null)) food.photos[id] = uri;
    }
  }
  if (isObj(raw.recipes)) {
    for (const [k, text] of Object.entries(raw.recipes)) {
      const id = dishOfOld(k);
      if (id && typeof text === 'string' && text.trim() && (k === id || food.recipes[id] == null)) food.recipes[id] = text.trim();
    }
  }
  return food;
}
