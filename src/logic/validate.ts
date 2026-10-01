import { getExercise, getTemplate } from '../data/program';

// Проверки импортируемых данных: берём только то, что приложение сможет показать.

export const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function validSession(s: unknown): boolean {
  if (!isObj(s) || typeof s.id !== 'string' || typeof s.startedAt !== 'string') return false;
  try {
    getTemplate(String(s.templateId));
  } catch {
    return false;
  }
  if (!Array.isArray(s.exercises)) return false;
  return s.exercises.every((l) => {
    if (!isObj(l) || !Array.isArray(l.sets) || (l.variant !== 'machine' && l.variant !== 'free')) return false;
    try {
      getExercise(String(l.exerciseId));
      return true;
    } catch {
      return false;
    }
  });
}
