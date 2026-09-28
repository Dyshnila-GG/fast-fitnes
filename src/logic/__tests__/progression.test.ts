import { describe, expect, it } from '@jest/globals';
import { getExercise, getVariant } from '../../data/program';
import type { ExerciseLog, Kind, Plan, Rating, SetLog } from '../../types';
import { baseWeight, nextPlan, nextWeight, sessionPlan, stepDown, stepUp, tonnage } from '../progression';
import { buildSets } from '../session';

const work = (patch: Partial<SetLog> = {}): SetLog => ({ type: 'work', done: true, ...patch });
const log = (rating: Rating | undefined, sets: SetLog[] = [], variant: Kind = 'machine'): ExerciseLog => ({
  exerciseId: 'A1',
  variant,
  sets,
  rating,
});

// Прогрессия упражнения из программы по оценке, без факта веса (база — план).
function next(exerciseId: string, kind: Kind, rating: Rating | undefined, plan?: Plan, sets: SetLog[] = []): Plan {
  const ex = getExercise(exerciseId);
  const variant = getVariant(ex, kind);
  return nextPlan(ex, variant, plan ?? variant.plan, { exerciseId, variant: kind, sets, rating });
}

describe('шаг сетки весов', () => {
  it('вверх: тренажёр 5 lb, гантели <15 — 2.5, от 15 — 5', () => {
    expect(stepUp(40, 'machine')).toBe(45);
    expect(stepUp(77, 'machine')).toBe(80);
    expect(stepUp(10, 'free')).toBe(12.5);
    expect(stepUp(12.5, 'free')).toBe(15);
    expect(stepUp(15, 'free')).toBe(20);
  });

  it('вниз: гантели ≤15 — 2.5, остальное — 5, не ниже одного шага', () => {
    expect(stepDown(10, 'machine')).toBe(5);
    expect(stepDown(5, 'machine')).toBe(5);
    expect(stepDown(15, 'free')).toBe(12.5);
    expect(stepDown(10, 'free')).toBe(7.5);
    expect(stepDown(20, 'free')).toBe(15);
    expect(stepDown(2.5, 'free')).toBe(2.5);
  });
});

describe('вес: таблица раздела 5', () => {
  it('Легко +10%, Нормально +5%, Еле-еле без изменений, Не смог −10%', () => {
    expect(nextWeight(100, 'easy', 'machine')).toBe(110);
    expect(nextWeight(100, 'normal', 'machine')).toBe(105);
    expect(nextWeight(100, 'hard', 'machine')).toBe(100);
    expect(nextWeight(100, 'fail', 'machine')).toBe(90);
  });

  it('округление до 5 lb (тренажёр) и 2.5 lb (гантели ≤15)', () => {
    expect(nextWeight(75, 'normal', 'machine')).toBe(80); // 78.75 → 80
    expect(nextWeight(75, 'easy', 'machine')).toBe(85); // 82.5 → 85
    expect(nextWeight(90, 'normal', 'machine')).toBe(95); // 94.5 → 95
    expect(nextWeight(12.5, 'easy', 'free')).toBe(15); // 13.75 → 15 (шаг 2.5)
    expect(nextWeight(30, 'easy', 'free')).toBe(35); // 33 → 35 (шаг 5)
  });

  it('Легко/Нормально: если после округления не выросло — +1 шаг', () => {
    expect(nextWeight(40, 'normal', 'machine')).toBe(45); // 42 → 40 → 45
    expect(nextWeight(10, 'normal', 'free')).toBe(12.5); // 10.5 → 10 → 12.5
    expect(nextWeight(15, 'easy', 'free')).toBe(20); // 16.5 → 15 → 20
  });

  it('Не смог: вес всегда снижается минимум на шаг', () => {
    expect(nextWeight(10, 'fail', 'free')).toBe(7.5); // 9 → 10 → 7.5
    expect(nextWeight(15, 'fail', 'free')).toBe(12.5); // 13.5 → 12.5
    expect(nextWeight(10, 'fail', 'machine')).toBe(5); // 9 → 10 → 5
    expect(nextWeight(25, 'fail', 'free')).toBe(20); // 22.5 → 20
    expect(nextWeight(5, 'fail', 'machine')).toBe(5); // не ниже одного шага
  });

  it('ноги: максимум +5% за раз, но минимум +1 шаг', () => {
    expect(nextWeight(110, 'easy', 'machine', true)).toBe(115); // 115.5 → 115, а не 121
    expect(nextWeight(110, 'normal', 'machine', true)).toBe(115);
    expect(nextWeight(40, 'easy', 'machine', true)).toBe(45); // 42 → 40 → 45
    expect(nextWeight(110, 'fail', 'machine', true)).toBe(100); // 99 → 100
  });
});

describe('база — факт последнего рабочего подхода', () => {
  const plan: Plan = { sets: 3, reps: 10, weight: 75 };

  it('берёт факт последнего заполненного рабочего подхода', () => {
    const sets = [
      { type: 'warmup', factWeight: 40, factReps: 12, done: true } as SetLog,
      work({ factWeight: 75, factReps: 10 }),
      work({ factWeight: 80, factReps: 10 }),
      work({ done: false }),
    ];
    expect(baseWeight(log('easy', sets), plan)).toBe(80);
  });

  it('без факта — вес плана', () => {
    expect(baseWeight(log('easy', [work({ done: false })]), plan)).toBe(75);
  });

  it('прогрессия считается от факта', () => {
    const p = next('A1', 'machine', 'normal', { sets: 4, reps: 8, weight: 75 }, [work({ factWeight: 90, factReps: 8 })]);
    expect(p).toEqual({ sets: 4, reps: 8, weight: 95 });
  });
});

describe('nextPlan по режимам', () => {
  it('без оценки план не меняется', () => {
    const plan = getVariant(getExercise('A1'), 'machine').plan;
    expect(next('A1', 'machine', undefined)).toBe(plan);
  });

  it('вес: меняется только вес, подходы и повторы сохраняются', () => {
    expect(next('A1', 'machine', 'easy')).toEqual({ sets: 4, reps: 8, weight: 85 }); // 75 → 82.5 → 85
    expect(next('A1', 'free', 'fail')).toEqual({ sets: 4, reps: 8, weight: 25 }); // 30 → 27 → 25
  });

  it('варианты считаются отдельно (тренажёр / свободный вес)', () => {
    expect(next('A5', 'machine', 'normal').weight).toBe(55); // 50 → 52.5 → 55
    expect(next('A5', 'free', 'normal').weight).toBe(20); // 15 → 15.75 → 15 → следующий шаг 20
  });

  it('ноги из программы: жим ногами 110 «Легко» → 115', () => {
    expect(next('A2', 'machine', 'easy').weight).toBe(115);
    expect(next('B6', 'machine', 'easy').weight).toBe(45); // разгибание ног 40
  });

  it('свой вес: повторы +2 / +1 / 0 / −1', () => {
    expect(next('A3', 'free', 'easy').reps).toBe(10);
    expect(next('A3', 'free', 'normal').reps).toBe(9);
    expect(next('A3', 'free', 'hard').reps).toBe(8);
    expect(next('A3', 'free', 'fail').reps).toBe(7);
    expect(next('A3', 'free', 'fail', { sets: 3, reps: 1 }).reps).toBe(1);
  });

  it('свой вес: диапазон 8–10 сдвигается целиком, вес не появляется', () => {
    expect(next('B4', 'free', 'easy')).toEqual({ sets: 3, reps: 10, repsMax: 12 });
    expect(next('B4', 'free', 'fail')).toEqual({ sets: 3, reps: 7, repsMax: 9 });
  });

  it('на время: Легко +10 сек, Нормально +5 сек, иначе без изменений', () => {
    expect(next('A7', 'free', 'easy').seconds).toBe(50);
    expect(next('A7', 'free', 'normal').seconds).toBe(45);
    expect(next('A7', 'free', 'hard').seconds).toBe(40);
    expect(next('A7', 'free', 'fail').seconds).toBe(40);
  });
});

describe('разминка от нового рабочего веса', () => {
  it('основные: 50% × 12 и 75% × 6 с округлением', () => {
    const v = getVariant(getExercise('A1'), 'machine');
    const plan = next('A1', 'machine', 'easy'); // 85
    const warm = buildSets(v, plan, 'long').filter((s) => s.type === 'warmup');
    expect(warm.map((s) => [s.planWeight, s.planReps])).toEqual([
      [45, 12], // 42.5 → 45
      [65, 6], // 63.75 → 65
    ]);
  });

  it('второстепенные: только 50% × 12, гантели ≤15 — шаг 2.5', () => {
    const v = getVariant(getExercise('B7'), 'free'); // махи 10 lb
    const plan = next('B7', 'free', 'easy'); // 11 → 10 → 12.5
    expect(plan.weight).toBe(12.5);
    const warm = buildSets(v, plan, 'long').filter((s) => s.type === 'warmup');
    expect(warm.map((s) => [s.planWeight, s.planReps])).toEqual([[7.5, 12]]); // 6.25 → 7.5
  });
});

describe('итог', () => {
  it('tonnage — Σ вес × повторы по всем подходам с весом', () => {
    const s = {
      id: 's',
      templateId: 'A' as const,
      length: 'long' as const,
      startedAt: '2026-01-01T10:00:00.000Z',
      pausedMs: 0,
      warmupDone: [],
      exercises: [
        log('easy', [
          { type: 'warmup', factWeight: 40, factReps: 12, done: true },
          work({ factWeight: 80, factReps: 8 }),
          work({ factReps: 8 }), // без веса — не считается
        ]),
        log('normal', [work({ factSeconds: 40 })]),
      ],
    };
    expect(tonnage(s)).toBe(40 * 12 + 80 * 8);
  });

  it('sessionPlan — план из первого рабочего подхода', () => {
    const v = getVariant(getExercise('B4'), 'free');
    const sets = buildSets(v, v.plan, 'long');
    expect(sessionPlan(log('easy', sets, 'free'))).toEqual({ sets: 3, weight: undefined, reps: 8, repsMax: 10, seconds: undefined });
  });
});
