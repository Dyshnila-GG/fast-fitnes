import { describe, expect, it } from '@jest/globals';
import { defaultData } from '../../store/defaults';
import { backupDue, backupFileName, backupsToDelete, withBackup } from '../backup';
import { exportData, parseImport } from '../metrics';
import { plannedReminders, setReminder } from '../reminders';

describe('автобэкап (SPEC_v3_3 §B3)', () => {
  it('имя файла — по локальному дню', () => {
    expect(backupFileName(new Date(2026, 8, 28, 23, 50))).toBe('TOCHKA-Fitness-backup_2026-09-28.json');
  });

  it('раз в 7 дней и только с выбранной папкой', () => {
    const now = new Date('2026-10-08T10:00:00.000Z');
    expect(backupDue({}, now)).toBe(false);
    expect(backupDue({ dirUri: 'content://x' }, now)).toBe(true);
    expect(backupDue({ dirUri: 'content://x', lastAt: '2026-10-01T10:00:01.000Z' }, now)).toBe(false);
    expect(backupDue({ dirUri: 'content://x', lastAt: '2026-10-01T10:00:00.000Z' }, now)).toBe(true);
  });

  it('хранятся последние 8 — удаляются старые и только свои файлы', () => {
    const names = Array.from({ length: 10 }, (_, i) => `TOCHKA-Fitness-backup_2026-0${i < 9 ? 1 : 2}-${String(i + 10)}.json`);
    const all = [...names, 'notes.txt', 'TOCHKA-Fitness-backup_2026-03-01 (1).json', 'TOCHKA-Fitness-backup_2026-03-01.json'];
    expect(backupsToDelete(all).sort()).toEqual([
      'TOCHKA-Fitness-backup_2026-01-10.json',
      'TOCHKA-Fitness-backup_2026-01-11.json',
      'TOCHKA-Fitness-backup_2026-01-12.json',
      'TOCHKA-Fitness-backup_2026-01-13.json',
    ]);
    expect(backupsToDelete(names.slice(0, 8))).toEqual([]);
  });

  it('ошибка сбрасывается, бэкап и напоминания входят в экспорт/импорт', () => {
    const d = withBackup(withBackup(defaultData(), { dirUri: 'content://x', error: 'нет' }), { error: undefined, lastAt: '2026-10-01T10:00:00.000Z' });
    expect(d.backup).toEqual({ dirUri: 'content://x', lastAt: '2026-10-01T10:00:00.000Z' });
    const withRem = setReminder(d, 'sleep', { on: false, time: '21:00' });
    const res = parseImport(exportData(withRem));
    expect(res.ok && res.data.backup).toEqual(d.backup);
    expect(res.ok && res.data.reminders.sleep).toEqual({ on: false, time: '21:00' });
  });
});

describe('напоминания (SPEC_v3_3 §B4)', () => {
  it('по умолчанию: сон ежедневно в 21:30, тренировка Вт/Чт/Сб в 5:10 с названием по дню', () => {
    const r = defaultData().reminders;
    expect(r.sleep).toEqual({ on: true, time: '21:30' });
    expect(r.workout).toEqual({ on: true, time: '05:10' });
    const p = plannedReminders(r);
    expect(p[0]).toEqual({ id: 'sleep', title: 'Сон', body: 'Через 30 минут спать. Подъём в 5:00', hour: 21, minute: 30 });
    expect(p.slice(1).map((x) => [x.weekday, x.hour, x.minute, x.body])).toEqual([
      [3, 5, 10, 'Сегодня: Грудь и плечи. Зал в 6:00'],
      [5, 5, 10, 'Сегодня: Спина и руки. Зал в 6:00'],
      [7, 5, 10, 'Сегодня: Ноги и верх. Зал в 6:00'],
    ]);
  });

  it('выключенные не планируются; неверное время при импорте — по умолчанию', () => {
    const d = setReminder(setReminder(defaultData(), 'sleep', { on: false }), 'workout', { time: '04:45' });
    expect(plannedReminders(d.reminders).map((x) => [x.id, x.hour, x.minute])).toEqual([
      ['workout-tue', 4, 45],
      ['workout-thu', 4, 45],
      ['workout-sat', 4, 45],
    ]);
    const raw = JSON.parse(exportData(defaultData()));
    raw.reminders = { sleep: { on: 'да', time: '25:00' } };
    const res = parseImport(JSON.stringify(raw));
    expect(res.ok && res.data.reminders).toEqual(defaultData().reminders);
  });
});
