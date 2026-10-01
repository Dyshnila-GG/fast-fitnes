import type { DishId } from './food';

// Фото блюд по ссылке (как GIF упражнений): загружаются и кэшируются на телефоне.
// Фото — Flickr, лицензии Creative Commons (авторство — в README). Пустая строка — заглушка.
// Своё фото пользователя важнее ссылки.
export const FOOD_IMAGES: Record<Exclude<DishId, 'salad'>, string> = {
  granola: 'https://live.staticflickr.com/3553/3566981596_ed20c44717_b.jpg',
  shake: 'https://live.staticflickr.com/4161/33941875343_be26ff4ff8_b.jpg',
  yogurt: 'https://live.staticflickr.com/5256/5537372504_df5b0d436d_b.jpg',
  eggs: 'https://live.staticflickr.com/3193/2409085893_ef652e7374_b.jpg',
  bacon_sandwich: 'https://live.staticflickr.com/3428/3389649469_8a9a75bf7e_b.jpg',
  meat_sandwich: 'https://live.staticflickr.com/3427/3866395618_5242737def_b.jpg',
  pasta: 'https://live.staticflickr.com/2210/2516258656_918d95b3a1_b.jpg',
  chicken_rice: 'https://live.staticflickr.com/3273/2597505789_12b75a3127_b.jpg',
  salmon_rice: 'https://live.staticflickr.com/3612/3299328084_3f34b19323_b.jpg',
};
