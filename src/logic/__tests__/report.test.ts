import { describe, expect, it } from '@jest/globals';
import { getExercise, getVariant } from '../../data/program';
import { defaultData } from '../../store/defaults';
import type { Session } from '../../types';
import { applyFeel } from '../records';
import { reportFileName, runReport, sessionReport } from '../report';
import { buildSession, finishActive } from '../session';

// Тренировка Вт: разминка, «Легко» после разминки, оценка «Нормально», все подходы по плану.
function finished(): Session {
  const d = defaultData();
  const start = new Date(2026, 8, 29, 6, 5);
  const s = buildSession(d, 'tue', 'long', start);
  const done: Session = {
    ...s,
    warmup: { run: { ms: 372_000, distanceMi: 0.52, done: true }, joints: { ms: 185_000, done: true } },
    exercises: s.exercises.map((l, i) => {
      const withFeel = applyFeel(l, getVariant(getExercise(l.exerciseId), l.variant), 'easy');
      return {
        ...withFeel,
        rating: 'normal' as const,
        comment: i === 0 ? 'Плечи | ок' : undefined,
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
  const out = finishActive({ ...d, activeSession: done }, new Date(2026, 8, 29, 7, 10));
  return out.sessions[0];
}

describe('отчёт по тренировке (SPEC_v3_3 §B2)', () => {
  it('имя файла: приложение, день, название через дефис', () => {
    expect(reportFileName('2026-09-28', 'Грудь и плечи')).toBe('TOCHKA-Fitness_2026-09-28_Грудь-и-плечи.md');
    expect(sessionReport(finished()).fileName).toBe('TOCHKA-Fitness_2026-09-29_Грудь-и-плечи.md');
  });

  it('шапка: дата, длинная/короткая, длительность, пауза, разминка, тоннаж', () => {
    const md = sessionReport(finished()).markdown;
    expect(md).toContain('# Вт — Грудь и плечи');
    expect(md).toContain('- Дата: 29 сен 2026, 06:05–07:10');
    expect(md).toContain('- Версия: длинная');
    expect(md).toContain('- Длительность: 1:05:00');
    expect(md).toContain('- Общая пауза: 00:00');
    expect(md).toContain('- Разминка: Пробежка 6:12 · 0.52 mi · Суставная 3:05');
    expect(md).toMatch(/- Тоннаж: [\d\s]+ lb/);
  });

  it('упражнение: вариант, рекорд было → стало, ответ, вес «сегодня», таблица План | Факт, оценка, заметка', () => {
    const md = sessionReport(finished()).markdown;
    expect(md).toContain('## 1. Жим лёжа в Смите');
    expect(md).toContain('- Вариант: тренажёр');
    expect(md).toContain('- Рекорд: 75 lb → 80 lb');
    expect(md).toContain('- Ответ после разминки: Легко');
    expect(md).toContain('- Вес «сегодня»: 80 lb');
    expect(md).toContain('- Оценка: Нормально');
    expect(md).toContain('- Заметка: Плечи / ок');
    expect(md).toContain('| Подход | План | Факт |');
    expect(md).toContain('| Разминочный 1 | 40 × 10 | 40 × 10 |');
    expect(md).toContain('| Рабочий 1 | 80 × 6–10 | 80 × 10 |');
  });

  it('пробежка: время, дистанция, темп', () => {
    const r = runReport('2026-09-30', { minutes: 28, distanceMi: 3 });
    expect(r.fileName).toBe('TOCHKA-Fitness_2026-09-30_Пробежка.md');
    expect(r.markdown).toContain('- Время: 28 мин');
    expect(r.markdown).toContain('- Дистанция: 3 mi');
    expect(r.markdown).toContain('- Темп: 9:20 мин/mi');
    expect(runReport('2026-09-30', { minutes: 20 }).markdown).toContain('- Темп: —');
  });
});
