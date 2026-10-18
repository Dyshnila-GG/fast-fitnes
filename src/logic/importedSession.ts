import type { AppData, ExerciseLog, Session, SetLog } from '../types';
import type { PlanExercise, PlanWorkout } from '../planPack';
import { newId } from './id';
import { emptyWarmup } from './session';

function workSets(e: PlanExercise): SetLog[] {
  return Array.from({ length: e.sets }, () => ({
    type: 'work' as const,
    planReps: e.repsMin,
    planRepsMax: e.repsMax,
    planSeconds: e.seconds,
    done: false,
  }));
}

export function buildImportedExerciseLog(e: PlanExercise): ExerciseLog {
  return {
    exerciseId: e.exerciseId,
    // Compatibility field until ExerciseLog v4 removes the old machine/free switch.
    variant: 'machine',
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
