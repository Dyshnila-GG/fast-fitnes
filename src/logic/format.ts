import type { Plan, Variant } from '../types';

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatRest(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export function formatReps(variant: Variant, plan: Plan): string {
  if (variant.mode === 'time') return `${plan.seconds ?? 0} сек`;
  const reps = plan.repsMax ? `${plan.reps}–${plan.repsMax}` : `${plan.reps ?? 0}`;
  return variant.perLeg ? `${reps} на ногу` : reps;
}

// «4 × 8 · 75 lb», «3 × 8–10 · свой вес», «3 × 40 сек»
export function formatPlan(variant: Variant, plan: Plan): string {
  const base = `${plan.sets} × ${formatReps(variant, plan)}`;
  if (variant.mode === 'bodyweight') return `${base} · свой вес`;
  if (variant.mode === 'weight') return plan.weight != null ? `${base} · ${plan.weight} lb` : base;
  return base;
}
