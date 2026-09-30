import type { AppData, Best, ExerciseLog, Feel, Kind, SetLog, Variant } from '../types';
import { roundWeight, weightStep } from './weights';

// Подбор веса по самочувствию (SPEC_v2 §2). Рекорд хранится по названию варианта.

const FEEL_DELTA: Record<Feel, number> = { easy: 5, normal: 0, hard: -10 };
const FEEL_DELTA_DUMBBELL: Record<Feel, number> = { easy: 5, normal: 0, hard: -5 };
const PLANK_STEP = 5;

const minWeight = (kind: Kind) => (kind === 'free' ? 2.5 : 5);

// Стартовый рекорд из программы: только поля, которые относятся к режиму варианта.
export function startBest(variant: Variant): Best {
  const p = variant.plan;
  if (variant.mode === 'weight') return { weight: p.weight };
  if (variant.mode === 'time') return { seconds: p.seconds };
  return { reps: p.reps, repsMax: p.repsMax };
}

export function getBest(data: AppData, variant: Variant): Best {
  return { ...startBest(variant), ...data.records[variant.name] };
}

// Верх диапазона повторов: для своего веса — из рекорда, для остальных — из программы.
export function topReps(variant: Variant, best: Best): number | undefined {
  if (variant.mode === 'bodyweight') return best.repsMax ?? best.reps;
  return variant.plan.repsMax ?? variant.plan.reps;
}

// Разминочные подходы от рекорда (§2.1).
export function warmupSets(variant: Variant, best: Best): SetLog[] {
  return variant.warmup.map((w) => ({
    type: 'warmup',
    planWeight: w.pct > 0 && best.weight ? roundWeight(best.weight * w.pct, variant.kind) : undefined,
    planReps: w.reps,
    planSeconds: w.seconds,
    done: false,
  }));
}

// Вес «сегодня» по ответу после разминки (§2.2). Без ответа — рекорд.
export function todayWeight(record: number, feel: Feel | undefined, kind: Kind): number {
  if (!feel) return record;
  const delta = (kind === 'free' ? FEEL_DELTA_DUMBBELL : FEEL_DELTA)[feel];
  return delta < 0 ? Math.max(minWeight(kind), record + delta) : record + delta;
}

// Свой вес: цель повторов по ответу (Легко — верх, Нормально — середина, Тяжело — низ).
export function bodyweightTarget(best: Best, feel: Feel): number | undefined {
  const lo = best.reps;
  const hi = best.repsMax ?? lo;
  if (lo == null || hi == null) return lo;
  if (feel === 'easy') return hi;
  if (feel === 'hard') return lo;
  return Math.round((lo + hi) / 2);
}

// Нужен ли вопрос «Как пошла разминка?» — на планку он не влияет.
export function needsFeel(variant: Variant): boolean {
  return variant.mode !== 'time';
}

// План рабочего подхода: вес «сегодня» × диапазон, цель повторов своего веса или секунды.
export function workSet(variant: Variant, best: Best, feel?: Feel, weight?: number): SetLog {
  if (variant.mode === 'time') return { type: 'work', planSeconds: best.seconds, done: false };
  if (variant.mode === 'bodyweight') {
    const target = feel ? bodyweightTarget(best, feel) : undefined;
    return target != null
      ? { type: 'work', planReps: target, done: false }
      : { type: 'work', planReps: best.reps, planRepsMax: best.repsMax, done: false };
  }
  return {
    type: 'work',
    planWeight: weight ?? (best.weight != null ? todayWeight(best.weight, feel, variant.kind) : undefined),
    planReps: variant.plan.reps,
    planRepsMax: variant.plan.repsMax,
    done: false,
  };
}

// Пересчитать план всех рабочих подходов (факт не трогаем).
function replanWork(log: ExerciseLog, variant: Variant): ExerciseLog {
  const best = log.record ?? startBest(variant);
  const plan = workSet(variant, best, log.feel, log.todayWeight);
  return {
    ...log,
    sets: log.sets.map((s) =>
      s.type === 'work'
        ? { ...s, planWeight: plan.planWeight, planReps: plan.planReps, planRepsMax: plan.planRepsMax, planSeconds: plan.planSeconds }
        : s,
    ),
  };
}

export function applyFeel(log: ExerciseLog, variant: Variant, feel: Feel): ExerciseLog {
  const record = log.record?.weight;
  const today = variant.mode === 'weight' && record != null ? todayWeight(record, feel, variant.kind) : undefined;
  return replanWork({ ...log, feel, todayWeight: today }, variant);
}

// Ручная правка веса «сегодня» — меняет план всех рабочих подходов.
export function setTodayWeight(log: ExerciseLog, variant: Variant, weight: number): ExerciseLog {
  return replanWork({ ...log, todayWeight: weight }, variant);
}

// Рост рекорда после тренировки (§2.4). Автоматически рекорд никогда не снижается.
export function grow(best: Best, log: ExerciseLog, variant: Variant): Best {
  const work = log.sets.filter((s) => s.type === 'work');
  if (work.length === 0) return best;
  if (variant.mode === 'time') {
    if (best.seconds == null || !work.every((s) => (s.factSeconds ?? 0) >= best.seconds!)) return best;
    return { ...best, seconds: best.seconds + PLANK_STEP };
  }
  const top = topReps(variant, best);
  if (top == null || !work.every((s) => (s.factReps ?? 0) >= top)) return best;
  if (variant.mode === 'bodyweight') {
    return { ...best, reps: best.reps != null ? best.reps + 1 : best.reps, repsMax: best.repsMax != null ? best.repsMax + 1 : best.repsMax };
  }
  const record = best.weight;
  if (record == null || !work.every((s) => (s.factWeight ?? 0) >= record)) return best;
  return { ...best, weight: record + weightStep(record, variant.kind) };
}

// Ручная правка рекорда. Для своего веса диапазон сдвигается целиком.
export function setBest(d: AppData, variant: Variant, patch: Best): AppData {
  const best = getBest(d, variant);
  let next: Best = { ...best, ...patch };
  if (variant.mode === 'bodyweight' && patch.reps != null && best.reps != null && best.repsMax != null) {
    next = { ...next, repsMax: patch.reps + (best.repsMax - best.reps) };
  }
  return { ...d, records: { ...d.records, [variant.name]: next } };
}
