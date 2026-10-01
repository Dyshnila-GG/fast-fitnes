import type { AppData, Best, ExerciseLog, Feel, Kind, SetLog, Units, Variant } from '../types';
import { kgToLb } from './units';
import { addWeight, roundWeight, unitStep, weightTolerance } from './weights';

// Подбор веса по самочувствию (SPEC_v2 §2). Рекорд хранится по названию варианта.

// Вес «сегодня» по ответу: имперские — в lb, метрические — в kg (+5 lb ↔ +2.5 kg, −10 lb ↔ −5 kg; гантели — шаг 2 kg).
const FEEL_DELTA: Record<Units, Record<Kind, Record<Feel, number>>> = {
  imperial: { machine: { easy: 5, normal: 0, hard: -10 }, free: { easy: 5, normal: 0, hard: -5 } },
  metric: { machine: { easy: 2.5, normal: 0, hard: -5 }, free: { easy: 2, normal: 0, hard: -2 } },
};
const PLANK_STEP = 5;

// Минимальный вес «сегодня», lb.
const minWeight = (kind: Kind, units: Units) => (units === 'metric' ? kgToLb(kind === 'free' ? 2 : 2.5) : kind === 'free' ? 2.5 : 5);

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
export function warmupSets(variant: Variant, best: Best, units: Units = 'imperial'): SetLog[] {
  return variant.warmup.map((w) => ({
    type: 'warmup',
    planWeight: w.pct > 0 && best.weight ? roundWeight(best.weight * w.pct, variant.kind, units) : undefined,
    planReps: w.reps,
    planSeconds: w.seconds,
    done: false,
  }));
}

// Вес «сегодня» по ответу после разминки (§2.2). Без ответа — рекорд.
export function todayWeight(record: number, feel: Feel | undefined, kind: Kind, units: Units = 'imperial'): number {
  if (!feel || feel === 'normal') return record;
  const next = addWeight(record, kind, FEEL_DELTA[units][kind][feel], units);
  return feel === 'hard' ? Math.max(minWeight(kind, units), next) : next;
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
export function workSet(variant: Variant, best: Best, feel?: Feel, weight?: number, units: Units = 'imperial'): SetLog {
  if (variant.mode === 'time') return { type: 'work', planSeconds: best.seconds, done: false };
  if (variant.mode === 'bodyweight') {
    const target = feel ? bodyweightTarget(best, feel) : undefined;
    return target != null
      ? { type: 'work', planReps: target, done: false }
      : { type: 'work', planReps: best.reps, planRepsMax: best.repsMax, done: false };
  }
  return {
    type: 'work',
    planWeight: weight ?? (best.weight != null ? todayWeight(best.weight, feel, variant.kind, units) : undefined),
    planReps: variant.plan.reps,
    planRepsMax: variant.plan.repsMax,
    done: false,
  };
}

// Пересчитать план всех рабочих подходов (факт не трогаем).
function replanWork(log: ExerciseLog, variant: Variant, units: Units): ExerciseLog {
  const best = log.record ?? startBest(variant);
  const plan = workSet(variant, best, log.feel, log.todayWeight, units);
  return {
    ...log,
    sets: log.sets.map((s) =>
      s.type === 'work'
        ? { ...s, planWeight: plan.planWeight, planReps: plan.planReps, planRepsMax: plan.planRepsMax, planSeconds: plan.planSeconds }
        : s,
    ),
  };
}

export function applyFeel(log: ExerciseLog, variant: Variant, feel: Feel, units: Units = 'imperial'): ExerciseLog {
  const record = log.record?.weight;
  const today = variant.mode === 'weight' && record != null ? todayWeight(record, feel, variant.kind, units) : undefined;
  return replanWork({ ...log, feel, todayWeight: today }, variant, units);
}

// Ручная правка веса «сегодня» — меняет план всех рабочих подходов.
export function setTodayWeight(log: ExerciseLog, variant: Variant, weight: number, units: Units = 'imperial'): ExerciseLog {
  return replanWork({ ...log, todayWeight: weight }, variant, units);
}

// Рост рекорда после тренировки (SPEC §5.4) — только при оценке «Легко» или «Нормально».
// Автоматически рекорд никогда не снижается.
export function grow(best: Best, log: ExerciseLog, variant: Variant, units: Units = 'imperial'): Best {
  const work = log.sets.filter((s) => s.type === 'work');
  if (work.length === 0 || (log.rating !== 'easy' && log.rating !== 'normal')) return best;
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
  const tol = weightTolerance(units);
  if (record == null || !work.every((s) => (s.factWeight ?? 0) >= record - tol)) return best;
  return { ...best, weight: addWeight(record, variant.kind, unitStep(record, variant.kind, units), units) };
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
