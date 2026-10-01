import { describe, expect, it } from '@jest/globals';
import { getExercise, getVariant } from '../../data/program';
import { defaultData } from '../../store/defaults';
import type { AppData, Feel, Rating, Session, TemplateId } from '../../types';
import { applyFeel } from '../records';
import {
  buildSession,
  deleteSession,
  finishActive,
  finishStopwatch,
  lastNote,
  lastRating,
  pauseStopwatch,
  resetStopwatch,
  setRunDistance,
  skippedItems,
  startStopwatch,
  stopwatchMs,
  stopwatchState,
  togglePause,
} from '../session';

const T0 = new Date('2026-01-01T10:00:00.000Z');
const at = (min: number) => new Date(T0.getTime() + min * 60_000);

function started(templateId: TemplateId = 'tue', length: 'long' | 'short' = 'long', d: AppData = defaultData()): AppData {
  return { ...d, activeSession: buildSession(d, templateId, length, T0) };
}

// Разминка завершена, ответ после разминки и оценка даны, все подходы заполнены по плану (повторы — верх диапазона).
function completeAll(s: Session, feel: Feel = 'normal', rating: Rating = 'normal'): Session {
  return {
    ...s,
    warmup: { run: { ms: 360_000, distanceMi: 0.5, done: true }, joints: { ms: 180_000, done: true } },
    exercises: s.exercises.map((l) => {
      const withFeel = applyFeel(l, getVariant(getExercise(l.exerciseId), l.variant), feel);
      return {
        ...withFeel,
        rating,
        sets: withFeel.sets.map((x) => ({
          ...x,
          factWeight: x.planWeight ?? 0,
          factReps: x.planRepsMax ?? x.planReps,
          factSeconds: x.planSeconds,
          done: true,
        })),
      };
    }),
  };
}

describe('новая тренировка', () => {
  it('короткая: первые 4 упражнения, ≤ 3 рабочих подхода', () => {
    const s = started('tue', 'short').activeSession!;
    expect(s.exercises.map((l) => l.exerciseId)).toEqual(['tue1', 'tue2', 'tue3', 'tue4']);
    expect(s.exercises[0].sets.filter((x) => x.type === 'work')).toHaveLength(3);
    expect(started('tue', 'long').activeSession!.exercises[0].sets.filter((x) => x.type === 'work')).toHaveLength(4);
  });

  it('план: рекорд × диапазон, разминка от рекорда, снимок рекорда в логе', () => {
    const l = started('tue').activeSession!.exercises[0];
    expect(l.record).toEqual({ weight: 75 });
    expect(l.sets.map((x) => [x.type, x.planWeight, x.planReps, x.planRepsMax])).toEqual([
      ['warmup', 40, 10, undefined],
      ['warmup', 55, 5, undefined],
      ...Array(4).fill(['work', 75, 6, 10]),
    ]);
  });
});

describe('секундомеры разминки', () => {
  const t = T0.getTime();

  it('Старт → Пауза → Продолжить с того же времени → Завершить', () => {
    let s = started().activeSession!;
    expect(stopwatchState(s.warmup!.run)).toBe('idle');
    s = startStopwatch(s, 'run', t);
    expect(stopwatchState(s.warmup!.run)).toBe('running');
    expect(stopwatchMs(s.warmup!.run, t + 90_000)).toBe(90_000); // по меткам времени — переживает перезапуск
    s = pauseStopwatch(s, 'run', t + 100_000);
    expect(stopwatchState(s.warmup!.run)).toBe('paused');
    expect(stopwatchMs(s.warmup!.run, t + 500_000)).toBe(100_000);
    s = startStopwatch(s, 'run', t + 200_000);
    s = finishStopwatch(s, 'run', t + 230_000);
    expect(s.warmup!.run).toEqual({ ms: 130_000, since: undefined, done: true });
    expect(stopwatchState(s.warmup!.run)).toBe('done');
    expect(startStopwatch(s, 'run', t + 300_000).warmup!.run.since).toBeUndefined(); // завершённый не запускается
  });

  it('выполнен только после «Завершить» (в т.ч. с паузы)', () => {
    let s = pauseStopwatch(startStopwatch(started().activeSession!, 'joints', t), 'joints', t + 60_000);
    expect(skippedItems(s)).toContain('Разминка: суставная разминка');
    s = finishStopwatch(s, 'joints', t + 90_000);
    expect(s.warmup!.joints.ms).toBe(60_000);
    expect(skippedItems(s)).not.toContain('Разминка: суставная разминка');
  });

  it('«Сброс» обнуляет время и дистанцию, пункт снова не выполнен', () => {
    let s = finishStopwatch(startStopwatch(started().activeSession!, 'run', t), 'run', t + 60_000);
    s = setRunDistance(s, 0.52);
    s = resetStopwatch(s, 'run');
    expect(s.warmup!.run).toEqual({ ms: 0 });
    expect(stopwatchState(s.warmup!.run)).toBe('idle');
    expect(skippedItems(s)).toContain('Разминка: пробежка');
  });

  it('пауза тренировки ставит идущий секундомер на паузу', () => {
    let s = startStopwatch(started().activeSession!, 'joints', at(1).getTime());
    s = togglePause(s, at(3));
    expect(stopwatchState(s.warmup!.joints)).toBe('paused');
    expect(stopwatchMs(s.warmup!.joints, at(10).getTime())).toBe(120_000);
  });
});

describe('сводка пропусков', () => {
  it('пустая тренировка: разминка, ответ после разминки и рабочие подходы', () => {
    const items = skippedItems(started('tue', 'short').activeSession!);
    expect(items).toContain('Разминка: пробежка');
    expect(items).toContain('Разминка: суставная разминка');
    expect(items).toContain('Жим лёжа в Смите: нет ответа после разминки');
    expect(items).toContain('Жим лёжа в Смите: не заполнены рабочие подходы (3)');
    expect(items).toContain('Жим лёжа в Смите: нет оценки');
    expect(items).toHaveLength(2 + 4 * 3);
  });

  it('всё заполнено — пропусков нет; разминочные подходы не обязательны', () => {
    const s = completeAll(started('thu').activeSession!);
    const noWarmupFacts = {
      ...s,
      exercises: s.exercises.map((l) => ({ ...l, sets: l.sets.map((x) => (x.type === 'warmup' ? { ...x, done: false } : x)) })),
    };
    expect(skippedItems(noWarmupFacts)).toEqual([]);
  });

  it('упражнение без оценки (в т.ч. планка) — пропуск', () => {
    const s = completeAll(started('thu').activeSession!);
    const plank = { ...s.exercises[6], rating: undefined };
    expect(skippedItems({ ...s, exercises: [...s.exercises.slice(0, 6), plank] })).toEqual(['Планка: нет оценки']);
  });

  it('незавершённый секундомер разминки — пропуск, даже если время идёт', () => {
    const s = completeAll(started('thu').activeSession!);
    const w = { ...s, warmup: { ...s.warmup!, run: { ms: 300_000 } } };
    expect(skippedItems(w)).toEqual(['Разминка: пробежка']);
  });

  it('планке ответ после разминки не нужен', () => {
    const s = completeAll(started('thu').activeSession!);
    const plank = { ...s.exercises[6], feel: undefined };
    expect(skippedItems({ ...s, exercises: [...s.exercises.slice(0, 6), plank] })).toEqual([]);
  });
});

describe('завершение тренировки', () => {
  it('сохраняет сессию, считает паузу, открывает итог', () => {
    const d = started();
    const paused: AppData = { ...d, activeSession: { ...d.activeSession!, pausedMs: 60_000, pausedAt: at(30).toISOString() } };
    const out = finishActive(paused, at(40));
    expect(out.activeSession).toBeNull();
    const s = out.sessions[0];
    expect(s.finishedAt).toBe(at(40).toISOString());
    expect(s.pausedMs).toBe(60_000 + 10 * 60_000);
    expect(out.summaryId).toBe(s.id);
  });

  it('рекорды растут только у выполненных на верху диапазона', () => {
    const d = started('tue', 'short');
    const s = completeAll(d.activeSession!, 'normal');
    s.exercises[1] = { ...s.exercises[1], sets: s.exercises[1].sets.map((x, i, all) => (i === all.length - 1 ? { ...x, factReps: 11 } : x)) };
    const out = finishActive({ ...d, activeSession: s }, at(50));
    expect(out.records['Жим лёжа в Смите']).toEqual({ weight: 80 });
    expect(out.records['Жим гантелей на наклонной']).toEqual({ weight: 25 }); // один подход ниже верха
    expect(out.records['Жим гантелей сидя']).toEqual({ weight: 17.5 }); // гантели ≤ 15 — 2.5
    expect(out.records['Жим гантелей лёжа']).toBeUndefined(); // другой вариант не трогаем
  });

  it('«Тяжело» — рекорд не растёт и не снижается; следующая разминка от рекорда', () => {
    const d = started('tue');
    const out = finishActive({ ...d, activeSession: completeAll(d.activeSession!, 'hard') }, at(60));
    expect(out.records['Жим лёжа в Смите']).toEqual({ weight: 75 });
    const next = buildSession(out, 'tue', 'long', at(7 * 24 * 60));
    expect(next.exercises[0].sets.filter((x) => x.type === 'warmup').map((x) => x.planWeight)).toEqual([40, 55]);
  });

  it('общий рекорд движения на разных днях (махи Вт и Сб)', () => {
    const d = started('tue');
    const out = finishActive({ ...d, activeSession: completeAll(d.activeSession!) }, at(60));
    const sat = buildSession(out, 'sat', 'long', at(4 * 24 * 60));
    const raise = sat.exercises[5];
    expect(raise.record).toEqual({ weight: 12.5 });
    expect(raise.sets.filter((x) => x.type === 'work')).toHaveLength(2);
  });

  it('«Еле-еле» и «Не смог» — рекорд не растёт, даже если всё на верху диапазона', () => {
    for (const rating of ['hard', 'fail'] as const) {
      const d = started('tue', 'short');
      const out = finishActive({ ...d, activeSession: completeAll(d.activeSession!, 'normal', rating) }, at(50));
      expect(out.records['Жим лёжа в Смите']).toEqual({ weight: 75 });
    }
    const d = started('tue', 'short');
    const easy = finishActive({ ...d, activeSession: completeAll(d.activeSession!, 'normal', 'easy') }, at(50));
    expect(easy.records['Жим лёжа в Смите']).toEqual({ weight: 80 });
  });

  it('оценка сохраняется в тренировке; «В прошлый раз» — последняя оценка варианта', () => {
    const d = started('tue');
    const out = finishActive({ ...d, activeSession: completeAll(d.activeSession!, 'normal', 'hard') }, at(60));
    expect(out.sessions[0].exercises[0].rating).toBe('hard');
    const later = { ...completeAll(buildSession(out, 'tue', 'long', at(100)), 'normal', 'easy'), finishedAt: at(160).toISOString() };
    later.exercises[0] = { ...later.exercises[0], rating: undefined };
    expect(lastRating([...out.sessions, later], 'Жим лёжа в Смите')).toBe('hard'); // без оценки — пропускается
    expect(lastRating([...out.sessions, later], 'Жим гантелей на наклонной')).toBe('easy');
    expect(lastRating(out.sessions, 'Жим гантелей лёжа')).toBeUndefined();
  });

  it('тренировка v1 рекорды не меняет', () => {
    const d = started('A');
    expect(finishActive({ ...d, activeSession: completeAll(d.activeSession!) }, at(60)).records).toEqual({});
  });

  it('прошлая заметка — последняя непустая к этому варианту', () => {
    const d = started('tue');
    const s1 = { ...d.activeSession!, finishedAt: at(60).toISOString() };
    s1.exercises = s1.exercises.map((l, i) => (i === 0 ? { ...l, comment: 'локти уже' } : l));
    const s2 = { ...buildSession(d, 'tue', 'long', at(100)), finishedAt: at(160).toISOString() };
    expect(lastNote([s1, s2], 'Жим лёжа в Смите')).toBe('локти уже');
    expect(lastNote([s1, s2], 'Жим лёжа в Смите', s1.id)).toBeUndefined();
    expect(lastNote([s1, s2], 'Жим гантелей на наклонной')).toBeUndefined();
  });
});

describe('удаление тренировки (SPEC_v3_2 §3)', () => {
  const SMITH = 'Жим лёжа в Смите';
  // Тренировка Вт, завершённая через `days` дней от T0; feel 'hard' — рекорд не растёт.
  function workout(d: AppData, days: number, feel: Feel = 'normal'): AppData {
    const start = at(days * 24 * 60);
    const s = completeAll(buildSession(d, 'tue', 'long', start), feel);
    return { ...finishActive({ ...d, activeSession: s }, new Date(start.getTime() + 60 * 60_000)), summaryId: null };
  }

  it('тренировка убирается из истории; итог закрывается', () => {
    const d = { ...workout(defaultData(), 0), summaryId: null };
    const id = d.sessions[0].id;
    const out = deleteSession({ ...d, summaryId: id }, id);
    expect(out.sessions).toHaveLength(0);
    expect(out.summaryId).toBeNull();
    expect(deleteSession(out, 'нет такой')).toBe(out);
  });

  it('рекорд, поднятый этой тренировкой и не менявшийся после, откатывается к «было»', () => {
    const d = workout(defaultData(), 0);
    expect(d.records[SMITH]).toEqual({ weight: 80 });
    const out = deleteSession(d, d.sessions[0].id);
    expect(out.records[SMITH]).toEqual({ weight: 75 });
  });

  it('после была тренировка без изменения рекорда — откат есть', () => {
    let d = workout(defaultData(), 0);
    d = workout(d, 7, 'hard');
    expect(d.records[SMITH]).toEqual({ weight: 80 });
    const out = deleteSession(d, d.sessions[0].id);
    expect(out.records[SMITH]).toEqual({ weight: 75 });
    expect(out.sessions).toHaveLength(1);
  });

  it('после была тренировка, изменившая рекорд, — рекорд не трогаем', () => {
    let d = workout(defaultData(), 0);
    d = workout(d, 7);
    expect(d.records[SMITH]).toEqual({ weight: 85 });
    const out = deleteSession(d, d.sessions[0].id);
    expect(out.records[SMITH]).toEqual({ weight: 85 });
  });

  it('рекорд изменён вручную после тренировки — не трогаем; тренировка без роста — не трогаем', () => {
    const d = workout(defaultData(), 0);
    const manual = { ...d, records: { ...d.records, [SMITH]: { weight: 90 } } };
    expect(deleteSession(manual, d.sessions[0].id).records[SMITH]).toEqual({ weight: 90 });
    const hard = workout(defaultData(), 0, 'hard');
    expect(deleteSession(hard, hard.sessions[0].id).records).toEqual(hard.records);
  });
});
