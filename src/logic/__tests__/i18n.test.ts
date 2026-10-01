import { afterEach, describe, expect, it } from '@jest/globals';
import { getExercise, getVariant, PROGRAM } from '../../data/program';
import { DICTS, formatNumber, LANGS, pluralForm, setLang, t, tp } from '../../i18n';
import { dishName, exerciseTitle, productName, templateName, variantCue, variantName } from '../../i18n/content';
import { defaultData } from '../../store/defaults';
import { formatAge, formatDate, formatDay } from '../format';
import { ingredientLines, recipeOf, saveDish, weekProducts } from '../food';
import { plannedReminders } from '../reminders';
import { exportData, parseImport } from '../metrics';
import { runReport } from '../report';

afterEach(() => setLang('ru'));

describe('словари (SPEC_v3_3 §D2)', () => {
  it('во всех трёх словарях одинаковый набор ключей', () => {
    const ru = Object.keys(DICTS.ru).sort();
    for (const lang of LANGS) expect(Object.keys(DICTS[lang]).sort()).toEqual(ru);
  });

  it('пустых значений нет', () => {
    for (const lang of LANGS) {
      for (const [key, value] of Object.entries(DICTS[lang])) {
        expect([lang, key, value.trim().length > 0]).toEqual([lang, key, true]);
      }
    }
  });

  it('параметры {…} в переводах те же, что в русском', () => {
    const params = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    for (const lang of LANGS) {
      for (const [key, value] of Object.entries(DICTS.ru)) {
        expect([lang, key, params((DICTS[lang] as Record<string, string>)[key])]).toEqual([lang, key, params(value)]);
      }
    }
  });
});

describe('язык: интерфейс, даты, числа, множественное число', () => {
  it('t() и смена языка без перезапуска', () => {
    expect(t('tabs.food')).toBe('Еда');
    setLang('en');
    expect(t('tabs.food')).toBe('Food');
    setLang('uk');
    expect(t('tabs.food')).toBe('Їжа');
    expect(t('control.exercise', { current: 2, total: 6 })).toBe('Вправа 2 з 6');
  });

  it('даты по языку', () => {
    expect(formatDay('2026-09-28')).toBe('28 сен 2026');
    expect(formatDate(new Date(2026, 8, 28, 12).toISOString())).toBe('28 сен 2026');
    setLang('en');
    expect(formatDay('2026-09-28')).toBe('Sep 28, 2026');
    setLang('uk');
    expect(formatDay('2026-09-28')).toBe('28 вер 2026');
  });

  it('числа по языку: разделители тысяч и дробной части', () => {
    expect(formatNumber(3320.5)).toBe('3\u00A0320,5');
    expect(formatNumber(3320.5, 1, 'en')).toBe('3,320.5');
    expect(formatNumber(-2.25, 1, 'uk')).toBe('−2,3');
  });

  it('множественное число: ru/uk — 3 формы, en — 2', () => {
    expect([1, 2, 5, 11, 21, 22, 25].map((n) => pluralForm(n, 'ru'))).toEqual(['one', 'few', 'many', 'many', 'one', 'few', 'many']);
    expect([1, 2, 5].map((n) => pluralForm(n, 'en'))).toEqual(['one', 'other', 'other']);
    expect(formatAge(22)).toBe('22 года');
    expect(tp('days', 21)).toBe('21 день');
    setLang('en');
    expect(formatAge(22)).toBe('22 years');
    setLang('uk');
    expect(tp('days', 3)).toBe('3 дні');
  });
});

describe('стандартный контент переводится, свой — нет', () => {
  it('упражнения, подсказки, тренировки', () => {
    const ex = getExercise('sat1');
    const v = getVariant(ex, 'machine');
    setLang('en');
    expect(variantName(v)).toBe('Leg press');
    expect(exerciseTitle(ex)).toBe('Legs (quads)');
    expect(variantCue(ex, v)).toBe('Feet shoulder-width apart, lower back pressed to the pad. Knee no lower than 90°, not caving in; if it hurts — lower the weight.');
    expect(templateName(PROGRAM[0])).toBe('Chest and shoulders');
    setLang('ru');
    expect(variantCue(ex, v)).toBe(v.cue);
  });

  it('стандартные блюда, ингредиенты, продукты и рецепты; своё блюдо — как ввели', () => {
    const d = defaultData();
    setLang('en');
    expect(dishName(d.food.dishes.granola)).toBe('Muesli with milk and banana');
    expect(ingredientLines(d.food, d.food.dishes.granola)[0]).toBe('80 g muesli');
    expect(recipeOf(d.food, 'granola').text).toBe('1. Muesli into a bowl\n2. Pour in the milk\n3. Top with sliced banana');
    expect(productName('rice', undefined)).toBe('Rice (dry)');
    expect(weekProducts(d.food, '2026-09-28').map((g) => g.title)).toContain('Meat and fish');
    const own = saveDish(d, null, { name: 'Мой омлет', items: [{ product: 'eggs', g: 100 }], kcal: 200, protein: 12, salad: false });
    expect(dishName(own.data.food.dishes[own.id])).toBe('Мой омлет');
    expect(ingredientLines(own.data.food, own.data.food.dishes[own.id])).toEqual(['Eggs — 2 pcs (~100\u00A0g)']);
  });

  it('уведомления и отчёт по тренировке — на языке приложения', () => {
    setLang('en');
    expect(plannedReminders(defaultData().reminders).map((r) => r.body)).toEqual([
      'Bedtime in 30 minutes. Wake-up at 5:00',
      'Today: Chest and shoulders. Gym at 6:00',
      'Today: Back and arms. Gym at 6:00',
      'Today: Legs and upper body. Gym at 6:00',
    ]);
    const r = runReport('2026-09-30', { minutes: 28, distanceMi: 3 });
    expect(r.markdown).toContain('# Run');
    expect(r.markdown).toContain('- Date: Sep 30, 2026');
    expect(r.markdown).toContain('- Pace: 9:20\u00A0min/mi');
  });
});

describe('настройки приложения (SPEC_v3_3 §D1)', () => {
  it('по умолчанию — русский и имперские; входят в экспорт/импорт, неверные — по умолчанию', () => {
    const d = defaultData();
    expect(d.settings).toEqual({ lang: 'ru', units: 'imperial' });
    const res = parseImport(exportData({ ...d, settings: { lang: 'uk', units: 'metric' } }));
    expect(res.ok && res.data.settings).toEqual({ lang: 'uk', units: 'metric' });
    const raw = JSON.parse(exportData(d));
    raw.settings = { lang: 'de', units: 'stone' };
    const bad = parseImport(JSON.stringify(raw));
    expect(bad.ok && bad.data.settings).toEqual({ lang: 'ru', units: 'imperial' });
  });
});
