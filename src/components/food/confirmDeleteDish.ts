import { Alert } from 'react-native';
import { SHORT_WEEKDAYS } from '../../logic/format';
import { dishUsage } from '../../logic/food';
import type { FoodData } from '../../types';

// Подтверждение удаления блюда; если оно в расписании — предупреждение, из каких дней его уберут.
export function confirmDeleteDish(food: FoodData, id: string, onDelete: () => void) {
  const dish = food.dishes[id];
  const days = dishUsage(food, id);
  const order = [1, 2, 3, 4, 5, 6, 0];
  const where = order.filter((w) => days.includes(w)).map((w) => SHORT_WEEKDAYS[w]);
  const text = where.length
    ? `Блюдо стоит в расписании (${where.join(', ')}) — оно будет убрано из этих приёмов.`
    : 'Это нельзя отменить.';
  Alert.alert(`Удалить «${dish?.name ?? ''}»?`, text, [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Удалить', style: 'destructive', onPress: onDelete },
  ]);
}
