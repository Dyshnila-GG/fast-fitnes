import type { AppData, ExerciseLog, Session, SetLog } from '../types';
import type { PlanExercise, PlanWorkout } from '../planPack';
import { newId } from './id';
import { emptyWarmup } from './session';
import { decideAfterSet, applyDecisionToNextSet, type TrainingDecision } from './trainingEngine';

function workSets(e: PlanExercise): SetLog[] {
  return Array.from({ length: e.sets }, () => ({
    type: 'work' as const,
    planReps: e.repsMin,
    planRepsMax: e.repsMax,
    planSeconds: e.seconds,
    // Seed the first prescription with the pack's load when present.
    planWeight: (e as PlanExercise & { weight?: number }).weight,
    done: false,
  }));
}

export function buildImportedExerciseLog(e: PlanExercise): ExerciseLog {
  return {
    exerciseId: e.exerciseId,
    // Compatibility field until ExerciseLog v4 removes the old machine/free switch.
    variant: e.kind ?? 'machine',
    variantId: e.variantId,
    targetRir: e.targetRir,
    sets: workSets(e),
  };
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
    exercises: workout.exercises.map(buildImportedExerciseLog),
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
