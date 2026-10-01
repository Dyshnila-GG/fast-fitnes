import { formatNumber, monthShort, t, tp, weekdayName, weekdayShort } from '../i18n';
import type { Best, ExerciseLog, Feel, Plan, Rating, Session, SetLog, Variant } from '../types';
import {
  distanceUnit,
  distanceValue,
  feetInches,
  getUnits,
  heightCm,
  lengthUnit,
  lengthValue,
  weightUnit,
  weightValue,
} from './units';

// Форматирование для показа: язык — из словаря (SPEC_v3_3 §D2), единицы — по настройке (§D3).

export const weekdayOf = (w: number) => weekdayName(w);
export const shortWeekdayOf = (w: number) => weekdayShort(w);

// «28 сен 2026» / «Sep 28, 2026»
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return t('date.full', { d: d.getDate(), m: monthShort(d.getMonth()), y: d.getFullYear() });
}

// «28 сен» — без года.
export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return t('date.short', { d: d.getDate(), m: monthShort(d.getMonth()) });
}

// Локальный день «YYYY-MM-DD» → «28 сен».
export function formatShortDay(day: string): string {
  const [, m, d] = day.split('-').map(Number);
  return t('date.short', { d, m: monthShort(m - 1) });
}

// Локальный день «YYYY-MM-DD» → «28 сен 2026».
export function formatDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return t('date.full', { d, m: monthShort(m - 1), y });
}

// 21 год, 22 года, 25 лет / 21 years
export const formatAge = (age: number) => tp('years', Math.trunc(age));

// ---- Числа в единицах ----

export const formatValue = (n: number, digits = 1) => formatNumber(n, digits);

// 80 → «80 lb» / «36,5 kg»
export const formatWeight = (lb: number) => `${formatNumber(weightValue(lb))}\u00A0${weightUnit()}`;
// Тоннаж: «11 150 lb» / «5 057 kg».
export const formatTonnage = (lb: number) => `${formatNumber(Math.round(weightValue(lb)), 0)}\u00A0${weightUnit()}`;
// Только число веса в выбранных единицах (таблицы подходов).
export const formatWeightNum = (lb: number) => formatNumber(weightValue(lb));

// Рост: 72 → 6'0" / 183 cm
export function formatHeight(inches: number): string {
  if (getUnits() === 'metric') return `${heightCm(inches)}\u00A0${t('unit.cm')}`;
  const { ft, inch } = feetInches(inches);
  return `${ft}'${inch}"`;
}

// Замер: «32 in» / «81,5 cm»
export const formatLength = (inches: number) => `${formatNumber(lengthValue(inches))}\u00A0${lengthUnit()}`;

// Дистанция: «2.5 mi» / «4,02 km»
export const formatDistance = (mi: number) => `${formatNumber(distanceValue(mi), 2)}\u00A0${distanceUnit()}`;

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

const secText = (n: number) => `${n}\u00A0${t('unit.sec')}`;

export function formatReps(variant: Variant, plan: Best): string {
  if (variant.mode === 'time') return secText(plan.seconds ?? 0);
  const reps = plan.repsMax ? `${plan.reps}–${plan.repsMax}` : `${plan.reps ?? 0}`;
  return variant.perLeg ? t('reps.perLeg', { reps }) : reps;
}

// «4 × 8 · 75 lb», «3 × 8–10 · свой вес», «3 × 40 сек»
export function formatPlan(variant: Variant, plan: Plan): string {
  const base = `${plan.sets} × ${formatReps(variant, plan)}`;
  if (variant.mode === 'bodyweight') return `${base} · ${t('plan.bodyweight')}`;
  if (variant.mode === 'weight') return plan.weight != null ? `${base} · ${formatWeight(plan.weight)}` : base;
  return base;
}

// Предпросмотр: «4 × 6–10 × 75 lb», «4 × 6–10 · свой вес», «3 × 40 сек».
export function formatPreview(variant: Variant, best: Best, sets: number): string {
  if (variant.mode === 'time') return `${sets} × ${secText(best.seconds ?? 0)}`;
  if (variant.mode === 'bodyweight') return `${sets} × ${formatReps(variant, best)} · ${t('plan.bodyweight')}`;
  const reps = formatReps(variant, variant.plan);
  return best.weight != null ? `${sets} × ${reps} × ${formatWeight(best.weight)}` : `${sets} × ${reps}`;
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
  const parts = [`${t('warmup.runShort')} ${formatClock(run.ms)}`];
  if (run.distanceMi != null) parts.push(formatDistance(run.distanceMi));
  parts.push(`${t('warmup.jointsShort')} ${formatClock(joints.ms)}`);
  return parts.join(' · ');
}

export const feelLabel = (f: Feel) => t(`feel.${f}`);
export const ratingLabel = (r: Rating) => t(`rating.${r}`);

// Рекорд: «80 lb», «7–11», «45 сек».
export function formatBest(variant: Variant, plan: Best): string {
  if (variant.mode === 'weight') return plan.weight != null ? formatWeight(plan.weight) : '—';
  return formatReps(variant, plan);
}

// Факт подхода: «80 × 8», «свой × 10», «свой +10 × 8», «45 сек».
export function formatFact(set: SetLog, variant: Variant): string {
  if (set.factSeconds != null) return secText(set.factSeconds);
  if (set.factReps == null) return '—';
  if (variant.mode === 'bodyweight') {
    const own = set.factWeight ? `${t('set.own')} +${formatWeightNum(set.factWeight)}` : t('set.own');
    return `${own} × ${set.factReps}`;
  }
  return `${set.factWeight != null ? formatWeightNum(set.factWeight) : '—'} × ${set.factReps}`;
}

// План подхода без номера: «40 × 12», «свой × 5».
export function formatSetPlan(set: SetLog): string {
  if (set.planSeconds != null) return secText(set.planSeconds);
  const reps = set.planRepsMax ? `${set.planReps}–${set.planRepsMax}` : `${set.planReps ?? '—'}`;
  return `${set.planWeight != null ? formatWeightNum(set.planWeight) : t('set.own')} × ${reps}`;
}

// Строка под упражнением: v2 — «Разминка: Легко · сегодня 80 lb · Оценка: Нормально», v1 — «Легко · сложность 7/10».
export function exerciseMeta(log: ExerciseLog, variant: Variant): string {
  if (!log.record) {
    return [
      log.rating ? ratingLabel(log.rating) : t('meta.noRating'),
      log.difficulty != null ? t('meta.difficulty', { n: log.difficulty }) : null,
    ]
      .filter(Boolean)
      .join(' · ');
  }
  const parts: string[] = [];
  if (variant.mode !== 'time') {
    const today = variant.mode === 'weight' && log.todayWeight != null ? ` · ${t('meta.today', { w: formatWeight(log.todayWeight) })}` : '';
    parts.push(log.feel ? `${t('meta.warmup', { feel: feelLabel(log.feel) })}${today}` : t('meta.noFeel'));
  }
  parts.push(log.rating ? t('meta.rating', { rating: ratingLabel(log.rating) }) : t('meta.noRating'));
  return parts.join(' · ');
}
