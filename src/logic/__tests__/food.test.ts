import { describe, expect, it } from '@jest/globals';
import { DISHES, PRODUCTS, SCHEDULE, SWAP_DISHES, type ProductId } from '../../data/food';
import { FOOD_IMAGES } from '../../data/foodImages';
import { defaultData } from '../../store/defaults';
import type { AppData } from '../../types';
import {
  dayTotals,
  dayType,
  foodStats,
  formatMealTime,
  formatNum,
  isEaten,
  mealsFor,
  mealTime,
  nextMeal,
  productTotals,
  recipeOf,
  setRecipe,
  standardRecipe,
  resetMealTimes,
  salmonTomorrow,
  sanitizeFood,
  setPhoto,
  setSwap,
  shiftMealTime,
  toggleEaten,
  weekProducts,
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

  it('у каждого блюда, кроме салата, есть ссылка на фото', () => {
    for (const id of Object.keys(DISHES).filter((d) => d !== 'salad')) {
      expect((FOOD_IMAGES as Record<string, string>)[id]).toMatch(/^https:\/\/live\.staticflickr\.com\/.+\.jpg$/);
    }
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

});

describe('продукты на неделю (SPEC_v3_2 §5.2)', () => {
  const NEXT_SUN = '2026-10-04';

  // Независимый подсчёт: ингредиенты всех приёмов недели (салат — у блюд с рисом).
  function expected(food: AppData['food']): Partial<Record<ProductId, number>> {
    const out: Partial<Record<ProductId, number>> = {};
    for (let i = 0; i < 7; i++) {
      const day = new Date(2026, 8, 28 + i);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      for (const m of mealsFor(food, key)) {
        for (const id of m.dishes) {
          for (const dish of DISHES[id].salad ? [id, 'salad' as const] : [id]) {
            for (const it of DISHES[dish].items) out[it.product] = (out[it.product] ?? 0) + it.g;
          }
        }
      }
    }
    return out;
  }

  it('продукты недели = сумма ингредиентов всех приёмов пн–вс', () => {
    const food = defaultData().food;
    const totals = productTotals(food, MON);
    expect(totals).toEqual(expected(food));
    expect(totals).toMatchObject({
      rice: 880,
      chicken: 1610,
      sandwich_meat: 840,
      salmon: 680,
      milk: 2280,
      bananas: 960,
      eggs: 600,
      bread: 700,
      pasta: 300,
      salad_mix: 1100,
    });
  });

  it('замены учитываются', () => {
    const d = setSwap(defaultData(), MON, 'lunch', 'salmon_rice');
    const totals = productTotals(d.food, MON);
    expect(totals).toEqual(expected(d.food));
    expect(totals).toMatchObject({ pasta: 200, rice: 960, salmon: 850 });
    // Замена на следующей неделе в эту неделю не попадает.
    expect(productTotals(setSwap(defaultData(), '2026-10-05', 'lunch', 'salmon_rice').food, MON).pasta).toBe(300);
  });

  it('группы по разделам, строки «Рис (сухой) — 880 г», штучное — количество и граммы', () => {
    const groups = weekProducts(defaultData().food, NEXT_SUN); // любой день недели
    expect(groups.map((g) => g.title)).toEqual(['Мясо и рыба', 'Молочное и яйца', 'Крупы и хлеб', 'Овощи и фрукты', 'Прочее']);
    const rows = Object.fromEntries(groups.flatMap((g) => g.rows).map((r) => [r.product, r.text]));
    expect(rows.rice).toBe('Рис (сухой) — 880 г');
    expect(rows.chicken).toBe(`Куриное филе (сырое) — ${formatNum(1610)} г`);
    expect(rows.milk).toBe(`Молоко — ${formatNum(2280)} г`);
    expect(rows.bananas).toBe('Бананы — 8 шт. (~960 г)');
    expect(rows.eggs).toBe('Яйца — 12 шт. (~600 г)');
    for (const g of groups) {
      expect(g.rows.every((r) => PRODUCTS[r.product].section === g.section)).toBe(true);
      expect(g.rows.map((r) => r.name)).toEqual([...g.rows.map((r) => r.name)].sort((a, b) => a.localeCompare(b, 'ru')));
    }
  });

  it('граммы продуктов блюда совпадают с ингредиентами блюда', () => {
    for (const dish of Object.values(DISHES)) {
      const text = dish.ingredients.join(' | ');
      for (const it of dish.items) expect(text).toMatch(new RegExp(`(^|[^\\d])${it.g} г`));
      expect(dish.items.length).toBe(dish.ingredients.filter((i) => i !== 'соль').length);
    }
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
    d = setRecipe(d, 'pasta', 'Своя паста');
    d = setPhoto(d, 'granola', 'file:///data/food-photos/granola-1.jpg');
    d = shiftMealTime(d, 'rest', 'breakfast', 15);
    return d;
  }

  it('экспорт → импорт сохраняет отметки, замены, фото, рецепты и время', () => {
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

describe('свой рецепт (SPEC_v3_2 §5.3)', () => {
  it('без своего — стандартные шаги блюда (у блюд с рисом — и салат)', () => {
    expect(recipeOf(defaultData().food, 'granola')).toEqual({
      text: '1. Мюсли в миску\n2. Залить молоком\n3. Сверху нарезанный банан',
      custom: false,
    });
    expect(standardRecipe('chicken_rice')).toContain('Салат: нарезать, заправить');
  });

  it('рецепт хранится по блюду и виден у этого блюда в другой день и другом приёме', () => {
    const d = setRecipe(defaultData(), 'chicken_rice', '  Курица 250 г, рис 90 г\nЗапечь  ');
    expect(d.food.recipes).toEqual({ chicken_rice: 'Курица 250 г, рис 90 г\nЗапечь' });
    // Пн — ужин, Вс — обед: одно блюдо, один рецепт.
    const mon = mealsFor(d.food, MON).find((m) => m.dishes.includes('chicken_rice'))!;
    const sun = mealsFor(d.food, SUN).find((m) => m.dishes.includes('chicken_rice'))!;
    expect(mon.slot).toBe('dinner');
    expect(sun.slot).toBe('lunch');
    for (const id of [...mon.dishes, ...sun.dishes]) expect(recipeOf(d.food, id)).toEqual({ text: 'Курица 250 г, рис 90 г\nЗапечь', custom: true });
    expect(recipeOf(d.food, 'salmon_rice').custom).toBe(false);
  });

  it('«Вернуть стандартный» и пустой текст удаляют свой рецепт', () => {
    let d = setRecipe(defaultData(), 'pasta', 'Своя');
    d = setRecipe(d, 'pasta', null);
    expect(d.food.recipes).toEqual({});
    expect(setRecipe(defaultData(), 'pasta', '   ').food.recipes).toEqual({});
  });

  it('экспорт → импорт сохраняет рецепты; битые отбрасываются, старые id переносятся', () => {
    const d = setRecipe(defaultData(), 'meat_sandwich', 'Мой сэндвич');
    const res = parseImport(exportData(d));
    expect(res.ok && res.data.food.recipes).toEqual({ meat_sandwich: 'Мой сэндвич' });
    expect(sanitizeFood({ recipes: { pizza: 'x', pasta: 5, granola: ' ', chicken_sandwich: 'Старый' } }).recipes).toEqual({
      meat_sandwich: 'Старый',
    });
  });
});

describe('своё фото (SPEC_v3_2 §5.4)', () => {
  it('фото хранится по блюду: видно у этого блюда во всех приёмах и днях, переживает экспорт/импорт', () => {
    const uri = 'file:///data/food-photos/chicken_rice-1.jpg';
    const d = setPhoto(defaultData(), 'chicken_rice', uri);
    const meals = [MON, TUE, SUN].flatMap((day) => mealsFor(d.food, day)).filter((m) => m.dishes.includes('chicken_rice'));
    expect(meals.length).toBeGreaterThanOrEqual(3);
    for (const m of meals) expect(d.food.photos[m.dishes[0]]).toBe(uri);
    expect(d.food.photos.salmon_rice).toBeUndefined();
    const res = parseImport(exportData(d));
    expect(res.ok && res.data.food.photos).toEqual({ chicken_rice: uri });
    expect(setPhoto(d, 'chicken_rice', null).food.photos).toEqual({});
  });
});
