import { describe, expect, it } from '@jest/globals';
import { getExercise, getVariant, PROGRAM } from '../../data/program';
import { defaultData } from '../../store/defaults';
import { migrateData, recordsFromLegacyPlans } from '../../store/migrate';
import type { Best, ExerciseLog, Kind, Rating, SetLog } from '../../types';
import { exerciseMeta, formatPreview, formatWarmup } from '../format';
import { applyFeel, bodyweightTarget, getBest, grow, setBest, setTodayWeight, todayWeight, warmupSets } from '../records';
import { buildExerciseLog, copyPlanToFact } from '../session';

const variant = (exerciseId: string, kind: Kind) => getVariant(getExercise(exerciseId), kind);
const work = (factWeight: number | undefined, factReps: number | undefined, factSeconds?: number): SetLog => ({
  type: 'work',
  factWeight,
  factReps,
  factSeconds,
  done: true,
});
const log = (exerciseId: string, kind: Kind, sets: SetLog[]): ExerciseLog => ({ exerciseId, variant: kind, sets });
// rating: null — без оценки.
const growOf = (exerciseId: string, kind: Kind, best: Best, sets: SetLog[], rating: Rating | null = 'normal') =>
  grow(best, { ...log(exerciseId, kind, sets), rating: rating ?? undefined }, variant(exerciseId, kind));

describe('программа v2', () => {
  it('3 тренировки: 6 + 7 + 7 упражнений, у каждого есть вариант по умолчанию', () => {
    expect(PROGRAM.map((t) => [t.id, t.title, t.exercises.length])).toEqual([
      ['tue', 'Вт — Грудь и плечи', 6],
      ['thu', 'Чт — Спина и руки', 7],
      ['sat', 'Сб — Ноги и верх', 7],
    ]);
    for (const e of PROGRAM.flatMap((t) => t.exercises)) {
      expect(e.variants.some((v) => v.kind === e.defaultVariant)).toBe(true);
    }
  });

  it('одно название варианта — одно движение и один режим', () => {
    const seen = new Map<string, string>();
    for (const v of PROGRAM.flatMap((t) => t.exercises.flatMap((e) => e.variants))) {
      expect(seen.get(v.name) ?? `${v.gifId}|${v.mode}`).toBe(`${v.gifId}|${v.mode}`);
      seen.set(v.name, `${v.gifId}|${v.mode}`);
    }
  });
});

describe('разминка от рекорда', () => {
  it('базовые: 50% × 10 и 75% × 5, шаг 5 lb', () => {
    const w = warmupSets(variant('tue1', 'machine'), { weight: 75 });
    expect(w.map((s) => [s.planWeight, s.planReps])).toEqual([
      [40, 10], // 37.5 → 40
      [55, 5], // 56.25 → 55
    ]);
  });

  it('гантели ≤ 15 lb — шаг 2.5', () => {
    expect(warmupSets(variant('tue1', 'free'), { weight: 30 }).map((s) => s.planWeight)).toEqual([15, 25]); // 15; 22.5 → 25
    expect(warmupSets(variant('tue4', 'free'), { weight: 10 }).map((s) => [s.planWeight, s.planReps])).toEqual([[5, 10]]);
    expect(warmupSets(variant('tue3', 'free'), { weight: 15 }).map((s) => s.planWeight)).toEqual([7.5]);
  });

  it('остальные — 50% × 10; свой вес и планка — 1 лёгкий подход без веса', () => {
    expect(warmupSets(variant('tue5', 'machine'), { weight: 40 }).map((s) => [s.planWeight, s.planReps])).toEqual([[20, 10]]);
    expect(warmupSets(variant('thu1', 'free'), { reps: 6, repsMax: 10 })).toEqual([
      { type: 'warmup', planWeight: undefined, planReps: 5, planSeconds: undefined, done: false },
    ]);
    expect(warmupSets(variant('thu7', 'free'), { seconds: 40 }).map((s) => [s.planWeight, s.planSeconds])).toEqual([[undefined, 20]]);
  });
});

describe('вес «сегодня»', () => {
  it('обычный: Легко +5, Нормально = рекорд, Тяжело −10', () => {
    expect(todayWeight(75, 'easy', 'machine')).toBe(80);
    expect(todayWeight(75, 'normal', 'machine')).toBe(75);
    expect(todayWeight(75, 'hard', 'machine')).toBe(65);
    expect(todayWeight(75, undefined, 'machine')).toBe(75);
  });

  it('гантели: Тяжело −5, не ниже минимального веса', () => {
    expect(todayWeight(30, 'easy', 'free')).toBe(35);
    expect(todayWeight(30, 'hard', 'free')).toBe(25);
    expect(todayWeight(10, 'hard', 'free')).toBe(5);
    expect(todayWeight(10, 'hard', 'machine')).toBe(5);
  });

  it('ответ меняет план всех рабочих подходов; ручная правка — тоже', () => {
    const v = variant('tue1', 'machine');
    const l = buildExerciseLog(defaultData(), getExercise('tue1'), 'machine', 'long');
    const plans = (x: ExerciseLog) => x.sets.filter((s) => s.type === 'work').map((s) => s.planWeight);
    expect(plans(l)).toEqual([75, 75, 75, 75]); // без ответа — рекорд
    const easy = applyFeel(l, v, 'easy');
    expect(easy.todayWeight).toBe(80);
    expect(plans(easy)).toEqual([80, 80, 80, 80]);
    expect(plans(applyFeel(l, v, 'hard'))).toEqual([65, 65, 65, 65]);
    const manual = setTodayWeight(easy, v, 70);
    expect(plans(manual)).toEqual([70, 70, 70, 70]);
    expect(manual.sets.filter((s) => s.type === 'warmup').map((s) => s.planWeight)).toEqual([40, 55]); // разминка не меняется
  });

  it('✓ копирует вес «сегодня» и верх диапазона', () => {
    const v = variant('tue1', 'machine');
    const l = applyFeel(buildExerciseLog(defaultData(), getExercise('tue1'), 'machine', 'long'), v, 'easy');
    const i = l.sets.findIndex((s) => s.type === 'work');
    const set = copyPlanToFact(l, 'weight', i).sets[i];
    expect([set.factWeight, set.factReps, set.done]).toEqual([80, 10, true]);
  });

  it('свой вес: цель повторов по ответу', () => {
    expect(bodyweightTarget({ reps: 6, repsMax: 10 }, 'easy')).toBe(10);
    expect(bodyweightTarget({ reps: 6, repsMax: 10 }, 'normal')).toBe(8);
    expect(bodyweightTarget({ reps: 6, repsMax: 10 }, 'hard')).toBe(6);
    expect(bodyweightTarget({ reps: 15, repsMax: 20 }, 'normal')).toBe(18);
    const v = variant('thu1', 'free');
    const l = applyFeel(buildExerciseLog(defaultData(), getExercise('thu1'), 'free', 'long'), v, 'normal');
    const w = l.sets.filter((s) => s.type === 'work');
    expect(w.map((s) => [s.planWeight, s.planReps, s.planRepsMax])).toEqual(Array(4).fill([undefined, 8, undefined]));
  });
});

describe('рост рекорда', () => {
  const full = (w: number, r: number, n = 4) => Array.from({ length: n }, () => work(w, r));

  it('все подходы на верху диапазона с весом ≥ рекорда → + шаг', () => {
    expect(growOf('tue1', 'machine', { weight: 75 }, full(75, 10))).toEqual({ weight: 80 });
    expect(growOf('tue1', 'machine', { weight: 75 }, full(80, 10))).toEqual({ weight: 80 }); // «Легко» — всё равно + шаг
    expect(growOf('tue1', 'free', { weight: 30 }, full(30, 10))).toEqual({ weight: 35 });
    expect(growOf('tue3', 'free', { weight: 15 }, full(15, 12, 3))).toEqual({ weight: 17.5 }); // гантели ≤ 15 — 2.5
    expect(growOf('tue4', 'free', { weight: 10 }, full(10, 15, 3))).toEqual({ weight: 12.5 });
  });

  it('хотя бы один подход ниже верха — без изменений', () => {
    expect(growOf('tue1', 'machine', { weight: 75 }, [...full(75, 10, 3), work(75, 9)])).toEqual({ weight: 75 });
    expect(growOf('tue1', 'machine', { weight: 75 }, [...full(75, 10, 3), work(undefined, undefined)])).toEqual({ weight: 75 });
  });

  it('вес «сегодня» ниже рекорда — без изменений', () => {
    expect(growOf('tue1', 'machine', { weight: 75 }, full(65, 10))).toEqual({ weight: 75 });
  });

  it('рекорд никогда не снижается автоматически', () => {
    expect(growOf('tue1', 'machine', { weight: 75 }, full(50, 3))).toEqual({ weight: 75 });
    expect(growOf('tue1', 'machine', { weight: 75 }, [])).toEqual({ weight: 75 });
  });

  it('свой вес: все подходы ≥ верха → диапазон +1 целиком', () => {
    expect(growOf('thu1', 'free', { reps: 6, repsMax: 10 }, full(0, 10))).toEqual({ reps: 7, repsMax: 11 });
    expect(growOf('thu1', 'free', { reps: 6, repsMax: 10 }, [...full(0, 10, 3), work(0, 8)])).toEqual({ reps: 6, repsMax: 10 });
  });

  it('планка: все подходы ≥ цели → +5 сек', () => {
    const plank = (secs: number[]) => secs.map((x) => work(undefined, undefined, x));
    expect(growOf('thu7', 'free', { seconds: 40 }, plank([40, 45, 40]))).toEqual({ seconds: 45 });
    expect(growOf('thu7', 'free', { seconds: 40 }, plank([40, 35, 40]))).toEqual({ seconds: 40 });
  });

  it('только при оценке «Легко» / «Нормально»; «Еле-еле», «Не смог» и без оценки — без изменений', () => {
    const plank = [40, 40, 40].map((x) => work(undefined, undefined, x));
    expect(growOf('tue1', 'machine', { weight: 75 }, full(75, 10), 'easy')).toEqual({ weight: 80 });
    for (const rating of ['hard', 'fail', null] as const) {
      expect(growOf('tue1', 'machine', { weight: 75 }, full(75, 10), rating)).toEqual({ weight: 75 });
      expect(growOf('thu1', 'free', { reps: 6, repsMax: 10 }, full(0, 10), rating)).toEqual({ reps: 6, repsMax: 10 });
      expect(growOf('thu7', 'free', { seconds: 40 }, plank, rating)).toEqual({ seconds: 40 });
    }
  });

  it('ручная правка: свой вес сдвигает диапазон целиком', () => {
    const d = setBest(defaultData(), variant('thu1', 'free'), { reps: 8 });
    expect(d.records['Подтягивания']).toEqual({ reps: 8, repsMax: 12 });
    expect(getBest(setBest(d, variant('tue1', 'machine'), { weight: 70 }), variant('tue1', 'machine'))).toEqual({ weight: 70 });
  });
});

describe('перенос рекордов из планов v1', () => {
  it('по названию варианта; одно движение в нескольких тренировках — максимум', () => {
    const plans = {
      A1: { machine: { sets: 4, reps: 8, weight: 85 } }, // Жим лёжа в Смите
      A2: { machine: { sets: 3, reps: 12, weight: 115 } }, // Жим ногами
      C1: { machine: { sets: 3, reps: 10, weight: 120 } }, // Жим ногами
      A3: { free: { sets: 3, reps: 10 } }, // Подтягивания — свой вес, диапазон из v2
      A7: { free: { sets: 3, seconds: 50 } }, // Планка
      B6: { machine: { sets: 3, reps: 15, weight: 50 } }, // Разгибание ног — нет в v2
      C3: { free: { sets: 3, reps: 10, weight: 40 } }, // Тяга гантели одной рукой
    };
    expect(recordsFromLegacyPlans(plans)).toEqual({
      'Жим лёжа в Смите': { weight: 85 },
      'Жим ногами': { weight: 120 },
      'Планка': { seconds: 50 },
      'Тяга гантели одной рукой': { weight: 40 },
    });
  });

  it('без сохранённого плана — стартовый рекорд v2; история, профиль и метрики не меняются', () => {
    const old = { ...defaultData(), version: 1, records: undefined, plans: { A1: { machine: { sets: 4, reps: 8, weight: 85 } } } };
    const d = migrateData(old);
    expect(d.version).toBe(2);
    expect(getBest(d, variant('tue1', 'machine'))).toEqual({ weight: 85 });
    expect(getBest(d, variant('thu3', 'machine'))).toEqual({ weight: 45 }); // в v1 было 90, но плана не сохранено
    expect([d.sessions, d.profile, d.bodyWeight, d.plans]).toEqual([old.sessions, old.profile, old.bodyWeight, old.plans]);
    expect(migrateData(d)).toEqual(d); // повторный перенос ничего не меняет
  });
});

describe('форматирование', () => {
  it('предпросмотр: подходы × диапазон × рекорд', () => {
    expect(formatPreview(variant('tue1', 'machine'), { weight: 75 }, 4)).toBe('4 × 6–10 × 75 lb');
    expect(formatPreview(variant('thu1', 'free'), { reps: 6, repsMax: 10 }, 3)).toBe('3 × 6–10 · свой вес');
    expect(formatPreview(variant('thu7', 'free'), { seconds: 40 }, 3)).toBe('3 × 40 сек');
  });

  it('разминка в итоге и истории', () => {
    const s = { warmup: { run: { ms: 372_000, distanceMi: 0.52 }, joints: { ms: 185_000 } } };
    expect(formatWarmup(s as never)).toBe('Пробежка 6:12 · 0.52 mi · Суставная 3:05');
    expect(formatWarmup({} as never)).toBeNull();
  });

  it('строка упражнения: v2 — ответ после разминки, v1 — оценка', () => {
    const v = variant('tue1', 'machine');
    const v2 = { ...log('tue1', 'machine', []), record: { weight: 75 }, feel: 'easy' as const, todayWeight: 80 };
    expect(exerciseMeta({ ...v2, rating: 'normal' }, v)).toBe('Разминка: Легко · сегодня 80 lb · Оценка: Нормально');
    expect(exerciseMeta(v2, v)).toBe('Разминка: Легко · сегодня 80 lb · без оценки');
    expect(exerciseMeta({ ...log('thu7', 'free', []), record: { seconds: 40 }, rating: 'fail' }, variant('thu7', 'free'))).toBe(
      'Оценка: Не смог',
    );
    expect(exerciseMeta({ ...log('A1', 'machine', []), rating: 'hard', difficulty: 7 }, v)).toBe('Еле-еле · сложность 7/10');
  });
});
