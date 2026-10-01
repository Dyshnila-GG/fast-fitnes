import { t, tp } from '../../i18n';
import { Alert } from 'react-native';
import { finishedSessions, parseImport } from '../../logic/metrics';
import type { AppData } from '../../types';

export const describeData = (d: AppData) =>
  t('data.describe', {
    sessions: tp('count.workouts', finishedSessions(d.sessions).length),
    weight: tp('count.weightEntries', d.bodyWeight.length),
    measurements: tp('count.measurements', d.measurements.length),
    food: tp('count.foodDays', Object.keys(d.food.eaten).length),
    sleep: tp('count.nights', Object.keys(d.sleep).length),
    runs: tp('count.runs', Object.keys(d.runs).length),
    trash: d.trash.length,
  });

// Импорт JSON с подтверждением «Заменить все данные?». Папка бэкапа этого телефона сохраняется.
export function confirmImport(text: string, current: AppData, apply: (fn: (d: AppData) => AppData) => void, onDone?: () => void) {
  const res = parseImport(text);
  if (!res.ok) return Alert.alert(t('data.importFailed'), res.error);
  Alert.alert(t('data.replaceTitle'), t('data.replaceText', { now: describeData(current), copy: describeData(res.data) }), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('common.replace'),
      style: 'destructive',
      onPress: () => {
        apply((d) => ({ ...res.data, backup: d.backup }));
        onDone?.();
        Alert.alert(t('data.imported'));
      },
    },
  ]);
}
