import { describe, expect, it } from '@jest/globals';
import { defaultData } from '../../store/defaults';
import type { AppData, TemplateId } from '../../types';
import { setSwap, toggleEaten } from '../food';
import {
  dayLabel,
  daysAgo,
  finishedOn,
  homeDayType,
  lastSession,
  monthGrid,
  monthTitle,
  shiftMonth,
  nextWorkout,
  recordGains,
  templateForDay,
  weekCounts,
  weekStart,
  weightTrend,
} from '../home';
import { addBodyWeight, exportData, parseImport } from '../metrics';
import { buildSession, finishActive, startWorkout } from '../session';
import {
  formatSleep,
  formatSleepClock,
  garminAverage,
  minutesBetween,
  removeRun,
  removeSleep,
  sanitizeRuns,
  sanitizeSleep,
  setRun,
  setSleep,
  sleepAverage,
  sleepScore,
} from '../sleep';

const MON = '2026-09-28';
const TUE = '2026-09-29';
const WED = '2026-09-30';
const THU = '2026-10-01';
const FRI = '2026-10-02';
const SAT = '2026-10-03';
const SUN = '2026-10-04';

// Тренировка по шаблону, завершённая в локальное время дня `day`.
function withWorkout(d: AppData, id: TemplateId, day: string, hour = 10): AppData {
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
  it('длительность «лёг → встал» через полночь, формат', () => {
    expect(minutesBetween('23:30', '07:10')).toBe(460);
    expect(minutesBetween('00:30', '08:00')).toBe(450);
    expect(formatSleep(460)).toBe('7 ч 40 мин');
    expect(formatSleep(480)).toBe('8 ч');
    expect(formatSleep(45)).toBe('45 мин');
    expect(formatSleepClock(390)).toBe('6:30');
    expect(formatSleepClock(425)).toBe('7:05');
  });

  it('среднее за 7/30 дней по длительности и средняя оценка Garmin', () => {
    let d = setSleep(defaultData(), SUN, { minutes: 480, garmin: 80 });
    d = setSleep(d, FRI, { minutes: 420 });
    d = setSleep(d, THU, { minutes: 390, garmin: 70 });
    d = setSleep(d, '2026-09-27', { minutes: 840, garmin: 20 }); // 8 дней назад
    expect(sleepAverage(d.sleep, SUN, 7)).toBe(430);
    expect(sleepAverage(d.sleep, SUN, 30)).toBe(Math.round((480 + 420 + 390 + 840) / 4));
    expect(garminAverage(d.sleep, SUN, 7)).toBe(75);
    expect(garminAverage(d.sleep, SUN, 30)).toBe(Math.round((80 + 70 + 20) / 3));
    expect(sleepAverage(defaultData().sleep, SUN, 7)).toBeUndefined();
    expect(garminAverage(setSleep(defaultData(), SUN, { minutes: 400 }).sleep, SUN, 7)).toBeUndefined();
  });

  it('оценка: Garmin, у старых записей — качество 1–5', () => {
    expect(sleepScore({ minutes: 400, garmin: 82 })).toBe('Garmin 82');
    expect(sleepScore({ minutes: 400, quality: 4 })).toBe('качество 4/5');
    expect(sleepScore({ minutes: 400 })).toBe('');
  });

  it('запись можно исправить и удалить', () => {
    let d = setSleep(defaultData(), SUN, { minutes: 480 });
    d = setSleep(d, SUN, { minutes: 460, garmin: 75, bed: '23:30', wake: '07:10' });
    expect(d.sleep[SUN]).toEqual({ minutes: 460, garmin: 75, bed: '23:30', wake: '07:10' });
    expect(removeSleep(d, SUN).sleep).toEqual({});
  });

  it('перенос старых записей v3: длительность из «лёг/встал», качество сохраняется', () => {
    expect(sanitizeSleep({ [SUN]: { bed: '23:30', wake: '07:10', quality: 4 } })).toEqual({
      [SUN]: { minutes: 460, bed: '23:30', wake: '07:10', quality: 4 },
    });
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

  it('баг v3: тренировка A в понедельник текущей недели → 1 из 3', () => {
    const d = withWorkout(defaultData(), 'A', MON);
    expect(weekCounts(d, WED).workouts).toBe(1);
    expect(weekCounts(d, SUN).workouts).toBe(1);
    expect(weekCounts(d, '2026-10-05').workouts).toBe(0);
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
    expect(recordGains(d, last)).toEqual(['Жим лёжа в Смите 75\u00A0lb → 80\u00A0lb']);
  });
});

describe('экспорт / импорт: еда, сон, пробежки', () => {
  it('экспорт → импорт сохраняет еду, сон и пробежки', () => {
    let d = toggleEaten(defaultData(), TUE, 'pre');
    d = setSwap(d, MON, 'lunch', 'chicken_rice');
    d = setSleep(d, SUN, { minutes: 460, garmin: 82, bed: '23:30', wake: '07:10' });
    d = setSleep(d, SAT, { minutes: 400, quality: 3 });
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
        [SUN]: { minutes: 460, garmin: 82 },
        [SAT]: { bed: '25:00', wake: '07:00' },
        [FRI]: { minutes: 420, garmin: 140, quality: 9 },
        [THU]: { minutes: 0 },
        bad: { minutes: 400 },
      }),
    ).toEqual({ [SUN]: { minutes: 460, garmin: 82 }, [FRI]: { minutes: 420 } });
    expect(sanitizeRuns({ [WED]: { minutes: 30, distanceMi: 0 }, [FRI]: { minutes: -5 }, x: { minutes: 3 } })).toEqual({
      [WED]: { minutes: 30 },
    });
  });
});

describe('плитки «Главной»', () => {
  it('«Сегодня» / «Завтра» / день недели; «N дней назад»', () => {
    expect([dayLabel(WED, WED), dayLabel(THU, WED), dayLabel(SAT, WED)]).toEqual(['Сегодня', 'Завтра', 'Сб']);
    expect([daysAgo(WED, WED), daysAgo(TUE, WED), daysAgo(MON, THU), daysAgo('2026-09-25', WED)]).toEqual([
      'сегодня',
      'вчера',
      '3 дня назад',
      '5 дней назад',
    ]);
    expect(daysAgo('2026-09-09', WED)).toBe('21 день назад');
  });

  it('календарь месяца: недели пн–вс, тренировка или пробежка — активный день, сегодня и будущие', () => {
    let d = withWorkout(defaultData(), 'tue', TUE);
    d = setRun(d, WED, { minutes: 30 });
    const grid = monthGrid(d, '2026-09', THU);
    expect(grid.title).toBe('Сентябрь 2026');
    expect(grid.weeks).toHaveLength(5);
    expect(grid.weeks.every((w) => w.length === 7)).toBe(true);
    expect(grid.weeks[0][0]).toBeNull(); // 1 сентября 2026 — вторник
    expect(grid.weeks[0][1]).toMatchObject({ day: '2026-09-01', date: 1 });
    const cells = grid.weeks.flat().filter((c) => c != null);
    expect(cells).toHaveLength(30);
    const byDay = Object.fromEntries(cells.map((c) => [c!.day, c!]));
    expect(byDay[TUE]).toMatchObject({ active: true, today: false, future: false });
    expect(byDay[WED]).toMatchObject({ active: true });
    expect(byDay[MON].active).toBe(false);

    const oct = monthGrid(d, '2026-10', THU);
    const first = oct.weeks[0].filter((c) => c != null);
    expect(oct.weeks[0][3]).toMatchObject({ day: THU, today: true, future: false, active: false });
    expect(first.find((c) => c!.day === FRI)?.future).toBe(true);
  });

  it('переключение месяцев и заголовок', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(monthTitle('2026-10')).toBe('Октябрь 2026');
  });
});
