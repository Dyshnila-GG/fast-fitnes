import type { Kind, SetLog, Units } from '../types';
import { addWeight, unitStep } from './weights';

export type TrainingDecisionType = 'HOLD' | 'INCREASE' | 'DECREASE' | 'REST_LONGER' | 'STOP';

export type TrainingDecision = {
  type: TrainingDecisionType;
  reason:
    | 'on_target'
    | 'too_easy'
    | 'too_heavy'
    | 'short_rest'
    | 'technique'
    | 'other_muscle'
    | 'pain'
    | 'insufficient_data';
  suggestedWeight?: number;
  suggestedRestSec?: number;
};

export type SetDecisionInput = {
  set: SetLog;
  repsMin?: number;
  repsMax?: number;
  targetRir?: number;
  kind: Kind;
  units?: Units;
  previousWeight?: number;
  restMinSec?: number;
};

export function decideAfterSet(input: SetDecisionInput): TrainingDecision {
  const { set, repsMin, repsMax, kind, previousWeight, restMinSec } = input;
  const targetRir = input.targetRir ?? 2;
  const units = input.units ?? 'imperial';

  if (set.stopReason === 'pain') return { type: 'STOP', reason: 'pain' };
  if (set.stopReason === 'technique') return { type: 'HOLD', reason: 'technique', suggestedWeight: set.factWeight ?? input.previousWeight };
  if (set.stopReason === 'other_muscle') return { type: 'HOLD', reason: 'other_muscle', suggestedWeight: set.factWeight ?? input.previousWeight };

  const reps = set.factReps;
  const rir = set.rir;
  const weight = set.factWeight ?? previousWeight;

  if (reps == null || rir == null || repsMin == null || repsMax == null) {
    return { type: 'HOLD', reason: 'insufficient_data' };
  }

  // Hypertrophy autoregulation: the prescribed RIR is the target, not a decoration.
  // Too few reps at/under target RIR means the load is too heavy; preserve load when short rest explains it.
  if (reps < repsMin && rir <= targetRir) {
    if (restMinSec && set.actualRestSec != null && set.actualRestSec < restMinSec) {
      return { type: 'REST_LONGER', reason: 'short_rest', suggestedRestSec: restMinSec };
    }
    return {
      type: 'DECREASE',
      reason: 'too_heavy',
      suggestedWeight: weight == null ? undefined : Math.max(0, addWeight(weight, kind, -unitStep(weight, kind, units), units)),
    };
  }

  // Double progression: once the top of the rep range is reached with the planned reserve,
  // add the smallest available load step. No need to wait until the set feels 4+ RIR easy.
  if (reps >= repsMax && rir >= targetRir) {
    return {
      type: 'INCREASE',
      reason: 'too_easy',
      suggestedWeight: weight == null ? undefined : addWeight(weight, kind, unitStep(weight, kind, units), units),
    };
  }

  return { type: 'HOLD', reason: 'on_target', suggestedWeight: weight };
}

export function actualRestSeconds(previousCompletedAt?: string, completedAt?: string): number | undefined {
  if (!previousCompletedAt || !completedAt) return undefined;
  const delta = Date.parse(completedAt) - Date.parse(previousCompletedAt);
  return Number.isFinite(delta) && delta >= 0 ? Math.round(delta / 1000) : undefined;
}


/**
 * Applies a deterministic decision to the next work set prescription.
 * STOP and REST_LONGER never mutate load. Technique HOLD also leaves it unchanged.
 */
export function applyDecisionToNextSet(current: SetLog, next: SetLog, decision: TrainingDecision): SetLog {
  if (decision.type === 'INCREASE' || decision.type === 'DECREASE' || decision.type === 'HOLD') {
    const weight = decision.suggestedWeight ?? current.factWeight ?? current.planWeight;
    return weight == null ? next : { ...next, planWeight: weight };
  }
  return next;
}
