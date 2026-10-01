import { isStdProduct, type Dish, type Product, type ProductSection } from '../data/food';
import { LEGACY_PROGRAM } from '../data/legacy';
import { PROGRAM } from '../data/program';
import type { Exercise, Variant, WorkoutTemplate } from '../types';
import { t, tk, type Key } from './index';

// Стандартный контент (SPEC_v3_3 §D2): упражнения, тренировки, стандартные блюда, продукты — переводятся.
// Свой контент пользователя (свои и изменённые блюда, свои продукты, заметки, названия приёмов) — нет.

export const templateTitle = (tpl: WorkoutTemplate) => tk(`tpl.${tpl.id}.title`, tpl.title);
// «Вт — Грудь и плечи» → «Грудь и плечи»
export const templateName = (tpl: WorkoutTemplate) => templateTitle(tpl).replace(/^[^—]+—\s*/, '');

export const exerciseTitle = (ex: Exercise) => tk(`ex.${ex.id}.title`, ex.title);
export const exerciseMuscles = (ex: Exercise) => tk(`ex.${ex.id}.muscles`, ex.muscles);

export const variantName = (v: Variant) => tk(`var.${v.gifId}.name`, v.name);
export const variantEquipment = (v: Variant) => tk(`var.${v.gifId}.equipment`, v.equipment);
// У упражнений на ноги к подсказке добавляется общее правило для коленей.
export function variantCue(ex: Exercise, v: Variant): string {
  const own = tk(`var.${v.gifId}.cue`, '');
  if (!own) return v.cue;
  return ex.legs ? `${own} ${t('ex.legsCue')}` : own;
}

export const sectionTitle = (id: ProductSection) => t(`section.${id}` as Key);

export function productName(id: string, p: Product | undefined): string {
  if (isStdProduct(id)) return t(`product.${id}` as Key);
  return p?.name ?? id;
}

const UNIT_KEYS: Record<string, Key> = { 'шт.': 'unit.pcs', 'кус.': 'unit.slice' };
export const pieceUnit = (unit: string) => (UNIT_KEYS[unit] ? t(UNIT_KEYS[unit]) : unit);

// Стандартные названия приёмов из стартового расписания — по словарю; свои названия — как сохранены.
const MEAL_TITLE_KEYS: Record<string, Key> = {
  'До зала': 'mealName.pre',
  'После зала': 'mealName.post',
  Завтрак: 'mealName.breakfast',
  Обед: 'mealName.lunch',
  Перекус: 'mealName.snack',
  Ужин: 'mealName.dinner',
};
export const mealTitle = (title: string) => (MEAL_TITLE_KEYS[title] ? t(MEAL_TITLE_KEYS[title]) : title);

// Стандартное (не изменённое) блюдо — по словарю, остальные — как сохранены.
export const dishName = (d: Dish) => (d.std ? tk(`dish.${d.std}.name`, d.name) : d.name);
export const dishNote = (d: Dish) => (d.note && d.std ? tk(`dish.${d.std}.note`, d.note) : d.note);
export const dishSteps = (d: Dish) => (d.steps && d.std ? d.steps.map((s, i) => tk(`dish.${d.std}.step.${i}`, s)) : d.steps);
export const dishIngredientTexts = (d: Dish) =>
  d.ingredients && d.std ? d.ingredients.map((s, i) => tk(`dish.${d.std}.ing.${i}`, s)) : d.ingredients;

// Вариант по названию (рекорды и прогресс хранятся по русскому названию варианта).

let byName: Map<string, Variant> | null = null;
export function variantNameByKey(name: string): string {
  if (!byName) {
    byName = new Map();
    for (const tpl of [...PROGRAM, ...LEGACY_PROGRAM]) for (const e of tpl.exercises) for (const v of e.variants) byName.set(v.name, v);
  }
  const v = byName.get(name);
  return v ? variantName(v) : name;
}
