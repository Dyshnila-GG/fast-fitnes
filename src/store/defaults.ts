import type { AppData } from '../types';

export function defaultData(): AppData {
  return {
    version: 2,
    profile: { age: 22, heightIn: 72, startWeight: 161.3 },
    lengthChoice: {},
    variantChoice: {},
    records: {},
    plans: {},
    activeSession: null,
    summaryId: null,
    sessions: [],
    bodyWeight: [],
    measurements: [],
  };
}
