import { nextInstalledWorkout, planExerciseLabel } from '../planRuntime';
import type { TochkaPlanPack } from '../../planPack';

const pack: TochkaPlanPack={format:'tochka-plan',schemaVersion:1,id:'x',version:'1',title:'x',training:{id:'t',title:'t',workouts:[
{id:'thu',title:'Thu',weekday:4,exercises:[]},{id:'sat',title:'Sat',weekday:6,exercises:[]},{id:'tue',title:'Tue',weekday:2,exercises:[]}
]}};

describe('planRuntime',()=>{
  test('finds the next workout across week boundary',()=>{
    expect(nextInstalledWorkout(pack,5)?.id).toBe('sat');
    expect(nextInstalledWorkout(pack,0)?.id).toBe('tue');
  });
  test('formats imported exercise prescription',()=>{
    expect(planExerciseLabel({exerciseId:'x',variantId:'m',sets:3,repsMin:8,repsMax:12,targetRir:2})).toBe('3 × 8–12 · RIR 2');
  });
});
