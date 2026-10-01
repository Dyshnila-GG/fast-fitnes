import * as DocumentPicker from 'expo-document-picker';
import { Directory, File } from 'expo-file-system';
import { Platform } from 'react-native';
import { backupFileName, backupsToDelete, withBackup } from '../logic/backup';
import { exportData } from '../logic/metrics';
import type { AppData } from '../types';

// Папка бэкапа на телефоне — Android Storage Access Framework; доступ к ней система запоминает.
export const backupSupported = Platform.OS === 'android';

export async function pickBackupDir(): Promise<string | null> {
  try {
    const dir = await Directory.pickDirectoryAsync();
    return dir?.uri ?? null;
  } catch {
    return null; // отмена выбора
  }
}

// Имя файла по URI: у папки SAF путь закодирован в id документа («primary%3ABackup%2Fимя.json»).
const nameOf = (f: File) => decodeURIComponent(f.uri).split(/[/:]/).pop() ?? '';
const filesIn = (dir: Directory) => dir.list().filter((f): f is File => f instanceof File);

// Записывает файл бэкапа в папку и удаляет старые (оставляет 8). Ошибка — исключение, данные не меняются.
export function writeBackup(dirUri: string, data: AppData, now = new Date()): void {
  const dir = new Directory(dirUri);
  if (!dir.exists) throw new Error('missing');
  const name = backupFileName(now);
  filesIn(dir)
    .find((f) => nameOf(f) === name)
    ?.delete();
  const file = dir.createFile(name, 'application/json');
  file.write(exportData(data));
  const old = new Set(backupsToDelete(filesIn(dir).map(nameOf)));
  for (const f of filesIn(dir)) if (old.has(nameOf(f))) f.delete();
}

// Выбор файла бэкапа → его текст (null — отмена).
export async function readBackupFile(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets[0]) return null;
  return new File(res.assets[0].uri).text();
}

// Ошибка хранится кодом; текст — t('backup.dirError') на языке приложения.
export const BACKUP_DIR_ERROR = 'unavailable';

// Бэкап в выбранную папку; результат — в состоянии бэкапа (время или ошибка). Данные не трогаются.
export function runBackup(data: AppData, update: (fn: (d: AppData) => AppData) => void, now = new Date()): boolean {
  const dirUri = data.backup.dirUri;
  if (!backupSupported || !dirUri) return false;
  try {
    writeBackup(dirUri, data, now);
    update((d) => withBackup(d, { lastAt: now.toISOString(), error: undefined }));
    return true;
  } catch {
    update((d) => withBackup(d, { error: BACKUP_DIR_ERROR }));
    return false;
  }
}
