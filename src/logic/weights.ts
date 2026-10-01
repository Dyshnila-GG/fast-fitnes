import type { Kind, Units } from '../types';
import { kgToLb, lbToKg, roundTo } from './units';

// Шаг весов (SPEC_v3_3 §D3). Имперские: тренажёр / Смит / блок — 5 lb; гантели — 5 lb, для гантелей ≤ 15 lb — 2.5 lb.
// Метрические: тренажёры и Смит — 2.5 kg, гантели — 2 kg. Вес всегда хранится в lb.
const KG_STEP: Record<Kind, number> = { machine: 2.5, free: 2 };

// Шаг в выбранных единицах (lb или kg).
export function unitStep(weightLb: number, kind: Kind, units: Units = 'imperial'): number {
  if (units === 'metric') return KG_STEP[kind];
  return kind === 'free' && weightLb <= 15 ? 2.5 : 5;
}

// Шаг в lb (для имперских — как раньше).
export function weightStep(weight: number, kind: Kind, units: Units = 'imperial'): number {
  const step = unitStep(weight, kind, units);
  return units === 'metric' ? kgToLb(step) : step;
}

// Округление до шага в выбранных единицах; результат — в lb.
export function roundWeight(weight: number, kind: Kind, units: Units = 'imperial'): number {
  if (units === 'metric') return kgToLb(Math.max(0, roundTo(lbToKg(weight), KG_STEP[kind])));
  const step = unitStep(weight, kind, units);
  return Math.max(0, Math.round(weight / step) * step);
}

// Вес ± n шагов в выбранных единицах (метрические — от округлённого до шага значения); результат — в lb.
export function addWeight(weight: number, kind: Kind, delta: number, units: Units = 'imperial'): number {
  if (units === 'metric') return kgToLb(roundTo(lbToKg(weight), KG_STEP[kind]) + delta);
  return weight + delta;
}

// Допуск сравнения факта с рекордом: в метрических вес показан с точностью 0.5 kg.
export const weightTolerance = (units: Units = 'imperial') => (units === 'metric' ? kgToLb(0.25) : 0);
