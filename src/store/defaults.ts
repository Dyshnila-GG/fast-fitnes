import { defaultDishes, defaultSchedule } from '../data/food';
import type { AppData, FoodData, Reminders, V4Data } from '../types';

export function defaultFood(): FoodData {
  return { eaten: {}, swaps: {}, photos: {}, recipes: {}, dishes: defaultDishes(), products: {}, schedule: defaultSchedule() };
}

export function defaultReminders(): Reminders {
  return { sleep: { on: true, time: '21:30' }, workout: { on: true, time: '05:10' } };
}

export function defaultV4(): V4Data {
  return { nutrition: { mode: 'fast_gain', proteinG: 150 }, facts: [], batches: [], activities: [], bodyFlags: [] };
}

export function defaultData(): AppData {
  return {
    version: 3,
    installedPlan: null,
    v4: defaultV4(),
    profile: { age: 22, heightIn: 72, startWeight: 161.3 },
    lengthChoice: {},
    variantChoice: {},
    records: {},
    plans: {},
    activeSession: null,
    activeRun: null,
    summaryId: null,
    sessions: [],
    bodyWeight: [],
    measurements: [],
    food: defaultFood(),
    sleep: {},
    runs: {},
    trash: [],
    backup: {},
    reminders: defaultReminders(),
    settings: { lang: 'ru', units: 'imperial' },
  };
}
