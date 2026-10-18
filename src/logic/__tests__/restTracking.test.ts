import type { Session } from '../../types';
import { startRest, stopRest } from '../session';

function session(): Session {
 return {id:'s',templateId:'x',length:'long',startedAt:'2026-10-18T10:00:00Z',pausedMs:0,exercises:[{exerciseId:'chest-press',variant:'machine',sets:[{type:'work',factWeight:100,factReps:10,rir:2,done:true}]}]};
}
describe('v4 rest tracking',()=>{
 test('stores actual rest on its work set',()=>{
  const started=startRest(session(),150,1000,{exerciseIndex:0,setIndex:0});
  const stopped=stopRest(started,91000);
  expect(stopped.exercises[0].sets[0].actualRestSec).toBe(90);
  expect(stopped.restEndsAt).toBeUndefined();
  expect(stopped.restFor).toBeUndefined();
 });
 test('extending target does not falsify actual elapsed rest',()=>{
  const started=startRest(session(),150,1000,{exerciseIndex:0,setIndex:0});
  const stopped=stopRest({...started,restSec:210},121000);
  expect(stopped.exercises[0].sets[0].actualRestSec).toBe(120);
 });
});
