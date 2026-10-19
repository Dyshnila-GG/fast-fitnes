import type { PlanExercise, PlanVariantInfo } from '../planPack';
import type { ExerciseLog, Kind, Session } from '../types';

const VARIANT_FIELDS = ['variantName', 'equipment', 'gifId', 'mediaUrl', 'cue', 'setup', 'execution', 'kind', 'mode'] as const;

/** The exercise as it is done with a given variant: shared prescription + that variant's own fields. */
export function effectiveExercise(e: PlanExercise, variantId?: string): PlanExercise {
  if (!variantId || variantId === e.variantId) return e;
  const alt = e.alternatives?.find((a) => a.variantId === variantId);
  if (!alt) return e;
  const out: PlanExercise = { ...e, variantId: alt.variantId, weight: alt.weight };
  for (const k of VARIANT_FIELDS) (out as Record<string, unknown>)[k] = (alt as PlanVariantInfo)[k];
  return out;
}

/** All ways to do the movement, main variant first. */
export function variantsOf(e: PlanExercise): PlanExercise[] {
  return [e, ...(e.alternatives ?? []).map((a) => effectiveExercise(e, a.variantId))];
}

export function hasVariant(e: PlanExercise, variantId?: string): boolean {
  return variantId === e.variantId || !!e.alternatives?.some((a) => a.variantId === variantId);
}

/** Preferred variant: the one last chosen for this movement (by kind), otherwise the main one. */
export function preferredVariant(e: PlanExercise, choice?: Kind): PlanExercise {
  if (!choice) return e;
  return variantsOf(e).find((v) => (v.kind ?? 'machine') === choice) ?? e;
}

/** Prescription of an imported exercise log, resolved for the variant the log currently uses. */
export function snapshotFor(session: Session, log: ExerciseLog): PlanExercise | undefined {
  const base = session.planSnapshot?.exercises.find((e) => e.exerciseId === log.exerciseId && hasVariant(e, log.variantId));
  return base ? effectiveExercise(base, log.variantId) : undefined;
}

/** The unresolved snapshot entry (with alternatives), for the variant switch. */
export function snapshotBase(session: Session, log: ExerciseLog): PlanExercise | undefined {
  return session.planSnapshot?.exercises.find((e) => e.exerciseId === log.exerciseId && hasVariant(e, log.variantId));
}
