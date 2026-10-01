import { Alert } from 'react-native';
import { finishedSessions, parseImport } from '../../logic/metrics';
import type { AppData } from '../../types';

export const describeData = (d: AppData) =>
  `тренировок: ${finishedSessions(d.sessions).length}, записей веса: ${d.bodyWeight.length}, замеров: ${d.measurements.length}, ` +
  `дней с отметками еды: ${Object.keys(d.food.eaten).length}, ночей сна: ${Object.keys(d.sleep).length}, пробежек: ${Object.keys(d.runs).length}, ` +
  `в корзине: ${d.trash.length}`;

// Импорт JSON с подтверждением «Заменить все данные?». Папка бэкапа этого телефона сохраняется.
export function confirmImport(text: string, current: AppData, apply: (fn: (d: AppData) => AppData) => void, onDone?: () => void) {
  const res = parseImport(text);
  if (!res.ok) return Alert.alert('Импорт невозможен', res.error);
  Alert.alert('Заменить все данные?', `Сейчас: ${describeData(current)}.\nВ копии: ${describeData(res.data)}.`, [
    { text: 'Отмена', style: 'cancel' },
    {
      text: 'Заменить',
      style: 'destructive',
      onPress: () => {
        apply((d) => ({ ...res.data, backup: d.backup }));
        onDone?.();
        Alert.alert('Данные импортированы');
      },
    },
  ]);
}
