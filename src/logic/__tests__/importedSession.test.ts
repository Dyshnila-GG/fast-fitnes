import { defaultData } from '../../store/defaults';
import { buildImportedSession, startImportedWorkout } from '../importedSession';

const workout={id:'push',title:'Push',weekday:2,exercises:[{exerciseId:'chest-press',variantId:'machine',sets:3,repsMin:8,repsMax:12,targetRir:2,restMinSec:150,restMaxSec:180}]};

describe('importedSession',()=>{
  test('creates a runnable session and snapshots the prescription',()=>{
    const d=defaultData();
    const s=buildImportedSession(d,workout,new Date('2026-10-18T12:00:00Z'));
    expect(s.templateId).toBe('push');
    expect(s.planSnapshot?.title).toBe('Push');
    expect(s.exercises[0].sets).toHaveLength(3);
    expect(s.exercises[0].targetRir).toBe(2);
  });
  test('starts only workouts present in installed pack',()=>{
    const d=defaultData();
    d.installedPlan={installedAt:'2026-10-18T00:00:00Z',pack:{format:'tochka-plan',schemaVersion:1,id:'p',version:'1',title:'P',training:{id:'t',title:'T',workouts:[workout]}}};
    expect(startImportedWorkout(d,'push').activeSession?.templateId).toBe('push');
    expect(startImportedWorkout(d,'missing')).toBe(d);
  });
});
