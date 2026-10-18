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

export type PlanExercise = {
  exerciseId: string;
  variantId: string;
  sets: number;
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
  return { ok: true, pack: raw as TochkaPlanPack };
}
