import type { AppData, BackupState } from '../types';
import { dayKey } from './dates';

// Автобэкап (SPEC_v3_3 §B3): раз в неделю при открытии приложения, хранить последние 8 файлов.

export const BACKUP_EVERY_DAYS = 7;
export const BACKUP_KEEP = 8;
const PREFIX = 'TOCHKA-Fitness-backup_';
const DAY_MS = 24 * 60 * 60 * 1000;

export const backupFileName = (now = new Date()) => `${PREFIX}${dayKey(now)}.json`;

// Свой файл бэкапа (система может добавить к имени « (1)» при совпадении).
const OWN = /^TOCHKA-Fitness-backup_(\d{4}-\d{2}-\d{2})(?: \((\d+)\))?\.json$/;
export const isBackupFile = (name: string) => OWN.test(name);

// Нужен ли автобэкап: папка выбрана и с последнего прошло ≥ 7 дней (или его ещё не было).
export function backupDue(backup: BackupState, now = new Date()): boolean {
  if (!backup.dirUri) return false;
  if (!backup.lastAt) return true;
  return now.getTime() - new Date(backup.lastAt).getTime() >= BACKUP_EVERY_DAYS * DAY_MS;
}

// Какие файлы удалить: только свои бэкапы, кроме 8 самых новых (по дате в имени).
export function backupsToDelete(names: string[], keep = BACKUP_KEEP): string[] {
  const key = (name: string) => {
    const m = name.match(OWN)!;
    return `${m[1]}#${String(Number(m[2] ?? 0)).padStart(4, '0')}`;
  };
  return names
    .filter(isBackupFile)
    .sort((a, b) => (key(a) < key(b) ? 1 : -1))
    .slice(keep);
}

export const withBackup = (d: AppData, patch: Partial<BackupState>): AppData => {
  const backup = { ...d.backup, ...patch };
  (Object.keys(backup) as (keyof BackupState)[]).forEach((k) => backup[k] === undefined && delete backup[k]);
  return { ...d, backup };
};
