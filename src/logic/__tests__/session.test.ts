import { describe, expect, it } from '@jest/globals';
import { getExercise, getVariant } from '../../data/program';
import { defaultData } from '../../store/defaults';
import type { AppData, Feel, Session, TemplateId } from '../../types';
import { applyFeel } from '../records';
import {
  buildSession,
  finishActive,
  lastNote,
  skippedItems,
  startStopwatch,
  stopStopwatch,
  stopwatchMs,
  togglePause,
} from '../session';

const T0 = new Date('2026-01-01T10:00:00.000Z');
const at = (min: number) => new Date(T0.getTime() + min * 60_000);

function started(templateId: TemplateId = 'tue', length: 'long' | 'short' = 'long', d: AppData = defaultData()): AppData {
  return { ...d, activeSession: buildSession(d, templateId, length, T0) };
}

// Разминка сделана, ответ после разминки дан, все подходы заполнены по плану (повторы — верх диапазона).
function completeAll(s: Session, feel: Feel = 'normal'): Session {
  return {
    ...s,
    warmup: { run: { ms: 360_000, distanceMi: 0.5 }, joints: { ms: 180_000 } },
    exercises: s.exercises.map((l) => {
      const withFeel = applyFeel(l, getVariant(getExercise(l.exerciseId), l.variant), feel);
      return {
        ...withFeel,
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
  it('Старт / Стоп, время суммируется, считается по меткам времени', () => {
    let s = started().activeSession!;
    const t = T0.getTime();
    s = startStopwatch(s, 'run', t);
    expect(stopwatchMs(s.warmup!.run, t + 90_000)).toBe(90_000); // идёт, в т.ч. после перезапуска
    s = stopStopwatch(s, 'run', t + 100_000);
    expect(stopwatchMs(s.warmup!.run, t + 500_000)).toBe(100_000);
    s = startStopwatch(s, 'run', t + 200_000);
    s = stopStopwatch(s, 'run', t + 230_000);
    expect(s.warmup!.run.ms).toBe(130_000);
  });

  it('пауза тренировки останавливает идущий секундомер', () => {
    let s = startStopwatch(started().activeSession!, 'joints', at(1).getTime());
    s = togglePause(s, at(3));
    expect(s.warmup!.joints).toEqual({ ms: 120_000, since: undefined });
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
    expect(items).toHaveLength(2 + 4 * 2);
  });

  it('всё заполнено — пропусков нет; разминочные подходы не обязательны', () => {
    const s = completeAll(started('thu').activeSession!);
    const noWarmupFacts = {
      ...s,
      exercises: s.exercises.map((l) => ({ ...l, sets: l.sets.map((x) => (x.type === 'warmup' ? { ...x, done: false } : x)) })),
    };
    expect(skippedItems(noWarmupFacts)).toEqual([]);
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
