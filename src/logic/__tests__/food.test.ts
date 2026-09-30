import { describe, expect, it } from '@jest/globals';
import { DISHES, SCHEDULE, SWAP_DISHES } from '../../data/food';
import { defaultData } from '../../store/defaults';
import type { AppData } from '../../types';
import {
  dayTotals,
  dayType,
  foodStats,
  formatMealTime,
  formatNum,
  hasPrep,
  isEaten,
  mealsFor,
  mealTime,
  nextMeal,
  prepCounts,
  prepPlan,
  resetMealTimes,
  salmonTomorrow,
  sanitizeFood,
  setPhoto,
  setSwap,
  shiftMealTime,
  toggleEaten,
  togglePrep,
} from '../food';
import { exportData, parseImport } from '../metrics';

const SUN = '2026-09-27';
const MON = '2026-09-28';
const TUE = '2026-09-29';
const WED = '2026-09-30';
const at = (h: number, m = 0) => h * 60 + m;

describe('тип дня и расписание', () => {
  it('Вт/Чт/Сб — день зала, остальные — обычный', () => {
    expect(['2026-09-29', '2026-10-01', '2026-10-03'].map(dayType)).toEqual(['gym', 'gym', 'gym']);
    expect([SUN, MON, WED, '2026-10-02'].map(dayType)).toEqual(['rest', 'rest', 'rest', 'rest']);
  });

  it('заготовка — только Вс и Ср', () => {
    expect([SUN, MON, TUE, WED].map(hasPrep)).toEqual([true, false, false, true]);
  });

  it('день зала: 5 приёмов, «После зала» — яичница + бутерброды, итого из блюд', () => {
    const meals = mealsFor(defaultData().food, TUE);
    expect(meals.map((m) => m.title)).toEqual(['До зала', 'После зала', 'Обед', 'Перекус', 'Ужин']);
    expect(meals[1].dishes).toEqual(['eggs', 'bacon_sandwich']);
    expect(meals[1].kcal).toBe(795);
    expect(meals[1].protein).toBe(47);
    expect(meals.map((m) => m.dishes[0])).toEqual(['yogurt', 'eggs', 'chicken_rice', 'meat_sandwich', 'salmon_rice']);
    expect(dayTotals(defaultData().food, TUE)).toMatchObject({ kcalTotal: 330 + 795 + 755 + 540 + 825, proteinTotal: 24 + 47 + 62 + 45 + 46 });
  });

  it('обычный день (Пн/Ср/Пт): паста, ужин — курица с рисом', () => {
    for (const day of [MON, WED, '2026-10-02']) {
      const meals = mealsFor(defaultData().food, day);
      expect(meals.map((m) => m.dishes[0])).toEqual(['granola', 'shake', 'pasta', 'meat_sandwich', 'chicken_rice']);
      expect(dayTotals(defaultData().food, day).kcalTotal).toBe(620 + 540 + 800 + 540 + 755);
    }
  });

  it('воскресенье: обед — курица с рисом, ужин — лосось', () => {
    const meals = mealsFor(defaultData().food, SUN);
    expect(meals.map((m) => m.dishes[0])).toEqual(['granola', 'shake', 'chicken_rice', 'meat_sandwich', 'salmon_rice']);
    expect(dayTotals(defaultData().food, SUN).kcalTotal).toBe(620 + 540 + 755 + 540 + 825);
  });

  it('новые блюда: курица с рисом 755/62 (филе, без бёдер), сэндвич с мясом 540/45, курицы-гриль нет', () => {
    expect(DISHES.chicken_rice).toMatchObject({ kcal: 755, protein: 62 });
    expect(DISHES.meat_sandwich).toMatchObject({ name: 'Сэндвич с мясом', kcal: 540, protein: 45 });
    expect('rotisserie_rice' in DISHES).toBe(false);
    expect(SWAP_DISHES).not.toContain('rotisserie_rice');
    expect(JSON.stringify(DISHES)).not.toMatch(/бёдр|бедр/);
  });

  it('количества в граммах: без мл, ложек и стаканов, у каждого ингредиента есть граммы', () => {
    const all = Object.values(DISHES).flatMap((d) => d.ingredients);
    for (const i of all) {
      expect(i).not.toMatch(/(^|\s)мл(\s|$)|ст\.\s*л|ч\.\s*л|стакан|горст/);
      if (i !== 'соль') expect(i).toMatch(/\d+ г(\s|\)|$)/);
    }
  });
});

describe('отметки, замены, суммы', () => {
  it('«Съел» отмечает, повторное нажатие снимает', () => {
    let d = toggleEaten(defaultData(), TUE, 'pre');
    expect(isEaten(d.food, TUE, 'pre')).toBe(true);
    expect(isEaten(d.food, WED, 'pre')).toBe(false);
    d = toggleEaten(d, TUE, 'pre');
    expect(isEaten(d.food, TUE, 'pre')).toBe(false);
    expect(d.food.eaten[TUE]).toBeUndefined();
  });

  it('суммы: отмеченные / все приёмы дня', () => {
    let d = toggleEaten(defaultData(), TUE, 'pre');
    d = toggleEaten(d, TUE, 'post');
    expect(dayTotals(d.food, TUE)).toEqual({
      eaten: 2,
      total: 5,
      kcalEaten: 330 + 795,
      kcalTotal: 330 + 795 + 755 + 540 + 825,
      proteinEaten: 24 + 47,
      proteinTotal: 24 + 47 + 62 + 45 + 46,
    });
  });

  it('замена действует только на свою дату и учитывается в суммах', () => {
    let d = setSwap(defaultData(), MON, 'lunch', 'salmon_rice');
    expect(mealsFor(d.food, MON)[2]).toMatchObject({ dishes: ['salmon_rice'], swapped: true, kcal: 825 });
    expect(mealsFor(d.food, '2026-10-05')[2].dishes).toEqual(['pasta']);
    expect(dayTotals(d.food, MON).kcalTotal).toBe(620 + 540 + 825 + 540 + 755);
    d = setSwap(d, MON, 'lunch', null);
    expect(mealsFor(d.food, MON)[2].swapped).toBe(false);
    expect(d.food.swaps[MON]).toBeUndefined();
  });

  it('чек-лист заготовки по датам', () => {
    let d = togglePrep(defaultData(), SUN, 'rice');
    expect(d.food.prep[SUN]).toEqual(['rice']);
    expect(d.food.prep[WED]).toBeUndefined();
    d = togglePrep(d, SUN, 'rice');
    expect(d.food.prep[SUN]).toBeUndefined();
  });
});

describe('заготовка из меню', () => {
  it('Вс (на Вс–Вт): филе 3, рис 5, паста 1, мясо 3', () => {
    expect(prepCounts(defaultData().food, SUN)).toEqual({ chicken: 3, rice: 5, pasta: 1, meat: 3 });
  });

  it('Ср (на Ср–Сб): филе 4, рис 6, паста 2, мясо 4', () => {
    expect(prepCounts(defaultData().food, WED)).toEqual({ chicken: 4, rice: 6, pasta: 2, meat: 4 });
  });

  it('пункты с количествами; лосося в заготовке нет', () => {
    const items = prepPlan(defaultData().food, SUN);
    expect(items.map((i) => i.id)).toEqual(['rice', 'chicken', 'pasta', 'meat']);
    expect(items[0].title).toBe('Рис: 5 × 80 г = 400 г');
    expect(items[0].text).toContain('600 г воды');
    expect(items[1].title).toBe('Куриное филе: 3 × 230 г = 690 г');
    expect(items[1].text).toContain('3 порц. по 170 г');
    expect(items[2].text).toContain('100 г пасты + 150 г фарша');
    expect(items[2].text).toContain('маринара 120 г');
    expect(items[3].title).toBe('Мясо для сэндвичей: 3 × 120 г = 360 г');
    expect(JSON.stringify(items)).not.toMatch(/лосос/i);
  });

  it('замены учитываются, пустые пункты не показываются', () => {
    let d = defaultData();
    for (const [day, slot] of [[SUN, 'snack2'], [MON, 'snack2'], [TUE, 'snack']] as const) d = setSwap(d, day, slot, 'yogurt');
    d = setSwap(d, MON, 'lunch', 'chicken_rice');
    expect(prepCounts(d.food, SUN)).toEqual({ chicken: 4, rice: 6, pasta: 0, meat: 0 });
    expect(prepPlan(d.food, SUN).map((i) => i.id)).toEqual(['rice', 'chicken']);
    expect(prepPlan(d.food, MON)).toEqual([]);
  });

  it('напоминание про лосось — накануне дня с лососем', () => {
    const food = defaultData().food;
    // Лосось: Вт/Чт/Сб (день зала) и Вс → накануне: Пн, Ср, Пт, Сб.
    expect([MON, TUE, WED].map((d) => salmonTomorrow(food, d))).toEqual([true, false, true]);
    expect(salmonTomorrow(food, '2026-10-03')).toBe(true);
    expect(salmonTomorrow(setSwap(defaultData(), TUE, 'dinner', 'pasta').food, MON)).toBe(false);
  });
});

describe('время приёмов и ближайший приём', () => {
  it('своё время для типа дня, сброс', () => {
    let d = shiftMealTime(defaultData(), 'gym', 'pre', -30);
    expect(mealTime(d.food, 'gym', 'pre')).toBe('06:30');
    expect(mealTime(d.food, 'rest', 'breakfast')).toBe('08:00');
    expect(mealsFor(d.food, TUE)[0].time).toBe('06:30');
    d = shiftMealTime(d, 'gym', 'pre', 30);
    expect(d.food.times.gym).toEqual({});
    d = resetMealTimes(shiftMealTime(d, 'rest', 'dinner', 15));
    expect(d.food.times).toEqual({ gym: {}, rest: {} });
  });

  it('формат времени и чисел', () => {
    expect(formatMealTime('07:00')).toBe('~7:00');
    expect(formatMealTime('19:30')).toBe('~19:30');
    expect(formatNum(3320)).toBe('3 320');
    expect(formatNum(850)).toBe('850');
  });

  it('следующий — первый неотмеченный, не раньше чем час назад', () => {
    const food = defaultData().food;
    expect(nextMeal(food, MON, at(6))?.slot).toBe('breakfast');
    expect(nextMeal(food, MON, at(8, 50))?.slot).toBe('breakfast');
    expect(nextMeal(food, MON, at(9, 30))?.slot).toBe('snack1');
    expect(nextMeal(food, MON, at(13))?.slot).toBe('lunch');
  });

  it('отмеченные пропускаются; после последнего времени — последний неотмеченный', () => {
    let d: AppData = toggleEaten(defaultData(), MON, 'breakfast');
    expect(nextMeal(d.food, MON, at(7))?.slot).toBe('snack1');
    expect(nextMeal(d.food, MON, at(23))?.slot).toBe('dinner');
    d = toggleEaten(d, MON, 'dinner');
    expect(nextMeal(d.food, MON, at(23))?.slot).toBe('snack2');
    for (const s of SCHEDULE.rest) if (!isEaten(d.food, MON, s.id)) d = toggleEaten(d, MON, s.id);
    expect(nextMeal(d.food, MON, at(23))).toBeUndefined();
  });
});

describe('статистика за 7 дней', () => {
  it('отмечено из всех, средние ккал и белок в день', () => {
    let d = toggleEaten(defaultData(), TUE, 'pre'); // 330 / 24
    d = toggleEaten(d, MON, 'breakfast'); // 620 / 18
    d = toggleEaten(d, '2026-09-20', 'breakfast'); // вне 7 дней
    const s = foodStats(d.food, WED);
    expect(s.eaten).toBe(2);
    expect(s.total).toBe(35);
    expect(s.avgKcal).toBe(Math.round((330 + 620) / 7));
    expect(s.avgProtein).toBe(Math.round((24 + 18) / 7));
  });
});

describe('экспорт / импорт еды', () => {
  function sample(): AppData {
    let d = toggleEaten(defaultData(), TUE, 'pre');
    d = setSwap(d, MON, 'lunch', 'chicken_rice');
    d = togglePrep(d, SUN, 'rice');
    d = setPhoto(d, 'granola', 'file:///data/food-photos/granola-1.jpg');
    d = shiftMealTime(d, 'rest', 'breakfast', 15);
    return d;
  }

  it('экспорт → импорт сохраняет отметки, замены, заготовку, фото и время', () => {
    const d = sample();
    const res = parseImport(exportData(d));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.food).toEqual(d.food);
  });

  it('копия без еды импортируется с пустой едой', () => {
    const { food, ...rest } = sample();
    const res = parseImport(JSON.stringify(rest));
    expect(res.ok && res.data.food).toEqual(defaultData().food);
  });

  it('перенос: chicken_sandwich → meat_sandwich (замены и фото), курица-гриль → курица с рисом', () => {
    const food = sanitizeFood({
      eaten: { [MON]: ['snack2'] },
      swaps: { [MON]: { lunch: 'chicken_sandwich', dinner: 'rotisserie_rice' } },
      photos: { chicken_sandwich: 'file:///s.jpg', rotisserie_rice: 'file:///r.jpg' },
    });
    expect(food.eaten).toEqual({ [MON]: ['snack2'] });
    expect(food.swaps).toEqual({ [MON]: { lunch: 'meat_sandwich', dinner: 'chicken_rice' } });
    expect(food.photos).toEqual({ meat_sandwich: 'file:///s.jpg' });
    const res = parseImport(exportData({ ...defaultData(), food: { ...defaultData().food, photos: { chicken_sandwich: 'file:///s.jpg' } as never } }));
    expect(res.ok && res.data.food.photos).toEqual({ meat_sandwich: 'file:///s.jpg' });
  });

  it('битые записи еды отбрасываются', () => {
    const food = sanitizeFood({
      eaten: { [TUE]: ['pre', 5], bad: ['x'] },
      swaps: { [MON]: { lunch: 'pizza', dinner: 'pasta' } },
      photos: { granola: 'file:///a.jpg', pizza: 'file:///b.jpg' },
      times: { gym: { pre: '6:00', post: '09:45' }, rest: null },
    });
    expect(food.eaten).toEqual({ [TUE]: ['pre'] });
    expect(food.swaps).toEqual({ [MON]: { dinner: 'pasta' } });
    expect(food.photos).toEqual({ granola: 'file:///a.jpg' });
    expect(food.times).toEqual({ gym: { post: '09:45' }, rest: {} });
  });
});
