import { describe, expect, it } from '@jest/globals';
import { defaultData } from '../../store/defaults';
import type { AppData } from '../../types';
import { setSwap, toggleEaten } from '../food';
import {
  finishedOn,
  homeDayType,
  lastSession,
  nextWorkout,
  recordGains,
  templateForDay,
  weekCounts,
  weekStart,
  weightTrend,
} from '../home';
import { addBodyWeight, exportData, parseImport } from '../metrics';
import { buildSession, finishActive, startWorkout } from '../session';
import { formatSleep, removeRun, removeSleep, sanitizeRuns, sanitizeSleep, setRun, setSleep, sleepAverage, sleepMinutes } from '../sleep';

const MON = '2026-09-28';
const TUE = '2026-09-29';
const WED = '2026-09-30';
const THU = '2026-10-01';
const FRI = '2026-10-02';
const SAT = '2026-10-03';
const SUN = '2026-10-04';

// Тренировка по шаблону, завершённая в локальное время дня `day`.
function withWorkout(d: AppData, id: 'tue' | 'thu' | 'sat', day: string, hour = 10): AppData {
  const [y, m, dd] = day.split('-').map(Number);
  const start = new Date(y, m - 1, dd, hour);
  const next = { ...d, activeSession: buildSession(d, id, 'long', start) };
  return { ...finishActive(next, new Date(start.getTime() + 60 * 60_000)), summaryId: null };
}

describe('тип дня на «Главной»', () => {
  it('Вт/Чт/Сб — зал, Ср/Пт — пробежка, Пн/Вс — отдых', () => {
    expect([MON, TUE, WED, THU, FRI, SAT, SUN].map(homeDayType)).toEqual(['rest', 'gym', 'run', 'gym', 'run', 'gym', 'rest']);
  });

  it('тренировка дня по расписанию', () => {
    expect(templateForDay(TUE)?.id).toBe('tue');
    expect(templateForDay(SAT)?.id).toBe('sat');
    expect(templateForDay(WED)).toBeUndefined();
  });

  it('следующая тренировка: сегодня, если ещё не сделана, иначе ближайший день зала', () => {
    const d = defaultData();
    expect(nextWorkout(d, TUE)).toMatchObject({ day: TUE, template: { id: 'tue' } });
    expect(nextWorkout(d, WED)).toMatchObject({ day: THU, template: { id: 'thu' } });
    expect(nextWorkout(d, SUN)).toMatchObject({ day: '2026-10-06', template: { id: 'tue' } });
    const done = withWorkout(d, 'tue', TUE);
    expect(finishedOn(done, TUE)?.templateId).toBe('tue');
    expect(nextWorkout(done, TUE)).toMatchObject({ day: THU, template: { id: 'thu' } });
  });

  it('старт тренировки с «Главной» — выбранной длины; вторая не стартует поверх первой', () => {
    let d: AppData = { ...defaultData(), lengthChoice: { tue: 'short' } };
    d = startWorkout(d, 'tue');
    expect(d.activeSession?.length).toBe('short');
    expect(startWorkout(d, 'thu').activeSession?.templateId).toBe('tue');
  });
});

describe('сон', () => {
  it('длительность через полночь', () => {
    expect(sleepMinutes({ bed: '23:30', wake: '07:10' })).toBe(460);
    expect(sleepMinutes({ bed: '00:30', wake: '08:00' })).toBe(450);
    expect(sleepMinutes({ bed: '22:00', wake: '22:00' })).toBe(0);
    expect(formatSleep(460)).toBe('7 ч 40 мин');
    expect(formatSleep(480)).toBe('8 ч');
    expect(formatSleep(45)).toBe('45 мин');
  });

  it('среднее за 7 дней — только по ночам с записью, старше 7 дней не входят', () => {
    let d = setSleep(defaultData(), SUN, { bed: '23:00', wake: '07:00', quality: 4 }); // 480
    d = setSleep(d, FRI, { bed: '00:00', wake: '07:00', quality: 3 }); // 420
    d = setSleep(d, '2026-09-27', { bed: '20:00', wake: '10:00', quality: 5 }); // 8 дней назад
    expect(sleepAverage(d.sleep, SUN, 7)).toBe(450);
    expect(sleepAverage(d.sleep, SUN, 30)).toBe(Math.round((480 + 420 + 840) / 3));
    expect(sleepAverage(defaultData().sleep, SUN, 7)).toBeUndefined();
  });

  it('запись можно исправить и удалить', () => {
    let d = setSleep(defaultData(), SUN, { bed: '23:00', wake: '07:00', quality: 4 });
    d = setSleep(d, SUN, { bed: '23:30', wake: '07:10', quality: 5 });
    expect(d.sleep[SUN]).toEqual({ bed: '23:30', wake: '07:10', quality: 5 });
    expect(removeSleep(d, SUN).sleep).toEqual({});
  });
});

describe('неделя', () => {
  it('неделя начинается в понедельник', () => {
    expect([MON, WED, SUN].map(weekStart)).toEqual([MON, MON, MON]);
    expect(weekStart('2026-10-05')).toBe('2026-10-05');
  });

  it('счётчики тренировок и пробежек за пн–вс', () => {
    let d = withWorkout(defaultData(), 'tue', TUE);
    d = withWorkout(d, 'thu', THU);
    d = withWorkout(d, 'sat', '2026-09-26'); // прошлая неделя
    d = setRun(d, WED, { minutes: 30, distanceMi: 2.5 });
    d = setRun(d, '2026-09-25', { minutes: 20 }); // прошлая неделя
    expect(weekCounts(d, FRI)).toEqual({ workouts: 2, runs: 1 });
    expect(weekCounts(d, '2026-10-05')).toEqual({ workouts: 0, runs: 0 });
  });

  it('отметку пробежки можно снять', () => {
    const d = setRun(defaultData(), FRI, { minutes: 25 });
    expect(weekCounts(removeRun(d, FRI), FRI).runs).toBe(0);
  });

  it('вес и изменение за 7 дней', () => {
    let d = addBodyWeight(defaultData(), '2026-09-20', 162);
    d = addBodyWeight(d, '2026-09-25', 161.4);
    d = addBodyWeight(d, SAT, 160.6);
    expect(weightTrend(d.bodyWeight, SUN)).toEqual({ value: 160.6, date: SAT, change: -0.8 }); // база — 25 сен (≤ 27 сен)
    expect(weightTrend(d.bodyWeight, '2026-09-27')).toEqual({ value: 161.4, date: '2026-09-25', change: -0.6 });
    expect(weightTrend(addBodyWeight(defaultData(), SAT, 160).bodyWeight, SUN)).toEqual({ value: 160, date: SAT, change: undefined });
    expect(weightTrend([], SUN)).toBeUndefined();
  });
});

describe('последняя тренировка', () => {
  it('выросшие рекорды: было → стало', () => {
    let d = withWorkout(defaultData(), 'tue', TUE);
    const last = lastSession(d)!;
    expect(recordGains(d, last)).toEqual([]);
    d = { ...d, records: { ...d.records, 'Жим лёжа в Смите': { weight: 80 } } };
    expect(recordGains(d, last)).toEqual(['Жим лёжа в Смите 75 lb → 80 lb']);
  });
});

describe('экспорт / импорт: еда, сон, пробежки', () => {
  it('экспорт → импорт сохраняет еду, сон и пробежки', () => {
    let d = toggleEaten(defaultData(), TUE, 'pre');
    d = setSwap(d, MON, 'lunch', 'chicken_rice');
    d = setSleep(d, SUN, { bed: '23:30', wake: '07:10', quality: 4 });
    d = setRun(d, WED, { minutes: 30, distanceMi: 2.5 });
    d = setRun(d, FRI, { minutes: 20 });
    const res = parseImport(exportData(d));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.food).toEqual(d.food);
    expect(res.data.sleep).toEqual(d.sleep);
    expect(res.data.runs).toEqual(d.runs);
  });

  it('старая копия без сна и пробежек импортируется с пустыми списками', () => {
    const { sleep, runs, ...rest } = defaultData();
    const res = parseImport(JSON.stringify(rest));
    expect(res.ok && res.data.sleep).toEqual({});
    expect(res.ok && res.data.runs).toEqual({});
  });

  it('битые записи сна и пробежек отбрасываются', () => {
    expect(
      sanitizeSleep({
        [SUN]: { bed: '23:30', wake: '07:10', quality: 4 },
        [SAT]: { bed: '25:00', wake: '07:00', quality: 3 },
        [FRI]: { bed: '23:00', wake: '07:00', quality: 6 },
        bad: { bed: '23:00', wake: '07:00', quality: 3 },
      }),
    ).toEqual({ [SUN]: { bed: '23:30', wake: '07:10', quality: 4 } });
    expect(sanitizeRuns({ [WED]: { minutes: 30, distanceMi: 0 }, [FRI]: { minutes: -5 }, x: { minutes: 3 } })).toEqual({
      [WED]: { minutes: 30 },
    });
  });
});
