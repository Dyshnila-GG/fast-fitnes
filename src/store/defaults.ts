import type { AppData } from '../types';

export function defaultData(): AppData {
  return {
    version: 1,
    profile: { age: 22, heightIn: 72, startWeight: 161.3 },
    lengthChoice: {},
    variantChoice: {},
    plans: {},
    activeSession: null,
    sessions: [],
    bodyWeight: [],
    measurements: [],
  };
}
