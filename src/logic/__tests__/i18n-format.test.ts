import { afterEach, describe, expect, it } from '@jest/globals';
import { cleanDecimal, inputNum, pluralForm, pluralFormFallback, setLang, tp } from '../../i18n';
import type { Lang } from '../../types';
import { mealTitle } from '../../i18n/content';
import { defaultData } from '../../store/defaults';
import { mealsFor } from '../food';
import { formatDay, formatShortDay, weekdayOf } from '../format';
import { dayLabel, daysAgo, monthGrid } from '../home';
import { distanceUnit, lengthUnit, setUnits, weightUnit } from '../units';

afterEach(() => {
  setLang('ru');
  setUnits('imperial');
});

const NO_DATA = { sessions: [], runs: {} };
// 2026-10-01 — четверг.
const TODAY = '2026-10-01';

describe('календарь и даты — на языке приложения', () => {
  it('заголовок месяца календаря «Активность»', () => {
    const titles = (['ru', 'en', 'uk'] as Lang[]).map((lang) => {
      setLang(lang);
      return monthGrid(NO_DATA, '2026-09', TODAY).title;
    });
    expect(titles).toEqual(['Сентябрь 2026', 'September 2026', 'Вересень 2026']);
  });

  it('при смене языка тот же месяц пересчитывается (нет «Сентябрь 2026» в английском)', () => {
    const ru = monthGrid(NO_DATA, '2026-10', TODAY);
    setLang('en');
    const en = monthGrid(NO_DATA, '2026-10', TODAY);
    expect([ru.title, en.title]).toEqual(['Октябрь 2026', 'October 2026']);
    // Сетка от языка не зависит: неделя с понедельника, 1 сентября 2026 — вторник.
    expect(monthGrid(NO_DATA, '2026-09', TODAY).weeks[0][0]).toBeNull();
    expect(monthGrid(NO_DATA, '2026-09', TODAY).weeks[0][1]?.date).toBe(1);
  });

  it('дата, короткая дата, день недели', () => {
    const at = (lang: Lang) => {
      setLang(lang);
      return [formatDay('2026-09-28'), formatShortDay('2026-09-28'), weekdayOf(3)];
    };
    expect(at('ru')).toEqual(['28 сен 2026', '28 сен', 'Среда']);
    expect(at('en')).toEqual(['Sep 28, 2026', 'Sep 28', 'Wednesday']);
    expect(at('uk')).toEqual(['28 вер 2026', '28 вер', 'Середа']);
  });

  it('«Сегодня / Завтра / день недели» на плитках «Главной»', () => {
    const at = (lang: Lang) => {
      setLang(lang);
      return [dayLabel(TODAY, TODAY), dayLabel('2026-10-02', TODAY), dayLabel('2026-10-03', TODAY)];
    };
    expect(at('ru')).toEqual(['Сегодня', 'Завтра', 'Сб']);
    expect(at('en')).toEqual(['Today', 'Tomorrow', 'Sat']);
    expect(at('uk')).toEqual(['Сьогодні', 'Завтра', 'Сб']);
  });

  it('«N дней назад» со склонением', () => {
    const at = (lang: Lang) => {
      setLang(lang);
      return ['2026-09-30', '2026-09-28', '2026-09-26', '2026-09-10'].map((d) => daysAgo(d, TODAY));
    };
    expect(at('ru')).toEqual(['вчера', '3 дня назад', '5 дней назад', '21 день назад']);
    expect(at('en')).toEqual(['yesterday', '3 days ago', '5 days ago', '21 days ago']);
    expect(at('uk')).toEqual(['учора', '3 дні тому', '5 днів тому', '21 день тому']);
  });
});

describe('множественное число (Intl.PluralRules)', () => {
  const counts = [1, 2, 5, 11, 21, 22, 25, 101];

  it('ru: тренировка / тренировки / тренировок', () => {
    expect(counts.map((n) => tp('count.workouts', n))).toEqual([
      '1 тренировка',
      '2 тренировки',
      '5 тренировок',
      '11 тренировок',
      '21 тренировка',
      '22 тренировки',
      '25 тренировок',
      '101 тренировка',
    ]);
  });

  it('uk: тренування / тренувань', () => {
    setLang('uk');
    expect(counts.map((n) => tp('count.workouts', n))).toEqual([
      '1 тренування',
      '2 тренування',
      '5 тренувань',
      '11 тренувань',
      '21 тренування',
      '22 тренування',
      '25 тренувань',
      '101 тренування',
    ]);
    expect([1, 3, 5].map((n) => tp('count.exercises', n))).toEqual(['1 вправа', '3 вправи', '5 вправ']);
  });

  it('en: workout / workouts', () => {
    setLang('en');
    expect([0, 1, 2, 5, 21].map((n) => tp('count.workouts', n))).toEqual(['0 workouts', '1 workout', '2 workouts', '5 workouts', '21 workouts']);
    expect([1, 2].map((n) => tp('count.dishes', n))).toEqual(['1 dish', '2 dishes']);
  });

  it('дробные числа: ru/uk — форма «other», число — по языку', () => {
    expect(pluralForm(1.5, 'ru')).toBe('other');
    expect(tp('days', 1.5)).toBe('1,5 дня');
    setLang('en');
    expect(tp('days', 1.5)).toBe('1.5 days');
  });

  it('категории совпадают с Intl.PluralRules; запасной вариант (без Intl) даёт те же формы', () => {
    for (const lang of ['ru', 'uk', 'en'] as Lang[]) {
      const intl = new Intl.PluralRules(lang);
      for (let n = 0; n <= 125; n++) {
        const expected = intl.select(n);
        expect([lang, n, pluralForm(n, lang)]).toEqual([lang, n, expected]);
        expect([lang, n, pluralFormFallback(n, lang)]).toEqual([lang, n, expected]);
      }
    }
  });
});

describe('стандартные названия приёмов и числа в полях ввода', () => {
  it('стартовое расписание — на языке приложения, своё название — как ввели', () => {
    const food = defaultData().food;
    setLang('en');
    expect(mealsFor(food, '2026-10-01').map((m) => m.title)).toEqual(['Pre-workout', 'Post-workout', 'Lunch', 'Snack', 'Dinner']);
    setLang('uk');
    expect(mealsFor(food, '2026-10-01').map((m) => m.title)).toEqual(['Перед залом', 'Після залу', 'Обід', 'Перекус', 'Вечеря']);
    expect(mealTitle('Второй завтрак')).toBe('Второй завтрак');
  });

  it('десятичный разделитель в полях: «161,3» (ru/uk) / «161.3» (en); ввод принимает оба', () => {
    expect([inputNum(161.3), inputNum(undefined), cleanDecimal('161.3'), cleanDecimal('1a6,5')]).toEqual(['161,3', '', '161,3', '16,5']);
    setLang('en');
    expect([inputNum(161.3), cleanDecimal('161,3')]).toEqual(['161.3', '161.3']);
  });

  it('подписи единиц: метрические — по языку, lb / in / mi — латиницей', () => {
    const at = (lang: Lang) => {
      setLang(lang);
      setUnits('metric');
      const metric = [weightUnit(), lengthUnit(), distanceUnit()];
      setUnits('imperial');
      return [...metric, weightUnit(), lengthUnit(), distanceUnit()];
    };
    expect(at('ru')).toEqual(['кг', 'см', 'км', 'lb', 'in', 'mi']);
    expect(at('uk')).toEqual(['кг', 'см', 'км', 'lb', 'in', 'mi']);
    expect(at('en')).toEqual(['kg', 'cm', 'km', 'lb', 'in', 'mi']);
  });
});
