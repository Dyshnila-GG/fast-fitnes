import type { AppData, FoodData } from '../types';

export function defaultFood(): FoodData {
  return { eaten: {}, swaps: {}, prep: {}, photos: {}, times: { gym: {}, rest: {} } };
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
  };
}
