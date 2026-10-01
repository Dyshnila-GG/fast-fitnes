import type { AppData, Best, Session, TrashItem } from '../types';
import { isObj, validSession } from './validate';

// Корзина тренировок (SPEC_v3_3 §B1). Удаление и восстановление — в session.ts (там же откат рекордов).

export const TRASH_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Сколько дней осталось до автоудаления (не меньше 0; неполный день считается целым).
export function daysLeft(item: TrashItem, now = new Date()): number {
  const left = TRASH_DAYS * DAY_MS - (now.getTime() - new Date(item.deletedAt).getTime());
  return Math.max(0, Math.ceil(left / DAY_MS));
}

// Автоудаление через 30 дней — проверка при запуске приложения.
export function purgeTrash(d: AppData, now = new Date()): AppData {
  const trash = d.trash.filter((t) => daysLeft(t, now) > 0);
  return trash.length === d.trash.length ? d : { ...d, trash };
}

export function deleteForever(d: AppData, id: string): AppData {
  return { ...d, trash: d.trash.filter((t) => t.session.id !== id) };
}

export function clearTrash(d: AppData): AppData {
  return { ...d, trash: [] };
}

// Новые удалённые — сверху.
export const trashLatestFirst = (trash: TrashItem[]) => [...trash].sort((a, b) => (a.deletedAt < b.deletedAt ? 1 : -1));

// ---- Импорт: только корректные записи ----

const isDate = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v));

function bests(v: unknown): TrashItem['rolledBack'] {
  if (!isObj(v)) return {};
  const out: TrashItem['rolledBack'] = {};
  for (const [name, step] of Object.entries(v)) {
    if (isObj(step) && isObj(step.before) && isObj(step.after)) out[name] = { before: step.before as Best, after: step.after as Best };
  }
  return out;
}

export function sanitizeTrash(raw: unknown): TrashItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t): t is Record<string, unknown> => isObj(t) && validSession(t.session) && isDate(t.deletedAt))
    .map((t) => ({ session: t.session as Session, deletedAt: t.deletedAt as string, rolledBack: bests(t.rolledBack) }));
}
