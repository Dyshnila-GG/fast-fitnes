import type { DishId } from './food';

// Фото блюд по ссылке (как GIF упражнений): загружаются и кэшируются на телефоне.
// Пустая строка — ссылки пока нет, показывается заглушка. Своё фото пользователя важнее ссылки.
export const FOOD_IMAGES: Record<Exclude<DishId, 'salad'>, string> = {
  granola: '',
  shake: '',
  yogurt: '',
  eggs: '',
  bacon_sandwich: '',
  meat_sandwich: '',
  pasta: '',
  chicken_rice: '',
  salmon_rice: '',
};
