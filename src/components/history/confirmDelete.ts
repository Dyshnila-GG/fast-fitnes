import { t, tp } from '../../i18n';
import { Alert } from 'react-native';
import { formatShortDate } from '../../logic/format';
import { TRASH_DAYS } from '../../logic/trash';
import type { Session } from '../../types';

// Подтверждение удаления тренировки: она уходит в корзину (SPEC_v3_3 §B1).
export function confirmDeleteSession(s: Session, onDelete: () => void) {
  Alert.alert(t('history.deleteTitle', { date: formatShortDate(s.finishedAt ?? s.startedAt) }), t('history.deleteText', { days: tp('days', TRASH_DAYS) }), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('common.delete'), style: 'destructive', onPress: onDelete },
  ]);
}
