import { defaultData } from '../../store/defaults';
import { installPlanPack } from '../planInstall';

describe('planInstall', () => {
  test('installs configuration without touching history', () => {
    const d=defaultData();
    d.sessions=[{id:'history',templateId:'tue',length:'long',startedAt:'2026-01-01T00:00:00.000Z',pausedMs:0,exercises:[]}];
    const next=installPlanPack(d,{format:'tochka-plan',schemaVersion:1,id:'p',version:'1',title:'P',profilePreset:{goal:'build_muscle'}},{installedAt:new Date('2026-01-02T00:00:00.000Z')});
    expect(next.sessions).toEqual(d.sessions);
    expect(next.installedPlan?.pack.id).toBe('p');
    expect(next.profile.goal).toBe('build_muscle');
  });
});
