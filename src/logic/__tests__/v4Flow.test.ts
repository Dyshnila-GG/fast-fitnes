import { defaultData } from '../../store/defaults';
import { startImportedWorkout, coachImportedSet } from '../importedSession';
import { updateSet } from '../session';

describe('v4 test workout flow',()=>{
 test('imported plan starts and engine changes the next set load',()=>{
  const d=defaultData();
  d.installedPlan={installedAt:'2026-10-18T00:00:00Z',pack:{format:'tochka-plan',schemaVersion:1,id:'test',version:'1',title:'Test',training:{id:'t',title:'T',workouts:[{id:'push',title:'Push',exercises:[{exerciseId:'chest-press',variantId:'machine',sets:3,repsMin:8,repsMax:12,targetRir:2,restMinSec:150}]}]}}};
  const started=startImportedWorkout(d,'push',new Date('2026-10-18T10:00:00Z'));
  let s=started.activeSession!;
  s={...s,exercises:s.exercises.map((log,i)=>i?log:updateSet(log,'weight',0,{factWeight:100,factReps:12,rir:4}))};
  s=coachImportedSet(s,0,0,'machine').session;
  expect(s.exercises[0].sets[1].planWeight).toBe(105);
 });
});
