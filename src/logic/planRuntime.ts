import type { PlanExercise, PlanWorkout, TochkaPlanPack } from '../planPack';

export function installedWorkouts(pack?: TochkaPlanPack | null): PlanWorkout[] {
  return pack?.training?.workouts ?? [];
}

export function workoutById(pack: TochkaPlanPack | null | undefined, id: string): PlanWorkout | undefined {
  return installedWorkouts(pack).find((w) => w.id === id);
}

export function nextInstalledWorkout(pack: TochkaPlanPack | null | undefined, weekday: number): PlanWorkout | undefined {
  const workouts=installedWorkouts(pack);
  if (!workouts.length) return undefined;
  return [...workouts].sort((a,b)=>{
    const da=((a.weekday ?? 7)-weekday+7)%7;
    const db=((b.weekday ?? 7)-weekday+7)%7;
    return da-db;
  })[0];
}

export function planExerciseLabel(e: PlanExercise): string {
  const reps=e.seconds != null ? `${e.seconds}s` : e.repsMax != null ? `${e.repsMin ?? e.repsMax}–${e.repsMax}` : String(e.repsMin ?? '—');
  return `${e.sets} × ${reps}${e.targetRir != null ? ` · RIR ${e.targetRir}` : ''}`;
}
