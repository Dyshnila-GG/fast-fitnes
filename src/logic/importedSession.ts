import type { AppData, ExerciseLog, Session, SetLog } from '../types';
import type { PlanExercise, PlanWorkout } from '../planPack';
import { newId } from './id';
import { emptyWarmup } from './session';
import { decideAfterSet, applyDecisionToNextSet, type TrainingDecision } from './trainingEngine';

function workSets(e: PlanExercise, startWeight?: number): SetLog[] {
  return Array.from({ length: e.sets }, () => ({
    type: 'work' as const,
    planReps: e.repsMin,
    planRepsMax: e.repsMax,
    planSeconds: e.seconds,
    // Last real working load wins; the pack's load is only the first-time default.
    planWeight: startWeight ?? e.weight,
    done: false,
  }));
}

export function buildImportedExerciseLog(e: PlanExercise, startWeight?: number): ExerciseLog {
  return {
    exerciseId: e.exerciseId,
    // Compatibility field until ExerciseLog v4 removes the old machine/free switch.
    variant: e.kind ?? 'machine',
    variantId: e.variantId,
    targetRir: e.targetRir,
    sets: workSets(e, startWeight),
  };
}

/**
 * Cross-session progression (handoff §44): the next session of an exercise starts from the
 * prescription the engine would give after its last completed working set in the latest
 * finished session with the same exerciseId + variantId. No history → undefined (pack weight).
 */
export function carriedWeight(data: AppData, e: PlanExercise): number | undefined {
  if (e.mode === 'time' || e.mode === 'bodyweight' || e.seconds != null) return undefined;
  const finished = data.sessions
    .filter((s) => s.finishedAt)
    .sort((a, b) => (a.finishedAt! < b.finishedAt! ? 1 : -1));
  for (const s of finished) {
    const log = s.exercises.find((l) => l.exerciseId === e.exerciseId && l.variantId === e.variantId);
    if (!log) continue;
    const last = [...log.sets].reverse().find((x) => x.type === 'work' && x.done && x.factWeight != null && x.factWeight > 0);
    if (!last) continue;
    const decision = decideAfterSet({
      set: last,
      repsMin: e.repsMin,
      repsMax: e.repsMax,
      targetRir: e.targetRir,
      kind: e.kind ?? log.variant,
      units: s.units,
      previousWeight: last.factWeight,
    });
    if (decision.type === 'INCREASE' || decision.type === 'DECREASE') return decision.suggestedWeight ?? last.factWeight;
    return last.factWeight;
  }
  return undefined;
}

export function buildImportedSession(data: AppData, workout: PlanWorkout, now = new Date()): Session {
  return {
    id: newId(),
    templateId: workout.id,
    planSnapshot: {
      title: workout.title,
      exercises: workout.exercises.map((e) => ({ ...e })),
    },
    length: 'long',
    units: data.settings.units,
    startedAt: now.toISOString(),
    pausedMs: 0,
    warmup: emptyWarmup(),
    exercises: workout.exercises.map((e) => buildImportedExerciseLog(e, carriedWeight(data, e))),
  };
}

export function startImportedWorkout(data: AppData, workoutId: string, now = new Date()): AppData {
  if (data.activeSession) return data;
  const workout = data.installedPlan?.pack.training?.workouts.find((w) => w.id === workoutId);
  if (!workout) return data;
  return { ...data, activeSession: buildImportedSession(data, workout, now) };
}

export function isImportedSession(session: Session): boolean {
  return !!session.planSnapshot;
}


export function coachImportedSet(
  session: Session,
  exerciseIndex: number,
  setIndex: number,
  kind: 'machine' | 'free' = 'machine',
): { session: Session; decision?: TrainingDecision } {
  const log=session.exercises[exerciseIndex];
  const set=log?.sets[setIndex];
  const prescription=session.planSnapshot?.exercises.find((e)=>e.exerciseId===log?.exerciseId && e.variantId===log?.variantId);
  if (!log || !set || !prescription || set.type !== 'work' || set.factReps == null || set.rir == null) return { session };
  const decision=decideAfterSet({
    set,
    repsMin:prescription.repsMin,
    repsMax:prescription.repsMax,
    targetRir:prescription.targetRir,
    kind,
    units:session.units,
    previousWeight:set.factWeight,
    restMinSec:prescription.restMinSec,
  });
  const nextIndex=log.sets.findIndex((s,i)=>i>setIndex && s.type==='work' && !s.done);
  if (nextIndex < 0) return { session, decision };
  const next=applyDecisionToNextSet(set,log.sets[nextIndex],decision);
  const exercises=session.exercises.map((x,ei)=>ei!==exerciseIndex?x:{...x,sets:x.sets.map((s,si)=>si===nextIndex?next:s)});
  return { session:{...session,exercises}, decision };
}
