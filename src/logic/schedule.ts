import { PROGRAM } from '../data/program';
import type { TemplateId } from '../types';

// Тренировка по расписанию сегодня или ближайшая следующая.
export function highlightedTemplate(now = new Date()): { id: TemplateId; isToday: boolean } {
  const day = now.getDay();
  const sorted = [...PROGRAM].sort((a, b) => a.weekday - b.weekday);
  const next = sorted.find((t) => t.weekday >= day) ?? sorted[0];
  return { id: next.id, isToday: next.weekday === day };
}
