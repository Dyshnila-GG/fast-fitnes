import { getExercise, getTemplate } from '../../data/program';
import { V4_PERSONAL_PLAN, V4_WORKOUTS } from '../../data/v4PersonalPlan';
import { parsePlanPack } from '../../planPack';
import { defaultData } from '../../store/defaults';
import { buildImportedSession, carriedWeight, startImportedWorkout } from '../importedSession';
import { installPlanPack } from '../planInstall';
import { finishActive, lastNote, skippedItems } from '../session';
import { validSession } from '../validate';
import type { AppData, Session } from '../../types';

const install = (): AppData => installPlanPack(defaultData(), V4_PERSONAL_PLAN, { applyProfilePreset: false });

function finishedWith(d: AppData, workoutId: string, at: string, patch: (s: Session) => Session): AppData {
  const started = startImportedWorkout(d, workoutId, new Date(at));
  const s = patch(started.activeSession!);
  return finishActive({ ...started, activeSession: s }, new Date(at));
}

describe('built-in TOCHKA v4 plan', () => {
  test('is a valid Plan Pack with Tue/Thu/Sat workouts', () => {
    expect(parsePlanPack(JSON.parse(JSON.stringify(V4_PERSONAL_PLAN))).ok).toBe(true);
    expect(V4_WORKOUTS.map((w) => w.weekday)).toEqual([2, 4, 6]);
    expect(V4_WORKOUTS.map((w) => w.exercises.length)).toEqual([7, 7, 8]);
  });

  test('every v4 workout and exercise resolves in the catalog', () => {
    for (const w of V4_WORKOUTS) {
      expect(getTemplate(w.id).title).toBe(w.title);
      for (const e of w.exercises) expect(getExercise(e.exerciseId).variants[0].id).toBe(e.variantId);
    }
  });

  test('install keeps history and starts an imported session', () => {
    const d = install();
    expect(d.installedPlan?.pack.id).toBe('tochka-v4-personal');
    const started = startImportedWorkout(d, 'v4-tue');
    expect(started.activeSession?.planSnapshot?.exercises).toHaveLength(7);
    expect(started.activeSession?.exercises[1].sets.find((x) => x.type === 'work')?.planWeight).toBe(100);
  });

  test('next session starts from the last real working weight (§44)', () => {
    let d = install();
    d = finishedWith(d, 'v4-tue', '2026-10-20T13:00:00Z', (s) => ({
      ...s,
      exercises: s.exercises.map((l) =>
        l.exerciseId !== 'chest-press'
          ? l
          : { ...l, sets: l.sets.map((x) => ({ ...x, factWeight: 105, factReps: 10, rir: 2 as const, done: true })) },
      ),
    }));
    const chest = V4_WORKOUTS[0].exercises[1];
    expect(carriedWeight(d, chest)).toBe(105);
    const next = buildImportedSession(d, V4_WORKOUTS[2]);
    expect(next.exercises[0].sets.find((x) => x.type === 'work')?.planWeight).toBe(105);
  });

  test('a too-easy last set carries an increased weight', () => {
    let d = install();
    d = finishedWith(d, 'v4-tue', '2026-10-20T13:00:00Z', (s) => ({
      ...s,
      exercises: s.exercises.map((l) =>
        l.exerciseId !== 'chest-press'
          ? l
          : { ...l, sets: l.sets.map((x) => ({ ...x, factWeight: 100, factReps: 12, rir: 4 as const, done: true })) },
      ),
    }));
    expect(carriedWeight(d, V4_WORKOUTS[0].exercises[1])).toBeGreaterThan(100);
  });

  test('without history the pack weight is used', () => {
    expect(carriedWeight(install(), V4_WORKOUTS[0].exercises[1])).toBeUndefined();
  });

  test('finished v4 sessions survive backup validation and legacy lookups', () => {
    const d = finishedWith(install(), 'v4-thu', '2026-10-22T13:00:00Z', (s) => s);
    const s = d.sessions[d.sessions.length - 1];
    expect(validSession(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(() => lastNote(d.sessions, 'Жим лёжа в Смите')).not.toThrow();
    expect(skippedItems(s).some((x) => x.includes('Тяга верхнего блока'))).toBe(true);
  });
});

describe('machine / free-weight variants', () => {
  const { switchImportedVariant } = require('../importedSession');
  const { snapshotFor, variantsOf } = require('../planVariant');
  const { decideAfterSet } = require('../trainingEngine');

  test('every v4 movement has a machine and a free-weight way with its own demo', () => {
    for (const w of V4_WORKOUTS)
      for (const e of w.exercises) {
        const kinds = variantsOf(e).map((v: { kind: string }) => v.kind).sort();
        expect(kinds).toEqual(['free', 'machine']);
        for (const v of variantsOf(e)) expect(v.mediaUrl).toMatch(/^https:\/\/static\.exercisedb\.dev\/media\/\w+\.gif$/);
        expect(getExercise(e.exerciseId).variants).toHaveLength(2);
      }
  });

  test('switching keeps done sets, reloads the rest and is remembered', () => {
    let d = startImportedWorkout(install(), 'v4-tue');
    const s0 = d.activeSession!;
    d = { ...d, activeSession: { ...s0, exercises: s0.exercises.map((l, i) => (i !== 1 ? l : { ...l, sets: l.sets.map((x, k) => (x.type === 'work' && k === l.sets.findIndex((y) => y.type === 'work') ? { ...x, factWeight: 100, factReps: 10, rir: 2 as const, done: true } : x)) })) } };
    d = switchImportedVariant(d, 1, 'dumbbell');
    const log = d.activeSession!.exercises[1];
    expect(log.variantId).toBe('dumbbell');
    expect(log.variant).toBe('free');
    expect(log.sets.find((x) => x.type === 'work' && x.done)?.factWeight).toBe(100);
    expect(log.sets.filter((x) => x.type === 'work').every((x) => x.planWeight === 30 || x.done)).toBe(true);
    expect(snapshotFor(d.activeSession!, log)?.variantName).toBe('Жим гантелей лёжа');
    expect(d.variantChoice['chest-press']).toBe('free');
    const next = startImportedWorkout({ ...d, activeSession: null }, 'v4-sat');
    expect(next.activeSession!.exercises[0].variantId).toBe('dumbbell');
  });

  test('limiter answers change the decision', () => {
    const base = { factWeight: 100, factReps: 6, rir: 0 as const, planReps: 8, planRepsMax: 12, type: 'work' as const, done: true };
    expect(decideAfterSet({ set: { ...base, stopReason: 'pain' }, repsMin: 8, repsMax: 12, kind: 'machine' }).type).toBe('STOP');
    expect(decideAfterSet({ set: { ...base, stopReason: 'technique' }, repsMin: 8, repsMax: 12, kind: 'machine' }).type).toBe('HOLD');
    expect(decideAfterSet({ set: { ...base, stopReason: 'other_muscle' }, repsMin: 8, repsMax: 12, kind: 'machine' }).reason).toBe('other_muscle');
    expect(decideAfterSet({ set: base, repsMin: 8, repsMax: 12, kind: 'machine' }).type).toBe('DECREASE');
  });

  test('an installed older built-in pack is refreshed on load', () => {
    const { migrateData } = require('../../store/migrate');
    const d = install();
    const old = { ...d, installedPlan: { ...d.installedPlan!, pack: { ...d.installedPlan!.pack, version: '1.0.0', training: { ...d.installedPlan!.pack.training!, workouts: [] } } } };
    const m = migrateData(JSON.parse(JSON.stringify(old)));
    expect(m.installedPlan.pack.version).toBe(V4_PERSONAL_PLAN.version);
    expect(m.installedPlan.pack.training.workouts).toHaveLength(3);
  });
});
