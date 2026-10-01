import { Alert } from 'react-native';
import { formatShortDate } from '../../logic/format';
import { TRASH_DAYS } from '../../logic/trash';
import type { Session } from '../../types';

// Подтверждение удаления тренировки: она уходит в корзину (SPEC_v3_3 §B1).
export function confirmDeleteSession(s: Session, onDelete: () => void) {
  Alert.alert(
    `Удалить тренировку от ${formatShortDate(s.finishedAt ?? s.startedAt)}?`,
    `Она переместится в корзину. Восстановить можно в «Профиль» → «Корзина» в течение ${TRASH_DAYS} дней.`,
    [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: onDelete },
    ],
  );
}
