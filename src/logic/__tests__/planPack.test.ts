import { parsePlanPack, TOCHKA_PLAN_FORMAT, TOCHKA_PLAN_SCHEMA_VERSION } from '../../planPack';

describe('TOCHKA Plan Pack', () => {
  test('accepts a minimal valid pack', () => {
    const result = parsePlanPack({
      format: TOCHKA_PLAN_FORMAT,
      schemaVersion: TOCHKA_PLAN_SCHEMA_VERSION,
      id: 'test',
      version: '1.0.0',
      title: 'Test',
    });
    expect(result.ok).toBe(true);
  });

  test('rejects history-shaped objects and unsupported formats', () => {
    expect(parsePlanPack({ version: 3, sessions: [] }).ok).toBe(false);
  });

  test('rejects future schema versions', () => {
    expect(parsePlanPack({
      format: TOCHKA_PLAN_FORMAT,
      schemaVersion: 999,
      id: 'test',
      version: '1.0.0',
      title: 'Test',
    }).ok).toBe(false);
  });
});
