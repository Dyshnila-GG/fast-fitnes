import type { Exercise, ExerciseLog, Kind, Plan, Rating, Session, Variant } from '../types';
import { roundWeight } from './weights';

// Прогрессия по разделу 5 SPEC: следующий план по оценке последнего рабочего подхода.

const WEIGHT_PCT: Record<Rating, number> = { easy: 0.1, normal: 0.05, hard: 0, fail: -0.1 };
const LEGS_MAX_PCT = 0.05;
const REPS_DELTA: Record<Rating, number> = { easy: 2, normal: 1, hard: 0, fail: -1 };
const SECONDS_DELTA: Record<Rating, number> = { easy: 10, normal: 5, hard: 0, fail: 0 };

const EPS = 1e-9;
const minWeight = (kind: Kind) => (kind === 'free' ? 2.5 : 5);

// Ближайший вес на сетке выше w: гантели < 15 lb — шаг 2.5, остальное — 5 lb.
export function stepUp(w: number, kind: Kind): number {
  const step = kind === 'free' && w < 15 ? 2.5 : 5;
  return (Math.floor(w / step + EPS) + 1) * step;
}

// Ближайший вес на сетке ниже w: гантели ≤ 15 lb — шаг 2.5, остальное — 5 lb. Не ниже одного шага.
export function stepDown(w: number, kind: Kind): number {
  const step = kind === 'free' && w <= 15 ? 2.5 : 5;
  return Math.max(minWeight(kind), (Math.ceil(w / step - EPS) - 1) * step);
}

// База — факт веса последнего заполненного рабочего подхода, иначе вес плана.
export function baseWeight(log: ExerciseLog, plan: Plan): number | undefined {
  const facts = log.sets.filter((s) => s.type === 'work' && s.factWeight != null && s.factWeight > 0);
  return facts.length > 0 ? facts[facts.length - 1].factWeight : plan.weight;
}

export function nextWeight(base: number, rating: Rating, kind: Kind, legs = false): number {
  const pct = legs ? Math.min(WEIGHT_PCT[rating], LEGS_MAX_PCT) : WEIGHT_PCT[rating];
  if (pct === 0) return base;
  const rounded = roundWeight(base * (1 + pct), kind);
  // Округление «съело» изменение — один минимальный шаг в нужную сторону.
  if (pct > 0) return rounded > base ? rounded : stepUp(base, kind);
  return rounded < base ? Math.max(rounded, minWeight(kind)) : stepDown(base, kind);
}

export function nextPlan(exercise: Exercise, variant: Variant, plan: Plan, log: ExerciseLog): Plan {
  const rating = log.rating;
  if (!rating) return plan;
  if (variant.mode === 'weight') {
    const base = baseWeight(log, plan);
    return base == null ? plan : { ...plan, weight: nextWeight(base, rating, variant.kind, exercise.legs) };
  }
  if (variant.mode === 'bodyweight') {
    const d = REPS_DELTA[rating];
    if (d === 0 || plan.reps == null) return plan;
    const next: Plan = { ...plan, reps: Math.max(1, plan.reps + d) };
    if (plan.repsMax != null) next.repsMax = Math.max(1, plan.repsMax + d);
    return next;
  }
  const d = SECONDS_DELTA[rating];
  return d === 0 || plan.seconds == null ? plan : { ...plan, seconds: plan.seconds + d };
}

// Суммарный тоннаж: Σ факт веса × факт повторов по всем подходам с весом.
export function tonnage(s: Session): number {
  let total = 0;
  for (const log of s.exercises) {
    for (const set of log.sets) {
      if (set.factWeight && set.factReps) total += set.factWeight * set.factReps;
    }
  }
  return Math.round(total * 10) / 10;
}

// План, по которому шло упражнение в этой тренировке (из первого рабочего подхода).
export function sessionPlan(log: ExerciseLog): Plan {
  const work = log.sets.filter((s) => s.type === 'work');
  const first = work[0];
  return {
    sets: work.length,
    weight: first?.planWeight,
    reps: first?.planReps,
    repsMax: first?.planRepsMax,
    seconds: first?.planSeconds,
  };
}
