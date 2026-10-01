import { describe, expect, it } from '@jest/globals';
import { defaultData } from '../../store/defaults';
import { activeDays, weekCounts } from '../home';
import { migrateData } from '../../store/migrate';
import {
  cancelRun,
  finishRun,
  formatClock,
  formatPace,
  formatRunTime,
  msToMinutes,
  paceMinPerMi,
  parseRunTime,
  pauseRun,
  resetRun,
  resumeRun,
  runMs,
  runState,
  sanitizeActiveRun,
  saveRun,
  startRun,
} from '../run';
import { buildSession } from '../session';

const T = new Date('2026-09-30T08:00:00.000Z').getTime();
const sec = (n: number) => T + n * 1000;
const WED = '2026-09-30';

describe('активная пробежка (SPEC_v3_2 §4)', () => {
  it('Старт → Пауза → Продолжить → Завершить: время по меткам, переживает перезапуск', () => {
    let d = startRun(defaultData(), T);
    expect(runState(d.activeRun!)).toBe('idle');
    d = resumeRun(d, sec(0));
    expect(runState(d.activeRun!)).toBe('running');
    expect(runMs(d.activeRun!, sec(90))).toBe(90_000);
    d = pauseRun(d, sec(90));
    expect(runState(d.activeRun!)).toBe('paused');
    expect(runMs(d.activeRun!, sec(500))).toBe(90_000);
    // «Перезапуск»: сохранение → загрузка, секундомер идёт дальше.
    d = resumeRun(d, sec(100));
    const restored = migrateData(JSON.parse(JSON.stringify(d)));
    expect(runMs(restored.activeRun!, sec(130))).toBe(120_000);
    d = finishRun(d, sec(130));
    expect(runState(d.activeRun!)).toBe('done');
    expect(runMs(d.activeRun!, sec(999))).toBe(120_000);
    expect(resumeRun(d, sec(140))).toBe(d); // после «Завершить» не продолжается
  });

  it('«Сброс» обнуляет; не стартует поверх тренировки или другой пробежки', () => {
    let d = resumeRun(startRun(defaultData(), T), T);
    d = resetRun(pauseRun(d, sec(30)));
    expect(runMs(d.activeRun!, sec(60))).toBe(0);
    expect(runState(d.activeRun!)).toBe('idle');
    expect(startRun(d, sec(70))).toBe(d);
    const withWorkout = { ...defaultData(), activeSession: buildSession(defaultData(), 'tue', 'long') };
    expect(startRun(withWorkout).activeRun).toBeNull();
  });

  it('«Сохранить» записывает в пробежки: счётчик недели, календарь; «Отменить» — без записи', () => {
    const d = finishRun(resumeRun(startRun(defaultData(), T), T), sec(1400));
    const saved = saveRun(d, WED, { minutes: msToMinutes(runMs(d.activeRun!)), distanceMi: 2.5 });
    expect(saved.activeRun).toBeNull();
    expect(saved.runs[WED]).toEqual({ minutes: 23.33, distanceMi: 2.5 });
    expect(weekCounts(saved, WED).runs).toBe(1);
    expect(activeDays(saved).has(WED)).toBe(true);
    const cancelled = cancelRun(d);
    expect(cancelled.activeRun).toBeNull();
    expect(cancelled.runs).toEqual({});
  });

  it('пробежка за день уже есть — заменяется', () => {
    const d = { ...startRun(defaultData(), T), runs: { [WED]: { minutes: 30, distanceMi: 3 } } };
    expect(saveRun(d, WED, { minutes: 20 }).runs[WED]).toEqual({ minutes: 20 });
  });

  it('время, темп и форматы', () => {
    expect(msToMinutes(1_400_000)).toBe(23.33);
    expect(parseRunTime('23:20')).toBe(23.33);
    expect(parseRunTime('45')).toBe(45);
    expect(parseRunTime('1:05:00')).toBe(65);
    expect([parseRunTime(''), parseRunTime('0:00'), parseRunTime('10:75'), parseRunTime('ab')]).toEqual([undefined, undefined, undefined, undefined]);
    expect(formatClock(23.33)).toBe('23:20');
    expect(formatClock(65)).toBe('1:05:00');
    expect(formatRunTime(30)).toBe('30 мин');
    expect(formatRunTime(23.33)).toBe('23 мин 20 с');
    expect(paceMinPerMi(28.5, 3)).toBe(9.5);
    expect(paceMinPerMi(28.5)).toBeUndefined();
    expect(formatPace(9.5)).toBe('9:30 мин/mi');
  });

  it('битая активная пробежка при загрузке отбрасывается', () => {
    expect(sanitizeActiveRun({ startedAt: 'x', sw: { ms: 0 } })).toBeNull();
    expect(sanitizeActiveRun({ startedAt: new Date(T).toISOString(), sw: { ms: -1 } })).toBeNull();
    expect(sanitizeActiveRun(undefined)).toBeNull();
    expect(sanitizeActiveRun({ startedAt: new Date(T).toISOString(), sw: { ms: 5, done: true, since: 'x' } })).toEqual({
      startedAt: new Date(T).toISOString(),
      sw: { ms: 5, done: true },
    });
  });
});
