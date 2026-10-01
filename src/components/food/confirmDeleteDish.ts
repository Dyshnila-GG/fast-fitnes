import { t } from '../../i18n';
import { Alert } from 'react-native';
import { weekdayShort } from '../../i18n';
import { dishName } from '../../i18n/content';
import { dishUsage } from '../../logic/food';
import type { FoodData } from '../../types';

// Подтверждение удаления блюда; если оно в расписании — предупреждение, из каких дней его уберут.
export function confirmDeleteDish(food: FoodData, id: string, onDelete: () => void) {
  const dish = food.dishes[id];
  const days = dishUsage(food, id);
  const order = [1, 2, 3, 4, 5, 6, 0];
  const where = order.filter((w) => days.includes(w)).map(weekdayShort);
  const text = where.length ? t('dish.deleteUsed', { days: where.join(', ') }) : t('common.irreversible');
  Alert.alert(t('dish.deleteTitle', { name: dish ? dishName(dish) : '' }), text, [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('common.delete'), style: 'destructive', onPress: onDelete },
  ]);
}
