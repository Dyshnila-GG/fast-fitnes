import { getExercise, getTemplate, getVariant } from '../data/program';
import type { AppData, Exercise, ExerciseLog, Kind, Length, Plan, Session, SetLog, TemplateId, Variant } from '../types';
import { newId } from './id';
import { nextPlan } from './progression';
import { roundWeight } from './weights';

export const SHORT_EXERCISES = 4;
export const SHORT_MAX_WORK_SETS = 3;

export function chosenKind(data: AppData, exercise: Exercise): Kind {
  const kind = data.variantChoice[exercise.id] ?? exercise.defaultVariant;
  return exercise.variants.some((v) => v.kind === kind) ? kind : exercise.variants[0].kind;
}

export function currentPlan(data: AppData, exercise: Exercise, kind: Kind): Plan {
  return data.plans[exercise.id]?.[kind] ?? getVariant(exercise, kind).plan;
}

export function buildSets(variant: Variant, plan: Plan, length: Length): SetLog[] {
  const warmups: SetLog[] = variant.warmup.map((w) => ({
    type: 'warmup',
    planWeight: w.pct > 0 && plan.weight ? roundWeight(plan.weight * w.pct, variant.kind) : undefined,
    planReps: w.reps,
    done: false,
  }));
  const count = length === 'short' ? Math.min(SHORT_MAX_WORK_SETS, plan.sets) : plan.sets;
  const work: SetLog[] = Array.from({ length: count }, () => ({
    type: 'work',
    planWeight: variant.mode === 'weight' ? plan.weight : undefined,
    planReps: variant.mode === 'time' ? undefined : plan.reps,
    planRepsMax: variant.mode === 'time' ? undefined : plan.repsMax,
    planSeconds: variant.mode === 'time' ? plan.seconds : undefined,
    done: false,
  }));
  return [...warmups, ...work];
}

export function buildExerciseLog(data: AppData, exercise: Exercise, kind: Kind, length: Length): ExerciseLog {
  const variant = getVariant(exercise, kind);
  return {
    exerciseId: exercise.id,
    variant: kind,
    sets: buildSets(variant, currentPlan(data, exercise, kind), length),
  };
}

export function sessionExercises(templateId: TemplateId, length: Length): Exercise[] {
  const all = getTemplate(templateId).exercises;
  return length === 'short' ? all.slice(0, SHORT_EXERCISES) : all;
}

export function buildSession(data: AppData, templateId: TemplateId, length: Length, now = new Date()): Session {
  return {
    id: newId(),
    templateId,
    length,
    startedAt: now.toISOString(),
    pausedMs: 0,
    warmupDone: [],
    exercises: sessionExercises(templateId, length).map((e) =>
      buildExerciseLog(data, e, chosenKind(data, e), length),
    ),
  };
}

export function lastFinished(data: AppData, templateId: TemplateId): Session | undefined {
  return data.sessions
    .filter((s) => s.templateId === templateId && s.finishedAt)
    .sort((a, b) => (a.finishedAt! < b.finishedAt! ? 1 : -1))[0];
}

// ---- Активная тренировка ----

export const WARMUP_ITEMS = [
  {
    id: 'run',
    label: 'пробежка',
    text: (length: Length) =>
      `Пробежка ${length === 'short' ? '5' : '5–8'} мин, лёгкий темп. Если ноет голеностоп — велотренажёр.`,
  },
  {
    id: 'joints',
    label: 'суставная разминка',
    text: () =>
      'Суставная разминка ~3 мин: круги голеностопом, махи ногами, ягодичный мост ×15, подъём на носки ×15, круги плечами.',
  },
];

const ms = (iso?: string) => (iso ? new Date(iso).getTime() : 0);

export function pausedTotalMs(s: Session, now = Date.now()): number {
  return s.pausedMs + (s.pausedAt ? Math.max(0, now - ms(s.pausedAt)) : 0);
}

export function elapsedMs(s: Session, now = Date.now()): number {
  return Math.max(0, now - ms(s.startedAt) - pausedTotalMs(s, now));
}

export function togglePause(s: Session, now = new Date()): Session {
  if (!s.pausedAt) return { ...s, pausedAt: now.toISOString() };
  return { ...s, pausedMs: pausedTotalMs(s, now.getTime()), pausedAt: undefined };
}

export function startRest(s: Session, sec: number, now = Date.now()): Session {
  return { ...s, restSec: sec, restEndsAt: new Date(now + sec * 1000).toISOString() };
}

export function shiftRest(s: Session, deltaSec: number, now = Date.now()): Session {
  if (!s.restEndsAt) return s;
  const end = Math.max(now, ms(s.restEndsAt) + deltaSec * 1000);
  return { ...s, restSec: Math.max(0, (s.restSec ?? 0) + deltaSec), restEndsAt: new Date(end).toISOString() };
}

export function stopRest(s: Session): Session {
  return { ...s, restEndsAt: undefined, restSec: undefined };
}

// Подход заполнен, когда введены обязательные поля факта.
export function isSetFilled(set: SetLog, mode: Variant['mode']): boolean {
  if (mode === 'time' && set.type === 'work') return set.factSeconds != null;
  if (mode === 'weight') return set.factReps != null && set.factWeight != null;
  return set.factReps != null; // свой вес: вес необязателен
}

function isShort(set: SetLog): boolean {
  if (set.type !== 'work') return false;
  if (set.planReps != null && set.factReps != null && set.factReps < set.planReps) return true;
  return set.planSeconds != null && set.factSeconds != null && set.factSeconds < set.planSeconds;
}

export function updateSet(log: ExerciseLog, mode: Variant['mode'], index: number, patch: Partial<SetLog>): ExerciseLog {
  const sets = log.sets.map((s, i) => {
    if (i !== index) return s;
    const next = { ...s, ...patch };
    return { ...next, done: isSetFilled(next, mode) };
  });
  // Недобор повторов → по умолчанию «Не смог».
  const rating = log.rating ?? (sets.some(isShort) ? 'fail' : undefined);
  return { ...log, sets, rating };
}

export function copyPlanToFact(log: ExerciseLog, mode: Variant['mode'], index: number): ExerciseLog {
  const s = log.sets[index];
  return updateSet(log, mode, index, {
    factWeight: s.planWeight,
    factReps: s.planReps,
    factSeconds: s.planSeconds,
  });
}

export function addSet(log: ExerciseLog, type: SetLog['type']): ExerciseLog {
  const same = log.sets.filter((s) => s.type === type);
  const last = same[same.length - 1];
  const set: SetLog = {
    type,
    planWeight: last?.planWeight,
    planReps: last?.planReps,
    planRepsMax: last?.planRepsMax,
    planSeconds: last?.planSeconds,
    done: false,
  };
  // Разминочные — перед рабочими.
  const at = type === 'warmup' ? log.sets.filter((s) => s.type === 'warmup').length : log.sets.length;
  return { ...log, sets: [...log.sets.slice(0, at), set, ...log.sets.slice(at)] };
}

export function removeSet(log: ExerciseLog, index: number): ExerciseLog {
  return { ...log, sets: log.sets.filter((_, i) => i !== index) };
}

export function hasFacts(log: ExerciseLog): boolean {
  return log.sets.some((s) => s.factWeight != null || s.factReps != null || s.factSeconds != null);
}

export function isExerciseComplete(log: ExerciseLog): boolean {
  return log.rating != null && log.sets.every((s) => s.done);
}

// Номер текущего упражнения: первое незавершённое (иначе последнее).
export function currentExerciseIndex(s: Session): number {
  const i = s.exercises.findIndex((e) => !isExerciseComplete(e));
  return i === -1 ? s.exercises.length - 1 : i;
}

export function skippedItems(s: Session): string[] {
  const out: string[] = [];
  for (const item of WARMUP_ITEMS) {
    if (!s.warmupDone.includes(item.id)) out.push(`Разминка: ${item.label}`);
  }
  for (const log of s.exercises) {
    const name = getVariant(getExercise(log.exerciseId), log.variant).name;
    const empty = log.sets.filter((x) => !x.done).length;
    if (empty > 0) out.push(`${name}: не заполнены подходы (${empty})`);
    if (!log.rating) out.push(`${name}: нет оценки`);
  }
  return out;
}

export function finishActive(d: AppData, now = new Date()): AppData {
  const s = d.activeSession;
  if (!s) return d;
  const done: Session = {
    ...stopRest(s),
    pausedMs: pausedTotalMs(s, now.getTime()),
    pausedAt: undefined,
    finishedAt: now.toISOString(),
  };
  return applyProgression({ ...d, activeSession: null, sessions: [...d.sessions, done], summaryId: done.id }, done);
}

// План на следующую тренировку (раздел 5) — для каждого оценённого упражнения, отдельно по варианту.
export function applyProgression(d: AppData, s: Session): AppData {
  const plans = { ...d.plans };
  for (const log of s.exercises) {
    if (!log.rating) continue;
    const ex = getExercise(log.exerciseId);
    const plan = nextPlan(ex, getVariant(ex, log.variant), currentPlan(d, ex, log.variant), log);
    plans[ex.id] = { ...plans[ex.id], [log.variant]: plan };
  }
  return { ...d, plans };
}

// Ручная правка плана на экране итога.
export function setPlan(d: AppData, exerciseId: string, kind: Kind, patch: Partial<Plan>): AppData {
  const ex = getExercise(exerciseId);
  const plan = { ...currentPlan(d, ex, kind), ...patch };
  return { ...d, plans: { ...d.plans, [exerciseId]: { ...d.plans[exerciseId], [kind]: plan } } };
}
