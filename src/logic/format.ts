import type { Best, ExerciseLog, Feel, Plan, Rating, Session, SetLog, Variant } from '../types';

export const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// «28 сен» — без года.
export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// Локальный день «YYYY-MM-DD» → «28 сен 2026».
export function formatDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// 21 год, 22 года, 25 лет
export function formatAge(age: number): string {
  const n = Math.abs(Math.trunc(age));
  const word = n % 10 === 1 && n % 100 !== 11 ? 'год' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'года' : 'лет';
  return `${age} ${word}`;
}

// Рост в дюймах → 6'0"
export function formatHeight(inches: number): string {
  return `${Math.floor(inches / 12)}'${Math.round((inches % 12) * 10) / 10}"`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatRest(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export function formatReps(variant: Variant, plan: Best): string {
  if (variant.mode === 'time') return `${plan.seconds ?? 0} сек`;
  const reps = plan.repsMax ? `${plan.reps}–${plan.repsMax}` : `${plan.reps ?? 0}`;
  return variant.perLeg ? `${reps} на ногу` : reps;
}

// «4 × 8 · 75 lb», «3 × 8–10 · свой вес», «3 × 40 сек»
export function formatPlan(variant: Variant, plan: Plan): string {
  const base = `${plan.sets} × ${formatReps(variant, plan)}`;
  if (variant.mode === 'bodyweight') return `${base} · свой вес`;
  if (variant.mode === 'weight') return plan.weight != null ? `${base} · ${plan.weight} lb` : base;
  return base;
}

// Предпросмотр: «4 × 6–10 × 75 lb», «4 × 6–10 · свой вес», «3 × 40 сек».
export function formatPreview(variant: Variant, best: Best, sets: number): string {
  if (variant.mode === 'time') return `${sets} × ${best.seconds ?? 0} сек`;
  if (variant.mode === 'bodyweight') return `${sets} × ${formatReps(variant, best)} · свой вес`;
  const reps = formatReps(variant, variant.plan);
  return best.weight != null ? `${sets} × ${reps} × ${best.weight} lb` : `${sets} × ${reps}`;
}

// 372 000 мс → «6:12»
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// «Пробежка 6:12 · 0.52 mi · Суставная 3:05»; у тренировок v1 — null.
export function formatWarmup(s: Session): string | null {
  if (!s.warmup) return null;
  const { run, joints } = s.warmup;
  const parts = [`Пробежка ${formatClock(run.ms)}`];
  if (run.distanceMi != null) parts.push(`${run.distanceMi} mi`);
  parts.push(`Суставная ${formatClock(joints.ms)}`);
  return parts.join(' · ');
}

export const FEEL_LABEL: Record<Feel, string> = {
  easy: 'Легко',
  normal: 'Нормально',
  hard: 'Тяжело',
};

export const RATING_LABEL: Record<Rating, string> = {
  easy: 'Легко',
  normal: 'Нормально',
  hard: 'Еле-еле',
  fail: 'Не смог',
};

// Рекорд: «80 lb», «7–11», «45 сек».
export function formatBest(variant: Variant, plan: Best): string {
  if (variant.mode === 'weight') return plan.weight != null ? `${plan.weight} lb` : '—';
  return formatReps(variant, plan);
}

// Факт подхода: «80 × 8», «свой × 10», «свой +10 × 8», «45 сек».
export function formatFact(set: SetLog, variant: Variant): string {
  if (set.factSeconds != null) return `${set.factSeconds} сек`;
  if (set.factReps == null) return '—';
  if (variant.mode === 'bodyweight') return `${set.factWeight ? `свой +${set.factWeight}` : 'свой'} × ${set.factReps}`;
  return `${set.factWeight ?? '—'} × ${set.factReps}`;
}

// План подхода без номера: «40 × 12», «свой × 5».
export function formatSetPlan(set: SetLog): string {
  if (set.planSeconds != null) return `${set.planSeconds} сек`;
  const reps = set.planRepsMax ? `${set.planReps}–${set.planRepsMax}` : `${set.planReps ?? '—'}`;
  return `${set.planWeight ?? 'свой'} × ${reps}`;
}

// Строка под упражнением: v2 — «Разминка: Легко · сегодня 80 lb · Оценка: Нормально», v1 — «Легко · сложность 7/10».
export function exerciseMeta(log: ExerciseLog, variant: Variant): string {
  if (!log.record) {
    return [log.rating ? RATING_LABEL[log.rating] : 'без оценки', log.difficulty != null ? `сложность ${log.difficulty}/10` : null]
      .filter(Boolean)
      .join(' · ');
  }
  const parts: string[] = [];
  if (variant.mode !== 'time') {
    const today = variant.mode === 'weight' && log.todayWeight != null ? ` · сегодня ${log.todayWeight} lb` : '';
    parts.push(log.feel ? `Разминка: ${FEEL_LABEL[log.feel]}${today}` : 'нет ответа после разминки');
  }
  parts.push(log.rating ? `Оценка: ${RATING_LABEL[log.rating]}` : 'без оценки');
  return parts.join(' · ');
}
