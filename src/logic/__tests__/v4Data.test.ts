import { defaultData } from '../../store/defaults';
import { migrateData } from '../../store/migrate';
import { mealsFor, toggleEaten } from '../food';
import {
  addActivity,
  addBatch,
  addBodyFlag,
  addFact,
  eatenTotals,
  itemFromProduct,
  legsFatigue,
  makeBatch,
  makeFact,
  nutritionTarget,
  portionItem,
  recentExcessFat,
  sanitizeV4,
  setNutrition,
  trendSummary,
  waistStatus,
  weightTrend,
} from '../v4';

const TUE = '2026-10-20';

describe('nutrition v4', () => {
  test('product facts are computed from grams', () => {
    const d = defaultData();
    const rice = itemFromProduct(d.food, 'rice', 150);
    expect(rice.kcal).toBe(540);
    expect(rice.protein).toBe(10.1);
  });

  test('cooked batch: water changes weight, not calories (no double counting)', () => {
    const d = defaultData();
    const b = makeBatch(TUE, 'Рис с яйцом', [itemFromProduct(d.food, 'rice', 150), itemFromProduct(d.food, 'eggs', 40)], 170);
    expect(b.kcal).toBe(540 + 57);
    const all = portionItem(b, 170);
    expect(all.kcal).toBe(b.kcal); // весь котелок = сумма сырых продуктов, а не «170 г риса + 40 г яйца»
    expect(portionItem(b, 85).kcal).toBe(Math.round(b.kcal / 2));
  });

  test('a fact replaces the template of its meal slot', () => {
    let d = defaultData();
    const slot = mealsFor(d.food, TUE)[0];
    d = toggleEaten(d, TUE, slot.slot);
    expect(eatenTotals(d, TUE).kcal).toBe(slot.kcal);
    d = addFact(d, makeFact(TUE, slot.title, [itemFromProduct(d.food, 'greek_yogurt', 300)], { slot: slot.slot }));
    expect(eatenTotals(d, TUE).kcal).toBe(219);
    // Повторная запись того же приёма заменяет прежнюю.
    d = addFact(d, makeFact(TUE, slot.title, [itemFromProduct(d.food, 'greek_yogurt', 100)], { slot: slot.slot }));
    expect(d.v4.facts).toHaveLength(1);
    expect(eatenTotals(d, TUE).kcal).toBe(73);
  });

  test('target follows mode and protein setting', () => {
    let d = defaultData();
    d = { ...d, bodyWeight: [{ id: '1', date: TUE, value: 158.8 }] };
    const fast = nutritionTarget(d, TUE);
    expect(fast.protein).toBe(150);
    expect(fast.kcal).toBe(fast.maintenance + 500);
    d = setNutrition(d, { mode: 'lean_gain', proteinG: 145 });
    expect(nutritionTarget(d, TUE).kcal).toBe(fast.maintenance + 250);
    expect(nutritionTarget(d, TUE).protein).toBe(145);
    d = setNutrition(d, { kcalOverride: 3300 });
    expect(nutritionTarget(d, TUE).kcal).toBe(3300);
  });
});

describe('body v4', () => {
  test('trend smooths single-day noise', () => {
    const entries = [
      { id: 'a', date: '2026-10-01', value: 158 },
      { id: 'b', date: '2026-10-02', value: 163 },
      { id: 'c', date: '2026-10-03', value: 158 },
    ];
    const t = weightTrend(entries);
    expect(t[1].trend).toBeLessThan(159);
    expect(trendSummary(entries, '2026-10-03').trend).toBeLessThan(159);
  });

  test('weekly change uses the trend', () => {
    const entries = Array.from({ length: 15 }, (_, i) => ({ id: String(i), date: `2026-10-${String(i + 1).padStart(2, '0')}`, value: 158 + i * 0.1 }));
    const s = trendSummary(entries, '2026-10-15');
    expect(s.weekly).toBeGreaterThan(0);
  });

  test('waist is due weekly', () => {
    expect(waistStatus([], TUE).due).toBe(true);
    expect(waistStatus([{ id: '1', date: '2026-10-18', waist: 29 }], TUE).due).toBe(false);
    expect(waistStatus([{ id: '1', date: '2026-10-10', waist: 29 }], TUE).due).toBe(true);
  });

  test('excess fat flag is recent for 14 days', () => {
    const d = addBodyFlag(defaultData(), '2026-10-10');
    expect(recentExcessFat(d, TUE)).toBe(true);
    expect(recentExcessFat(d, '2026-10-30')).toBe(false);
    expect(nutritionTarget(d, TUE).excessFat).toBe(true);
  });
});

describe('activities v4', () => {
  test('heavy volleyball loads legs for 48 h and duplicates merge', () => {
    let d = addActivity(defaultData(), { date: '2026-10-19', type: 'volleyball', minutes: 90, rpe: 8, legs: true });
    d = addActivity(d, { date: '2026-10-19', type: 'volleyball', minutes: 92, rpe: 8, legs: true });
    expect(d.v4.activities).toHaveLength(1);
    expect(legsFatigue(d, TUE)?.type).toBe('volleyball');
    expect(legsFatigue(d, '2026-10-23')).toBeUndefined();
  });
});

describe('v4 data persistence', () => {
  test('sanitize drops broken entries and keeps valid ones', () => {
    const v = sanitizeV4({
      nutrition: { mode: 'lean_gain', proteinG: 140 },
      facts: [{ id: 'f', date: TUE, title: 'Обед', items: [{ name: 'Рис', g: 150, kcal: 540, protein: 10 }] }, { id: 'x' }],
      activities: [{ id: 'a', date: TUE, type: 'volleyball', minutes: 60, legs: true }, { id: 'b', type: 'nope' }],
      bodyFlags: [{ id: 'b', date: TUE, kind: 'excess_fat' }],
    });
    expect(v.nutrition).toEqual({ mode: 'lean_gain', proteinG: 140 });
    expect(v.facts).toHaveLength(1);
    expect(v.facts[0].kcal).toBe(540);
    expect(v.activities).toHaveLength(1);
    expect(v.bodyFlags).toHaveLength(1);
    expect(sanitizeV4(undefined).nutrition.mode).toBe('fast_gain');
  });

  test('saved data survives a reload', () => {
    let d = defaultData();
    d = addBatch(d, makeBatch(TUE, 'Курица', [itemFromProduct(d.food, 'chicken', 500)], 380));
    d = addActivity(d, { date: TUE, type: 'run', minutes: 30, legs: true });
    const m = migrateData(JSON.parse(JSON.stringify(d)));
    expect(m.v4.batches[0].outputG).toBe(380);
    expect(m.v4.activities[0].type).toBe('run');
  });
});
