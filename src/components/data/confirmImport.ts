import { t } from '../../i18n';
import { Alert } from 'react-native';
import { finishedSessions, mergeImportedData, parseImport } from '../../logic/metrics';
import type { AppData } from '../../types';

export const describeData = (d: AppData) =>
  t('data.describe', {
    sessions: finishedSessions(d.sessions).length,
    weight: d.bodyWeight.length,
    measurements: d.measurements.length,
    food: Object.keys(d.food.eaten).length,
    sleep: Object.keys(d.sleep).length,
    runs: Object.keys(d.runs).length,
    trash: d.trash.length,
  });

// Импорт старого приложения по умолчанию ДОБАВЛЯЕТ историю к текущей.
// Тренировки/вес/замеры из нового приложения не удаляются; при конфликте даты текущие данные побеждают.
export function confirmImport(text: string, current: AppData, apply: (fn: (d: AppData) => AppData) => void, onDone?: () => void) {
  const res = parseImport(text);
  if (!res.ok) return Alert.alert(t('data.importFailed'), res.error);
  Alert.alert(
    'Добавить старые данные?',
    `Сейчас: ${describeData(current)}.\nВ файле: ${describeData(res.data)}.\n\nТекущие тренировки, вес и замеры сохранятся. Старые данные будут добавлены в историю.`,
    [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: 'Добавить',
        onPress: () => {
          apply((d) => mergeImportedData(d, res.data));
          onDone?.();
          Alert.alert('Данные добавлены', 'Новые данные сохранены, история из старого приложения добавлена.');
        },
      },
      {
        text: t('common.replace'),
        style: 'destructive',
        onPress: () => {
          apply((d) => ({ ...res.data, backup: d.backup, installedPlan: d.installedPlan ?? res.data.installedPlan }));
          onDone?.();
          Alert.alert(t('data.imported'));
        },
      },
    ],
  );
}
