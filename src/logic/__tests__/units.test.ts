import { afterEach, describe, expect, it } from '@jest/globals';
import { getExercise, getVariant } from '../../data/program';
import { defaultData } from '../../store/defaults';
import type { ExerciseLog } from '../../types';
import { formatDistance, formatHeight, formatLength, formatWeight } from '../format';
import { recipeOf } from '../food';
import { grow, todayWeight, warmupSets } from '../records';
import { formatPace } from '../run';
import {
  convertTemps,
  distanceToMi,
  distanceValue,
  feetInches,
  heightCm,
  kgToLb,
  lbToKg,
  lengthToIn,
  lengthValue,
  paceValue,
  setUnits,
  weightToLb,
  weightValue,
} from '../units';
import { roundWeight, weightStep } from '../weights';

afterEach(() => setUnits('imperial'));

const kg = (lb: number) => Math.round(lbToKg(lb) * 1000) / 1000;

describe('конвертация туда-обратно (SPEC_v3_3 §D3)', () => {
  it('lb ↔ kg: показ kg с точностью 0.5, обратный ввод — без потерь', () => {
    expect(weightValue(80, 'metric')).toBe(36.5);
    expect(weightValue(161.3, 'metric')).toBe(73);
    expect(weightValue(161.3, 'imperial')).toBe(161.3);
    expect(weightToLb(40, 'metric')).toBeCloseTo(88.18, 2);
    expect(lbToKg(kgToLb(57.5))).toBeCloseTo(57.5, 10);
    expect(weightValue(weightToLb(36.5, 'metric'), 'metric')).toBe(36.5);
  });

  it('хранение не меняется: переключение единиц — только показ', () => {
    const d = defaultData();
    const metric = { ...d, settings: { ...d.settings, units: 'metric' as const } };
    const back = { ...metric, settings: { ...metric.settings, units: 'imperial' as const } };
    expect(back.profile).toEqual(d.profile);
    setUnits('metric');
    expect(formatWeight(d.profile.startWeight)).toBe('73 kg');
    setUnits('imperial');
    expect(formatWeight(d.profile.startWeight)).toBe('161,3 lb');
  });

  it('рост ft/in ↔ cm, замеры in ↔ cm', () => {
    expect(feetInches(72)).toEqual({ ft: 6, inch: 0 });
    expect(feetInches(70.5)).toEqual({ ft: 5, inch: 10.5 });
    expect(heightCm(72)).toBe(183);
    expect(formatHeight(72)).toBe(`6'0"`);
    setUnits('metric');
    expect(formatHeight(72)).toBe('183 cm');
    expect(lengthValue(32, 'metric')).toBe(81.5);
    expect(lengthToIn(81.28, 'metric')).toBeCloseTo(32, 6);
    expect(formatLength(32)).toBe('81,5 cm');
  });

  it('пробежка: mi ↔ km, темп мин/mi ↔ мин/km', () => {
    expect(distanceValue(3, 'metric')).toBe(4.83);
    expect(distanceToMi(5, 'metric')).toBeCloseTo(3.107, 3);
    expect(paceValue(9 + 20 / 60, 'metric')).toBeCloseTo(5.8, 2);
    expect(formatPace(9 + 20 / 60)).toBe('9:20 мин/mi');
    setUnits('metric');
    expect(formatPace(9 + 20 / 60)).toBe('5:48 мин/km');
    expect(formatDistance(3)).toBe('4,83 km');
  });

  it('°F → °C в рецептах, округление до 5; хранимый текст не меняется', () => {
    expect(convertTemps('Духовка 400°F 12–15 мин или аэрогриль 390°F', 'metric')).toBe('Духовка 205°C 12–15 мин или аэрогриль 200°C');
    expect(convertTemps('400°F', 'imperial')).toBe('400°F');
    setUnits('metric');
    const d = defaultData();
    expect(recipeOf(d.food, 'salmon_rice').text).toContain('205°C');
    expect(recipeOf(d.food, 'salmon_rice', false).text).toContain('400°F');
  });
});

describe('шаги весов в kg', () => {
  it('тренажёры и Смит — 2.5 kg, гантели — 2 kg; округление в выбранных единицах', () => {
    expect(kg(weightStep(100, 'machine', 'metric'))).toBe(2.5);
    expect(kg(weightStep(30, 'free', 'metric'))).toBe(2);
    expect(kg(roundWeight(kgToLb(36.4), 'machine', 'metric'))).toBe(37.5);
    expect(kg(roundWeight(kgToLb(13.1), 'free', 'metric'))).toBe(14);
    // Имперские — как раньше.
    expect(weightStep(10, 'free', 'imperial')).toBe(2.5);
    expect(roundWeight(37, 'machine', 'imperial')).toBe(35);
  });

  it('вес «сегодня»: +5 lb ↔ +2.5 kg, −10 lb ↔ −5 kg; гантели — ±2 kg', () => {
    const rec = kgToLb(40);
    expect(kg(todayWeight(rec, 'easy', 'machine', 'metric'))).toBe(42.5);
    expect(kg(todayWeight(rec, 'hard', 'machine', 'metric'))).toBe(35);
    expect(todayWeight(rec, 'normal', 'machine', 'metric')).toBe(rec);
    expect(kg(todayWeight(kgToLb(14), 'easy', 'free', 'metric'))).toBe(16);
    expect(kg(todayWeight(kgToLb(2), 'hard', 'free', 'metric'))).toBe(2);
    expect(todayWeight(80, 'easy', 'machine', 'imperial')).toBe(85);
    expect(todayWeight(80, 'hard', 'machine', 'imperial')).toBe(70);
  });

  it('прибавка рекорда в kg; факт, введённый в kg с округлением 0.5, засчитывается', () => {
    const variant = getVariant(getExercise('tue1'), 'machine'); // Смит, 6–10
    const record = 80; // lb → показ 36.5 kg
    const log: ExerciseLog = {
      exerciseId: 'tue1',
      variant: 'machine',
      rating: 'normal',
      sets: [1, 2, 3, 4].map(() => ({ type: 'work' as const, factWeight: weightToLb(36.5, 'metric'), factReps: 10, done: true })),
    };
    const next = grow({ weight: record }, log, variant, 'metric');
    expect(kg(next.weight!)).toBe(40); // 36.3 → шаг 2.5 → 37.5 + 2.5
    expect(grow({ weight: record }, { ...log, sets: log.sets.map((s) => ({ ...s, factWeight: 80 })) }, variant, 'imperial').weight).toBe(85);
    expect(warmupSets(variant, { weight: kgToLb(40) }, 'metric').map((s) => kg(s.planWeight!))).toEqual([20, 30]);
  });
});
