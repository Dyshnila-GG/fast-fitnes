/**
 * TOCHKA Plan Pack v1
 *
 * Portable configuration. It intentionally contains no workout history,
 * body measurements, photos, Garmin data, or other user-owned history.
 * A pack can therefore be shared and adapted without sharing personal logs.
 */

export const TOCHKA_PLAN_FORMAT = 'tochka-plan' as const;
export const TOCHKA_PLAN_SCHEMA_VERSION = 1 as const;

export type PlanVisibility = 'private' | 'friends' | 'public';
export type GainStrategy = 'conservative' | 'standard' | 'aggressive';
export type Goal = 'build_muscle' | 'lose_fat' | 'maintain' | 'strength';

export type PlanProfilePreset = {
  goal?: Goal;
  gainStrategy?: GainStrategy;
  trainingDays?: number[];
  maxSessionMinutes?: number;
  musclePriorities?: string[];
  limitations?: string[];
};

/** Variant-specific fields: an alternative way to do the same movement (machine ↔ free weight). */
export type PlanVariantInfo = {
  variantId: string;
  variantName?: string;
  equipment?: string;
  gifId?: string;
  /** Animated anatomical demo (absolute URL). */
  mediaUrl?: string;
  cue?: string;
  setup?: string[];
  execution?: string[];
  /** Hypertrophy cadence: eccentric-pause-concentric, e.g. 2-0-1. */
  tempo?: string;
  kind?: 'machine' | 'free';
  mode?: 'weight' | 'bodyweight' | 'time';
  /** Prescribed starting load in canonical lb storage units. */
  weight?: number;
};

export type PlanExercise = {
  exerciseId: string;
  variantId: string;
  /** Portable display/runtime metadata. Optional for legacy packs that use built-in IDs. */
  title?: string;
  variantName?: string;
  equipment?: string;
  gifId?: string;
  mediaUrl?: string;
  cue?: string;
  setup?: string[];
  execution?: string[];
  muscles?: string;
  /** Exercise guidance (handoff §14), shared by all variants. */
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  feel?: string;
  wrongFeel?: string[];
  mistakes?: string[];
  /** Hypertrophy cadence: eccentric-pause-concentric, e.g. 2-0-1. */
  tempo?: string;
  /** Other ways to do the movement when the main equipment is busy or missing. */
  alternatives?: PlanVariantInfo[];
  kind?: 'machine' | 'free';
  mode?: 'weight' | 'bodyweight' | 'time';
  sets: number;
  /** Prescribed starting load in canonical lb storage units. */
  weight?: number;
  repsMin?: number;
  repsMax?: number;
  seconds?: number;
  targetRir?: number;
  restMinSec?: number;
  restMaxSec?: number;
};

export type PlanWorkout = {
  id: string;
  title: string;
  weekday?: number;
  exercises: PlanExercise[];
};

export type TrainingPlanPack = {
  id: string;
  title: string;
  workouts: PlanWorkout[];
};

export type NutritionTarget = {
  strategy?: GainStrategy;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
};

export type RecipeIngredient = {
  foodId: string;
  name: string;
  grams?: number;
  count?: number;
};

export type RecipeTemplate = {
  id: string;
  title: string;
  ingredients: RecipeIngredient[];
  instructions?: string[];
};

export type NutritionPlanPack = {
  target?: NutritionTarget;
  recipes?: RecipeTemplate[];
  menu?: Array<{ id: string; title: string; recipeIds: string[] }>;
};

export type CoachPlanPack = {
  enabled?: boolean;
  reviewEveryDays?: number;
  calorieAdjustmentStep?: number;
  requireConfirmation?: boolean;
};

export type TrackingPlanPack = {
  weight?: { enabled: boolean; frequency: 'daily' | 'weekly' };
  waist?: { enabled: boolean; everyDays: number };
  measurements?: { enabled: boolean; everyDays: number };
  photos?: { enabled: boolean; everyDays: number };
};

export type TochkaPlanPack = {
  format: typeof TOCHKA_PLAN_FORMAT;
  schemaVersion: typeof TOCHKA_PLAN_SCHEMA_VERSION;
  id: string;
  version: string;
  title: string;
  author?: string;
  description?: string;
  visibility?: PlanVisibility;
  profilePreset?: PlanProfilePreset;
  training?: TrainingPlanPack;
  nutrition?: NutritionPlanPack;
  coach?: CoachPlanPack;
  tracking?: TrackingPlanPack;
};

export type PlanPackImportResult =
  | { ok: true; pack: TochkaPlanPack }
  | { ok: false; error: string };

const obj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function parsePlanPack(raw: unknown): PlanPackImportResult {
  if (!obj(raw)) return { ok: false, error: 'plan.invalid' };
  if (raw.format !== TOCHKA_PLAN_FORMAT) return { ok: false, error: 'plan.unsupportedFormat' };
  if (raw.schemaVersion !== TOCHKA_PLAN_SCHEMA_VERSION) return { ok: false, error: 'plan.unsupportedVersion' };
  if (typeof raw.id !== 'string' || !raw.id.trim()) return { ok: false, error: 'plan.missingId' };
  if (typeof raw.version !== 'string' || !raw.version.trim()) return { ok: false, error: 'plan.missingVersion' };
  if (typeof raw.title !== 'string' || !raw.title.trim()) return { ok: false, error: 'plan.missingTitle' };
  if (raw.training != null) {
    if (!obj(raw.training) || !Array.isArray(raw.training.workouts)) return { ok: false, error: 'plan.invalidTraining' };
    for (const workout of raw.training.workouts) {
      if (!obj(workout) || typeof workout.id !== 'string' || !workout.id.trim() || typeof workout.title !== 'string' || !Array.isArray(workout.exercises))
        return { ok: false, error: 'plan.invalidWorkout' };
      for (const exercise of workout.exercises) {
        if (!obj(exercise) || typeof exercise.exerciseId !== 'string' || !exercise.exerciseId.trim() || typeof exercise.variantId !== 'string' || !exercise.variantId.trim())
          return { ok: false, error: 'plan.invalidExercise' };
        if (!Number.isInteger(exercise.sets) || (exercise.sets as number) < 1 || (exercise.sets as number) > 20)
          return { ok: false, error: 'plan.invalidSets' };
        const nums = ['weight','repsMin','repsMax','seconds','targetRir','restMinSec','restMaxSec'] as const;
        if (nums.some((k) => exercise[k] != null && (typeof exercise[k] !== 'number' || !Number.isFinite(exercise[k] as number) || (exercise[k] as number) < 0)))
          return { ok: false, error: 'plan.invalidExerciseValue' };
        if (exercise.repsMin != null && exercise.repsMax != null && (exercise.repsMax as number) < (exercise.repsMin as number))
          return { ok: false, error: 'plan.invalidRepRange' };
        if (exercise.targetRir != null && (exercise.targetRir as number) > 4) return { ok: false, error: 'plan.invalidRir' };
        if (exercise.kind != null && exercise.kind !== 'machine' && exercise.kind !== 'free') return { ok: false, error: 'plan.invalidKind' };
        if (exercise.mode != null && !['weight','bodyweight','time'].includes(exercise.mode as string)) return { ok: false, error: 'plan.invalidMode' };
        if (exercise.alternatives != null) {
          if (!Array.isArray(exercise.alternatives)) return { ok: false, error: 'plan.invalidAlternative' };
          for (const alt of exercise.alternatives) {
            if (!obj(alt) || typeof alt.variantId !== 'string' || !alt.variantId.trim() || alt.variantId === exercise.variantId)
              return { ok: false, error: 'plan.invalidAlternative' };
            if (alt.kind != null && alt.kind !== 'machine' && alt.kind !== 'free') return { ok: false, error: 'plan.invalidKind' };
            if (alt.mode != null && !['weight','bodyweight','time'].includes(alt.mode as string)) return { ok: false, error: 'plan.invalidMode' };
            if (alt.weight != null && (typeof alt.weight !== 'number' || !Number.isFinite(alt.weight) || alt.weight < 0))
              return { ok: false, error: 'plan.invalidExerciseValue' };
          }
        }
      }
    }
  }
  return { ok: true, pack: raw as TochkaPlanPack };
}
