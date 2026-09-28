import { describe, expect, it } from '@jest/globals';
import { defaultData } from '../../store/defaults';
import type { AppData, Session } from '../../types';
import { buildSession, finishActive, setPlan, skippedItems, updateSet } from '../session';

const T0 = new Date('2026-01-01T10:00:00.000Z');
const at = (min: number) => new Date(T0.getTime() + min * 60_000);

function started(templateId: 'A' | 'B' | 'C' = 'A', length: 'long' | 'short' = 'long'): AppData {
  const d = defaultData();
  return { ...d, activeSession: buildSession(d, templateId, length, T0) };
}

// Заполнить все подходы по плану и поставить оценку.
function completeAll(s: Session, rating: 'easy' | 'normal' | 'hard' | 'fail'): Session {
  return {
    ...s,
    warmupDone: ['run', 'joints'],
    exercises: s.exercises.map((l) => ({
      ...l,
      rating,
      sets: l.sets.map((x) => ({
        ...x,
        factWeight: x.planWeight ?? 0,
        factReps: x.planReps,
        factSeconds: x.planSeconds,
        done: true,
      })),
    })),
  };
}

describe('сводка пропусков', () => {
  it('пустая тренировка: разминка, подходы и оценки каждого упражнения', () => {
    const s = started('A', 'short').activeSession!;
    const items = skippedItems(s);
    expect(items).toContain('Разминка: пробежка');
    expect(items).toContain('Разминка: суставная разминка');
    expect(items).toContain('Жим лёжа в Смите: не заполнены подходы (5)'); // 2 разминочных + 3 рабочих (короткая)
    expect(items).toContain('Жим лёжа в Смите: нет оценки');
    expect(items).toHaveLength(2 + 4 * 2);
  });

  it('всё заполнено — пропусков нет', () => {
    expect(skippedItems(completeAll(started().activeSession!, 'normal'))).toEqual([]);
  });

  it('частично: считаются только незаполненные подходы', () => {
    const s = completeAll(started().activeSession!, 'normal');
    const first = { ...s.exercises[0], rating: undefined, sets: s.exercises[0].sets.map((x, i) => (i === 0 ? { ...x, done: false } : x)) };
    const items = skippedItems({ ...s, exercises: [first, ...s.exercises.slice(1)] });
    expect(items).toEqual(['Жим лёжа в Смите: не заполнены подходы (1)', 'Жим лёжа в Смите: нет оценки']);
  });

  it('недобор повторов не выставляет оценку — только вручную', () => {
    const l = started().activeSession!.exercises[0];
    const workIndex = l.sets.findIndex((x) => x.type === 'work');
    expect(updateSet(l, 'weight', workIndex, { factWeight: 75, factReps: 6 }).rating).toBeUndefined();
    expect(updateSet({ ...l, rating: 'easy' }, 'weight', workIndex, { factReps: 6 }).rating).toBe('easy');
  });
});

describe('завершение тренировки', () => {
  it('сохраняет сессию, считает паузу, открывает итог', () => {
    const d = started();
    const paused: AppData = { ...d, activeSession: { ...d.activeSession!, pausedMs: 60_000, pausedAt: at(30).toISOString() } };
    const out = finishActive(paused, at(40));
    expect(out.activeSession).toBeNull();
    expect(out.sessions).toHaveLength(1);
    const s = out.sessions[0];
    expect(s.finishedAt).toBe(at(40).toISOString());
    expect(s.pausedMs).toBe(60_000 + 10 * 60_000);
    expect(s.pausedAt).toBeUndefined();
    expect(out.summaryId).toBe(s.id);
  });

  it('применяет прогрессию только к оценённым упражнениям', () => {
    const d = started('A', 'short');
    const s = completeAll(d.activeSession!, 'easy');
    s.exercises[3] = { ...s.exercises[3], rating: undefined };
    const out = finishActive({ ...d, activeSession: s }, at(50));
    expect(out.plans.A1?.machine?.weight).toBe(85); // 75 +10%
    expect(out.plans.A1?.machine?.sets).toBe(4); // короткая тренировка не урезает план
    expect(out.plans.A2?.machine?.weight).toBe(115); // ноги: +5%
    expect(out.plans.A3?.machine?.weight).toBe(110); // 100 +10%
    expect(out.plans.A4).toBeUndefined(); // без оценки
    expect(out.plans.A1?.free).toBeUndefined(); // другой вариант не трогаем
  });

  it('следующая тренировка строится по новому плану, разминка пересчитана', () => {
    const d = started('A', 'long');
    const out = finishActive({ ...d, activeSession: completeAll(d.activeSession!, 'easy') }, at(60));
    const next = buildSession({ ...out, summaryId: null }, 'A', 'long', at(3 * 24 * 60));
    const sets = next.exercises[0].sets;
    expect(sets.filter((x) => x.type === 'warmup').map((x) => x.planWeight)).toEqual([45, 65]);
    expect(sets.filter((x) => x.type === 'work').every((x) => x.planWeight === 85)).toBe(true);
    const plank = next.exercises[6].sets.filter((x) => x.type === 'work');
    expect(plank.every((x) => x.planSeconds === 50)).toBe(true);
  });

  it('ручная правка плана', () => {
    const d = setPlan(defaultData(), 'A1', 'machine', { weight: 70 });
    expect(d.plans.A1?.machine).toEqual({ sets: 4, reps: 8, weight: 70 });
  });
});
