import { getExercise, getTemplate, getVariant, isLegacyTemplate } from '../data/program';
import type { AppData, Best, Exercise, ExerciseLog, Kind, Length, Rating, Session, SessionWarmup, SetLog, Stopwatch, TemplateId, Variant } from '../types';
import { newId } from './id';
import { getBest, grow, needsFeel, warmupSets, workSet } from './records';

export const SHORT_EXERCISES = 4;
export const SHORT_MAX_WORK_SETS = 3;

export function chosenKind(data: AppData, exercise: Exercise): Kind {
  const kind = data.variantChoice[exercise.id] ?? exercise.defaultVariant;
  return exercise.variants.some((v) => v.kind === kind) ? kind : exercise.variants[0].kind;
}

export function workSetCount(variant: Variant, length: Length): number {
  return length === 'short' ? Math.min(SHORT_MAX_WORK_SETS, variant.plan.sets) : variant.plan.sets;
}

// Разминка от рекорда, рабочие — по рекорду, пока нет ответа «Как пошла разминка?».
export function buildSets(variant: Variant, best: Best, length: Length): SetLog[] {
  const work = Array.from({ length: workSetCount(variant, length) }, () => workSet(variant, best));
  return [...warmupSets(variant, best), ...work];
}

export function buildExerciseLog(data: AppData, exercise: Exercise, kind: Kind, length: Length): ExerciseLog {
  const variant = getVariant(exercise, kind);
  const record = getBest(data, variant);
  return { exerciseId: exercise.id, variant: kind, record, sets: buildSets(variant, record, length) };
}

export function sessionExercises(templateId: TemplateId, length: Length): Exercise[] {
  const all = getTemplate(templateId).exercises;
  return length === 'short' ? all.slice(0, SHORT_EXERCISES) : all;
}

export function buildSession(data: AppData, templateId: TemplateId, length: Length, now = new Date()): Session {
  return {
    id: newId(),
    templateId,
    length,
    startedAt: now.toISOString(),
    pausedMs: 0,
    warmup: emptyWarmup(),
    exercises: sessionExercises(templateId, length).map((e) =>
      buildExerciseLog(data, e, chosenKind(data, e), length),
    ),
  };
}

// Старт тренировки выбранной длины (вкладка «Тренировки» и «Главная»). Экран тренировки откроется сам (см. _layout).
export function startWorkout(d: AppData, templateId: TemplateId, now = new Date()): AppData {
  if (d.activeSession) return d;
  return { ...d, activeSession: buildSession(d, templateId, d.lengthChoice[templateId] ?? 'long', now) };
}

export function setLengthChoice(d: AppData, templateId: TemplateId, length: Length): AppData {
  return { ...d, lengthChoice: { ...d.lengthChoice, [templateId]: length } };
}

export function lastFinished(data: AppData, templateId: TemplateId): Session | undefined {
  return data.sessions
    .filter((s) => s.templateId === templateId && s.finishedAt)
    .sort((a, b) => (a.finishedAt! < b.finishedAt! ? 1 : -1))[0];
}

// ---- Активная тренировка ----

export type WarmupId = keyof SessionWarmup;

export const WARMUP_ITEMS: { id: WarmupId; label: string; title: string; hint: (length: Length) => string }[] = [
  {
    id: 'run',
    label: 'пробежка',
    title: 'Пробежка на дорожке',
    hint: (length) =>
      `Цель ${length === 'short' ? '~5 мин' : '5–8 мин'}, лёгкий темп. Если ноет голеностоп — велотренажёр.`,
  },
  {
    id: 'joints',
    label: 'суставная разминка',
    title: 'Суставная разминка',
    hint: () => 'Круги голеностопом, махи ногами, ягодичный мост ×15, подъём на носки ×15, круги плечами (~3 мин).',
  },
];

export function emptyWarmup(): SessionWarmup {
  return { run: { ms: 0 }, joints: { ms: 0 } };
}

// У тренировок v1 разминки-секундомера нет.
export function warmupOf(s: Session): SessionWarmup {
  return s.warmup ?? emptyWarmup();
}

const ms = (iso?: string) => (iso ? new Date(iso).getTime() : 0);

export function pausedTotalMs(s: Session, now = Date.now()): number {
  return s.pausedMs + (s.pausedAt ? Math.max(0, now - ms(s.pausedAt)) : 0);
}

export function elapsedMs(s: Session, now = Date.now()): number {
  return Math.max(0, now - ms(s.startedAt) - pausedTotalMs(s, now));
}

// ---- Секундомеры разминки: по меткам времени, переживают перезапуск приложения ----

export function stopwatchMs(sw: Stopwatch, now = Date.now()): number {
  return sw.ms + (sw.since ? Math.max(0, now - ms(sw.since)) : 0);
}

export type StopwatchState = 'idle' | 'running' | 'paused' | 'done';

export function stopwatchState(sw: Stopwatch): StopwatchState {
  if (sw.done) return 'done';
  if (sw.since) return 'running';
  return sw.ms > 0 ? 'paused' : 'idle';
}

// Пункт разминки выполнен только после «Завершить».
export function isWarmupItemDone(sw: Stopwatch): boolean {
  return !!sw.done;
}

const pauseSw = <T extends Stopwatch>(sw: T, now: number): T => ({ ...sw, ms: stopwatchMs(sw, now), since: undefined });

function patchWarmup(s: Session, id: WarmupId, fn: (sw: SessionWarmup[WarmupId]) => SessionWarmup[WarmupId]): Session {
  const w = warmupOf(s);
  return { ...s, warmup: { ...w, [id]: fn(w[id]) } };
}

// «Старт» / «Продолжить» — с того же времени.
export function startStopwatch(s: Session, id: WarmupId, now = Date.now()): Session {
  return patchWarmup(s, id, (sw) => (sw.since || sw.done ? sw : { ...sw, since: new Date(now).toISOString() }));
}

export function pauseStopwatch(s: Session, id: WarmupId, now = Date.now()): Session {
  return patchWarmup(s, id, (sw) => pauseSw(sw, now));
}

// «Завершить» — время зафиксировано, пункт выполнен.
export function finishStopwatch(s: Session, id: WarmupId, now = Date.now()): Session {
  return patchWarmup(s, id, (sw) => ({ ...pauseSw(sw, now), done: true }));
}

// «Сброс» — время (и дистанция у пробежки) обнуляются, пункт снова не выполнен.
export function resetStopwatch(s: Session, id: WarmupId): Session {
  return patchWarmup(s, id, () => ({ ms: 0 }));
}

export function setRunDistance(s: Session, distanceMi: number | undefined): Session {
  const w = warmupOf(s);
  return { ...s, warmup: { ...w, run: { ...w.run, distanceMi } } };
}

function pauseAllStopwatches(s: Session, now: number): Session {
  if (!s.warmup) return s;
  return { ...s, warmup: { run: pauseSw(s.warmup.run, now), joints: pauseSw(s.warmup.joints, now) } };
}

// Пауза тренировки ставит на паузу и идущий секундомер разминки.
export function togglePause(s: Session, now = new Date()): Session {
  if (!s.pausedAt) return { ...pauseAllStopwatches(s, now.getTime()), pausedAt: now.toISOString() };
  return { ...s, pausedMs: pausedTotalMs(s, now.getTime()), pausedAt: undefined };
}

export function startRest(s: Session, sec: number, now = Date.now()): Session {
  return { ...s, restSec: sec, restEndsAt: new Date(now + sec * 1000).toISOString() };
}

export function shiftRest(s: Session, deltaSec: number, now = Date.now()): Session {
  if (!s.restEndsAt) return s;
  const end = Math.max(now, ms(s.restEndsAt) + deltaSec * 1000);
  return { ...s, restSec: Math.max(0, (s.restSec ?? 0) + deltaSec), restEndsAt: new Date(end).toISOString() };
}

export function stopRest(s: Session): Session {
  return { ...s, restEndsAt: undefined, restSec: undefined };
}

// Подход заполнен, когда введены обязательные поля факта.
export function isSetFilled(set: SetLog, mode: Variant['mode']): boolean {
  if (mode === 'time') return set.factSeconds != null;
  if (mode === 'weight') return set.factReps != null && set.factWeight != null;
  return set.factReps != null; // свой вес: вес необязателен
}

export function updateSet(log: ExerciseLog, mode: Variant['mode'], index: number, patch: Partial<SetLog>): ExerciseLog {
  const sets = log.sets.map((s, i) => {
    if (i !== index) return s;
    const next = { ...s, ...patch };
    return { ...next, done: isSetFilled(next, mode) };
  });
  return { ...log, sets };
}

// ✓ — вес «сегодня» и верх диапазона.
export function copyPlanToFact(log: ExerciseLog, mode: Variant['mode'], index: number): ExerciseLog {
  const s = log.sets[index];
  return updateSet(log, mode, index, {
    factWeight: s.planWeight,
    factReps: s.planRepsMax ?? s.planReps, // верх диапазона
    factSeconds: s.planSeconds,
  });
}

export function addSet(log: ExerciseLog, type: SetLog['type']): ExerciseLog {
  const same = log.sets.filter((s) => s.type === type);
  const last = same[same.length - 1];
  const set: SetLog = {
    type,
    planWeight: last?.planWeight,
    planReps: last?.planReps,
    planRepsMax: last?.planRepsMax,
    planSeconds: last?.planSeconds,
    done: false,
  };
  // Разминочные — перед рабочими.
  const at = type === 'warmup' ? log.sets.filter((s) => s.type === 'warmup').length : log.sets.length;
  return { ...log, sets: [...log.sets.slice(0, at), set, ...log.sets.slice(at)] };
}

export function removeSet(log: ExerciseLog, index: number): ExerciseLog {
  return { ...log, sets: log.sets.filter((_, i) => i !== index) };
}

export function hasFacts(log: ExerciseLog): boolean {
  return log.sets.some((s) => s.factWeight != null || s.factReps != null || s.factSeconds != null);
}

const variantOf = (log: ExerciseLog) => getVariant(getExercise(log.exerciseId), log.variant);

// Заполнено: есть ответ после разминки (кроме планки), факты всех рабочих подходов и оценка.
export function isExerciseComplete(log: ExerciseLog): boolean {
  const variant = variantOf(log);
  return (!needsFeel(variant) || log.feel != null) && log.rating != null && log.sets.every((s) => s.type !== 'work' || s.done);
}

// Номер текущего упражнения: первое незавершённое (иначе последнее).
export function currentExerciseIndex(s: Session): number {
  const i = s.exercises.findIndex((e) => !isExerciseComplete(e));
  return i === -1 ? s.exercises.length - 1 : i;
}

export function skippedItems(s: Session): string[] {
  const out: string[] = [];
  const warmup = warmupOf(s);
  for (const item of WARMUP_ITEMS) {
    if (!isWarmupItemDone(warmup[item.id])) out.push(`Разминка: ${item.label}`);
  }
  for (const log of s.exercises) {
    const variant = variantOf(log);
    if (needsFeel(variant) && !log.feel) out.push(`${variant.name}: нет ответа после разминки`);
    const empty = log.sets.filter((x) => x.type === 'work' && !x.done).length;
    if (empty > 0) out.push(`${variant.name}: не заполнены рабочие подходы (${empty})`);
    if (!log.rating) out.push(`${variant.name}: нет оценки`);
  }
  return out;
}

export function finishActive(d: AppData, now = new Date()): AppData {
  const s = d.activeSession;
  if (!s) return d;
  const done: Session = {
    ...stopRest(pauseAllStopwatches(s, now.getTime())),
    pausedMs: pausedTotalMs(s, now.getTime()),
    pausedAt: undefined,
    finishedAt: now.toISOString(),
  };
  return applyRecords({ ...d, activeSession: null, sessions: [...d.sessions, done], summaryId: done.id }, done);
}

// Рост рекордов (SPEC_v2 §2.4). Тренировки v1 рекорды не меняют.
export function applyRecords(d: AppData, s: Session): AppData {
  if (isLegacyTemplate(s.templateId)) return d;
  const records = { ...d.records };
  for (const log of s.exercises) {
    const variant = variantOf(log);
    const best = { ...getBest(d, variant), ...records[variant.name] };
    records[variant.name] = grow(best, log, variant);
  }
  return { ...d, records };
}

// «Прошлая заметка» — последняя непустая заметка к этому варианту.
export function lastNote(sessions: Session[], variantName: string, exceptId?: string): string | undefined {
  const done = sessions.filter((s) => s.finishedAt && s.id !== exceptId).sort((a, b) => (a.finishedAt! < b.finishedAt! ? 1 : -1));
  for (const s of done) {
    for (const log of s.exercises) {
      if (log.comment && variantOf(log).name === variantName) return log.comment;
    }
  }
  return undefined;
}

// «В прошлый раз: …» — последняя оценка этого варианта (в т.ч. из тренировок v1).
export function lastRating(sessions: Session[], variantName: string, exceptId?: string): Rating | undefined {
  const done = sessions.filter((s) => s.finishedAt && s.id !== exceptId).sort((a, b) => (a.finishedAt! < b.finishedAt! ? 1 : -1));
  for (const s of done) {
    for (const log of s.exercises) {
      if (log.rating && variantOf(log).name === variantName) return log.rating;
    }
  }
  return undefined;
}
