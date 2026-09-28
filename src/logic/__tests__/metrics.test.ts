import { describe, expect, it } from '@jest/globals';
import { PROGRAM } from '../../data/program';
import { defaultData } from '../../store/defaults';
import type { AppData, Session } from '../../types';
import { formatAge, formatDay, formatHeight } from '../format';
import {
  addBodyWeight,
  addMeasurement,
  dayKey,
  exportData,
  finishedSessions,
  latestFirst,
  parseImport,
  parseNum,
  progressItems,
  progressSeries,
  removeEntry,
  shiftDay,
  weightSeries,
} from '../metrics';
import { buildSession, finishActive } from '../session';

// Завершённая тренировка с фактом = план (вес рабочих подходов можно переопределить).
function done(templateId: 'A' | 'B' | 'C', finishedAt: string, workWeight?: number): Session {
  // В C по умолчанию гоблет-присед — выбираем жим ногами, чтобы проверить объединение с A.
  const data = { ...defaultData(), variantChoice: { C1: 'machine' as const } };
  const s = buildSession(data, templateId, 'long', new Date(finishedAt));
  return {
    ...s,
    finishedAt,
    exercises: s.exercises.map((l) => ({
      ...l,
      sets: l.sets.map((x) => ({
        ...x,
        factWeight: x.type === 'work' && workWeight != null && x.planWeight != null ? workWeight : x.planWeight,
        factReps: x.planReps,
        factSeconds: x.planSeconds,
        done: true,
      })),
    })),
  };
}

describe('даты и ввод', () => {
  it('dayKey / shiftDay / formatDay — локальный день', () => {
    expect(dayKey(new Date(2026, 8, 28, 23, 59))).toBe('2026-09-28');
    expect(shiftDay('2026-09-30', 1)).toBe('2026-10-01');
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
    expect(formatDay('2026-09-05')).toBe('5 сен 2026');
  });

  it('parseNum принимает запятую, отвергает мусор', () => {
    expect(parseNum('161,3')).toBe(161.3);
    expect(parseNum(' 72 ')).toBe(72);
    expect(parseNum('')).toBeUndefined();
    expect(parseNum('abc')).toBeUndefined();
  });

  it('formatAge', () => {
    expect([21, 22, 25, 11, 12, 101].map(formatAge)).toEqual(['21 год', '22 года', '25 лет', '11 лет', '12 лет', '101 год']);
  });

  it('formatHeight', () => {
    expect(formatHeight(72)).toBe(`6'0"`);
    expect(formatHeight(70.5)).toBe(`5'10.5"`);
  });
});

describe('вес тела и замеры', () => {
  it('записи сортируются по дате, один вес на день', () => {
    let d = defaultData();
    d = addBodyWeight(d, '2026-09-10', 160);
    d = addBodyWeight(d, '2026-09-01', 161.3);
    d = addBodyWeight(d, '2026-09-10', 159.5);
    expect(d.bodyWeight.map((e) => [e.date, e.value])).toEqual([
      ['2026-09-01', 161.3],
      ['2026-09-10', 159.5],
    ]);
    const pts = weightSeries(d.bodyWeight);
    expect(pts.map((p) => p.y)).toEqual([161.3, 159.5]);
    expect(pts[0].x).toBeLessThan(pts[1].x);
    expect(latestFirst(d.bodyWeight)[0].date).toBe('2026-09-10');
    d = removeEntry(d, 'bodyWeight', d.bodyWeight[0].id);
    expect(d.bodyWeight).toHaveLength(1);
  });

  it('замеры за один день объединяются, пустые поля не затирают', () => {
    let d = defaultData();
    d = addMeasurement(d, '2026-09-10', { chest: 38, waist: 31 });
    d = addMeasurement(d, '2026-09-10', { waist: 30.5, calf: 14, biceps: undefined });
    expect(d.measurements).toHaveLength(1);
    expect(d.measurements[0]).toMatchObject({ date: '2026-09-10', chest: 38, waist: 30.5, calf: 14 });
    d = removeEntry(d, 'measurements', d.measurements[0].id);
    expect(d.measurements).toEqual([]);
  });
});

describe('история и прогресс', () => {
  const sessions = [
    done('A', '2026-09-01T18:00:00.000Z', 75),
    done('C', '2026-09-05T18:00:00.000Z'),
    done('A', '2026-09-08T18:00:00.000Z', 80),
    { ...buildSession(defaultData(), 'B', 'long'), finishedAt: undefined }, // незавершённая
  ];

  it('история — только завершённые, новые сверху', () => {
    expect(finishedSessions(sessions).map((s) => s.finishedAt)).toEqual([
      '2026-09-08T18:00:00.000Z',
      '2026-09-05T18:00:00.000Z',
      '2026-09-01T18:00:00.000Z',
    ]);
  });

  it('рабочий вес по датам', () => {
    const pts = progressSeries(sessions, 'Жим лёжа в Смите');
    expect(pts.map((p) => p.y)).toEqual([75, 80]);
  });

  it('одно движение из A и C — один график (жим ногами: A2 и C1)', () => {
    const pts = progressSeries(sessions, 'Жим ногами');
    expect(pts.map((p) => [p.date.slice(0, 10), p.y])).toEqual([
      ['2026-09-01', 75],
      ['2026-09-05', 110],
      ['2026-09-08', 80],
    ]);
    expect(progressItems(sessions).find((i) => i.key === 'Жим ногами')?.count).toBe(3);
  });

  it('планка — секунды, свой вес — повторы', () => {
    expect(progressSeries(sessions, 'Планка').map((p) => p.y)).toEqual([40, 40]);
    const items = progressItems(sessions);
    expect(items.find((i) => i.key === 'Планка')?.mode).toBe('time');
  });

  it('незаполненные упражнения в прогресс не попадают', () => {
    const empty = { ...done('B', '2026-09-03T18:00:00.000Z'), exercises: buildSession(defaultData(), 'B', 'long').exercises };
    expect(progressItems([empty])).toEqual([]);
  });

  it('одинаковое имя варианта — всегда одинаковый режим (ключ графика корректен)', () => {
    const modes = new Map<string, string>();
    for (const t of PROGRAM)
      for (const e of t.exercises)
        for (const v of e.variants) {
          expect(modes.get(v.name) ?? v.mode).toBe(v.mode);
          modes.set(v.name, v.mode);
        }
  });
});

describe('экспорт / импорт', () => {
  function sample(): AppData {
    let d = defaultData();
    d = addBodyWeight(d, '2026-09-01', 160.2);
    d = addMeasurement(d, '2026-09-01', { waist: 31 });
    d = { ...d, activeSession: buildSession(d, 'A', 'short', new Date('2026-09-02T10:00:00.000Z')) };
    d = finishActive(d, new Date('2026-09-02T11:00:00.000Z'));
    return { ...d, summaryId: null, profile: { age: 23, heightIn: 72, startWeight: 161.3 } };
  }

  it('экспорт → импорт возвращает те же данные', () => {
    const d = sample();
    const res = parseImport(exportData(d));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toEqual(JSON.parse(JSON.stringify(d)));
  });

  it('незавершённая тренировка и открытый итог не импортируются', () => {
    const d = { ...sample(), summaryId: 'x', activeSession: buildSession(defaultData(), 'B', 'long') };
    const res = parseImport(exportData(d));
    expect(res.ok && res.data.activeSession).toBeNull();
    expect(res.ok && res.data.summaryId).toBeNull();
  });

  it('недостающие необязательные поля берутся по умолчанию', () => {
    const { plans, variantChoice, lengthChoice, ...rest } = sample();
    const res = parseImport(JSON.stringify(rest));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.plans).toEqual({});
  });

  it('отказ на битом JSON и чужой структуре', () => {
    const bad = [
      '{not json',
      '[]',
      '{"version":2}',
      JSON.stringify({ ...sample(), profile: null }),
      JSON.stringify({ ...sample(), bodyWeight: [{ date: '2026-01-01', value: 'x' }] }),
      JSON.stringify({ ...sample(), sessions: [{ id: 'a', templateId: 'Z', startedAt: '', exercises: [] }] }),
      JSON.stringify({
        ...sample(),
        sessions: [{ id: 'a', templateId: 'A', startedAt: '', exercises: [{ exerciseId: 'Z9', variant: 'free', sets: [] }] }],
      }),
    ];
    for (const text of bad) {
      const res = parseImport(text);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.length).toBeGreaterThan(0);
    }
  });
});
