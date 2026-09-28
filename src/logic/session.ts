import { getTemplate, getVariant } from '../data/program';
import type { AppData, Exercise, ExerciseLog, Kind, Length, Plan, Session, SetLog, TemplateId, Variant } from '../types';
import { newId } from './id';
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
