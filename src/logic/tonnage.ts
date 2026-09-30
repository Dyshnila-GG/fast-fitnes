import type { Session } from '../types';

// Суммарный тоннаж: Σ факт веса × факт повторов по всем подходам с весом.
export function tonnage(s: Session): number {
  let total = 0;
  for (const log of s.exercises) {
    for (const set of log.sets) {
      if (set.factWeight && set.factReps) total += set.factWeight * set.factReps;
    }
  }
  return Math.round(total * 10) / 10;
}
