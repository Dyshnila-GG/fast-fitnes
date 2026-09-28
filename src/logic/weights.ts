import type { Kind } from '../types';

// Шаг: тренажёр / Смит / блок — 5 lb; гантели — 5 lb, для гантелей ≤ 15 lb — 2.5 lb.
export function weightStep(weight: number, kind: Kind): number {
  return kind === 'free' && weight <= 15 ? 2.5 : 5;
}

export function roundWeight(weight: number, kind: Kind): number {
  const step = weightStep(weight, kind);
  return Math.max(0, Math.round(weight / step) * step);
}
