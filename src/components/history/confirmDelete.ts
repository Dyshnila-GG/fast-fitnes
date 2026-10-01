import { Alert } from 'react-native';
import { formatShortDate } from '../../logic/format';
import type { Session } from '../../types';

// Подтверждение удаления тренировки из истории (SPEC_v3_2 §3).
export function confirmDeleteSession(s: Session, onDelete: () => void) {
  Alert.alert(`Удалить тренировку от ${formatShortDate(s.finishedAt ?? s.startedAt)}?`, 'Это нельзя отменить', [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Удалить', style: 'destructive', onPress: onDelete },
  ]);
}
