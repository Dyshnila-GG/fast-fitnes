import { applyDecisionToNextSet, decideAfterSet } from '../trainingEngine';

describe('trainingEngine', () => {
  const base = { kind: 'machine' as const, repsMin: 8, repsMax: 12, targetRir: 2, restMinSec: 150 };

  test('holds an on-target set', () => {
    expect(decideAfterSet({ ...base, set: { type:'work', factWeight:100, factReps:10, rir:2, done:true } }).type).toBe('HOLD');
  });

  test('increases at top reps when prescribed RIR is achieved', () => {
    const d=decideAfterSet({ ...base, set:{type:'work',factWeight:100,factReps:12,rir:2,done:true} });
    expect(d.type).toBe('INCREASE');
    expect(d.suggestedWeight).toBe(105);
  });

  test('asks for more rest before reducing load when rest was short', () => {
    const d=decideAfterSet({ ...base, set:{type:'work',factWeight:100,factReps:7,rir:0,actualRestSec:55,done:true} });
    expect(d.type).toBe('REST_LONGER');
    expect(d.suggestedRestSec).toBe(150);
  });

  test('reduces load when below range at failure after adequate rest', () => {
    const d=decideAfterSet({ ...base, set:{type:'work',factWeight:100,factReps:7,rir:0,actualRestSec:160,done:true} });
    expect(d.type).toBe('DECREASE');
    expect(d.suggestedWeight).toBe(95);
  });

  test('pain always stops progression', () => {
    const d=decideAfterSet({ ...base, set:{type:'work',factWeight:100,factReps:9,rir:2,stopReason:'pain',done:true} });
    expect(d.type).toBe('STOP');
  });
  test('writes an increase into the next set plan', () => {
    const current={type:'work' as const,factWeight:100,factReps:12,rir:2 as const,done:true};
    const next={type:'work' as const,planReps:8,planRepsMax:12,done:false};
    const d=decideAfterSet({...base,set:current});
    expect(applyDecisionToNextSet(current,next,d).planWeight).toBe(105);
  });
});
