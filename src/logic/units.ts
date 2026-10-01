import { t } from '../i18n';
import type { Units } from '../types';

// Единицы (SPEC_v3_3 §D3). Хранение всегда одинаковое: lb, дюймы, мили, °F в текстах рецептов.
// Переключатель меняет только показ и ввод — туда-обратно данные не портятся.

export const LB_PER_KG = 2.20462262;
export const CM_PER_IN = 2.54;
export const KM_PER_MI = 1.609344;

// Текущие единицы показа (ставит AppStore при каждом рендере по настройкам).
let current: Units = 'imperial';
export const setUnits = (u: Units) => {
  current = u;
};
export const getUnits = () => current;

export const lbToKg = (lb: number) => lb / LB_PER_KG;
export const kgToLb = (kg: number) => kg * LB_PER_KG;
export const inToCm = (inches: number) => inches * CM_PER_IN;
export const cmToIn = (cm: number) => cm / CM_PER_IN;
export const miToKm = (mi: number) => mi * KM_PER_MI;
export const kmToMi = (km: number) => km / KM_PER_MI;
export const fToC = (f: number) => ((f - 32) * 5) / 9;

export const roundTo = (x: number, step: number) => Math.round(x / step) * step;
const round1 = (x: number) => Math.round(x * 10) / 10;
const round2 = (x: number) => Math.round(x * 100) / 100;

// ---- Вес (тело и тренировки): lb ↔ kg, kg — с точностью 0.5 ----

// Подпись единицы — по языку: «кг» (ru/uk) / «kg» (en); lb, in, mi — латиницей во всех языках.
export const weightUnit = (units: Units = current) => t(units === 'metric' ? 'unit.kg' : 'unit.lb');

// Число для показа в выбранных единицах.
export function weightValue(lb: number, units: Units = current): number {
  return units === 'metric' ? roundTo(lbToKg(lb), 0.5) : round1(lb);
}

// Ввод в выбранных единицах → lb для хранения.
export function weightToLb(value: number, units: Units = current): number {
  return units === 'metric' ? kgToLb(value) : value;
}

// ---- Рост: ft + in ↔ cm; замеры: in ↔ cm ----

export function heightCm(inches: number): number {
  return Math.round(inToCm(inches));
}

export function feetInches(inches: number): { ft: number; inch: number } {
  const total = round1(inches);
  const ft = Math.floor(total / 12);
  return { ft, inch: round1(total - ft * 12) };
}

export function lengthValue(inches: number, units: Units = current): number {
  return units === 'metric' ? roundTo(inToCm(inches), 0.5) : round1(inches);
}

export const lengthUnit = (units: Units = current) => t(units === 'metric' ? 'unit.cm' : 'unit.in');

export function lengthToIn(value: number, units: Units = current): number {
  return units === 'metric' ? cmToIn(value) : value;
}

// ---- Пробежка: mi ↔ km, темп мин/mi ↔ мин/km ----

export const distanceUnit = (units: Units = current) => t(units === 'metric' ? 'unit.km' : 'unit.mi');

export function distanceValue(mi: number, units: Units = current): number {
  return units === 'metric' ? round2(miToKm(mi)) : round2(mi);
}

export function distanceToMi(value: number, units: Units = current): number {
  return units === 'metric' ? kmToMi(value) : value;
}

// Темп хранится как мин/mi; показ — мин/km в метрических.
export function paceValue(minPerMi: number, units: Units = current): number {
  return units === 'metric' ? minPerMi / KM_PER_MI : minPerMi;
}

// ---- Температура духовки в тексте рецепта: «400°F» → «205°C» (округление до 5) ----

export function convertTemps(text: string, units: Units = current): string {
  if (units !== 'metric') return text;
  return text.replace(/(\d+(?:[.,]\d+)?)\s*°\s*F\b/g, (_, f: string) => `${roundTo(fToC(Number(f.replace(',', '.'))), 5)}°C`);
}
