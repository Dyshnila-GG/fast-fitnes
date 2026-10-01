import type { AppData, FoodData, Reminders } from '../types';

export function defaultFood(): FoodData {
  return { eaten: {}, swaps: {}, photos: {}, recipes: {}, times: { gym: {}, rest: {} } };
}

export function defaultReminders(): Reminders {
  return { sleep: { on: true, time: '21:30' }, workout: { on: true, time: '05:10' } };
}

export function defaultData(): AppData {
  return {
    version: 2,
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
  };
}
