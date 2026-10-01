import { LEGACY_PROGRAM } from '../data/legacy';
import { PROGRAM } from '../data/program';
import { sanitizeFood } from '../logic/food';
import { sanitizeActiveRun } from '../logic/run';
import { sanitizeRuns, sanitizeSleep } from '../logic/sleep';
import { sanitizeTrash } from '../logic/trash';
import { isObj } from '../logic/validate';
import type { AppData, BackupState, Best, Plan, Reminder, Reminders, Settings } from '../types';
import { isTime } from '../logic/time';
import { defaultData, defaultReminders } from './defaults';

type LegacyPlans = AppData['plans'];

// Рекорды из планов v1 (SPEC_v2 §2.6): совпадает название варианта → рекорд = сохранённый план веса
// (планка — секунды). Одно движение в нескольких тренировках v1 — берём максимум.
// Без сохранённого плана остаётся стартовый рекорд v2 (см. getBest).
export function recordsFromLegacyPlans(plans: LegacyPlans): Record<string, Best> {
  const current = new Set(PROGRAM.flatMap((t) => t.exercises.flatMap((e) => e.variants.map((v) => `${v.name}|${v.mode}`))));
  const out: Record<string, Best> = {};
  for (const t of LEGACY_PROGRAM) {
    for (const e of t.exercises) {
      for (const v of e.variants) {
        const plan: Plan | undefined = plans[e.id]?.[v.kind];
        if (!plan || !current.has(`${v.name}|${v.mode}`)) continue;
        const field = v.mode === 'weight' ? 'weight' : v.mode === 'time' ? 'seconds' : null;
        const value = field ? plan[field] : undefined;
        if (!field || value == null) continue;
        const prev = out[v.name]?.[field];
        if (prev == null || value > prev) out[v.name] = { [field]: value };
      }
    }
  }
  return out;
}

// Приводит сохранённые или импортированные данные к текущей версии. История, метрики и профиль не меняются;
// еда, сон и пробежки (SPEC_v3) — только корректные записи, отсутствуют — пустые; битая активная пробежка — нет пробежки.
export function migrateData(raw: Record<string, unknown>): AppData {
  const base = defaultData();
  const d = { ...base, ...raw } as AppData;
  const legacy = raw.version === 2 ? {} : recordsFromLegacyPlans(d.plans ?? {});
  return {
    ...d,
    version: 2,
    plans: d.plans ?? {},
    records: { ...legacy, ...(d.records ?? {}) },
    food: sanitizeFood(raw.food),
    sleep: sanitizeSleep(raw.sleep),
    runs: sanitizeRuns(raw.runs),
    activeRun: sanitizeActiveRun(raw.activeRun),
    trash: sanitizeTrash(raw.trash),
    backup: sanitizeBackup(raw.backup),
    reminders: sanitizeReminders(raw.reminders),
    settings: sanitizeSettings(raw.settings),
  };
}

function sanitizeSettings(raw: unknown): Settings {
  const s = isObj(raw) ? raw : {};
  return {
    lang: s.lang === 'en' || s.lang === 'uk' ? s.lang : 'ru',
    units: s.units === 'metric' ? 'metric' : 'imperial',
  };
}

const str = (v: unknown) => (typeof v === 'string' && v !== '' ? v : undefined);

function sanitizeBackup(raw: unknown): BackupState {
  if (!isObj(raw)) return {};
  const out: BackupState = {};
  const dirUri = str(raw.dirUri);
  const lastAt = str(raw.lastAt);
  const error = str(raw.error);
  if (dirUri) out.dirUri = dirUri;
  if (lastAt && !Number.isNaN(Date.parse(lastAt))) out.lastAt = lastAt;
  if (error) out.error = error;
  return out;
}

function sanitizeReminders(raw: unknown): Reminders {
  const base = defaultReminders();
  if (!isObj(raw)) return base;
  const one = (v: unknown, def: Reminder): Reminder =>
    isObj(v) ? { on: typeof v.on === 'boolean' ? v.on : def.on, time: isTime(v.time) ? v.time : def.time } : def;
  const out: Reminders = { sleep: one(raw.sleep, base.sleep), workout: one(raw.workout, base.workout) };
  if (raw.asked === true) out.asked = true;
  return out;
}
