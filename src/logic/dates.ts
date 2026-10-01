// Даты записей: локальный день «YYYY-MM-DD».

export function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dayDate(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function shiftDay(day: string, delta: number): string {
  const d = dayDate(day);
  d.setDate(d.getDate() + delta);
  return dayKey(d);
}

// Понедельник недели (неделя пн–вс).
export function weekStart(day: string): string {
  const w = dayDate(day).getDay();
  return shiftDay(day, -((w + 6) % 7));
}
