// Питание (SPEC_v3 §3–6): блюда, расписание «День зала» / «Обычный день», заготовка.
// Все количества — в граммах; штучное — количество + граммы в скобках.

export type DishId =
  | 'granola'
  | 'shake'
  | 'yogurt'
  | 'eggs'
  | 'bacon_sandwich'
  | 'chicken_sandwich'
  | 'pasta'
  | 'chicken_rice'
  | 'rotisserie_rice'
  | 'salmon_rice'
  | 'salad';

export type Dish = {
  id: DishId;
  name: string;
  emoji: string; // заглушка, пока нет фото
  ingredients: string[];
  kcal: number;
  protein: number;
  steps: string[];
  salad?: boolean; // рядом салат: ингредиенты салата — отдельной строкой «Салат: …»
  note?: string; // подсказка на экране блюда
};

export const DISHES: Record<DishId, Dish> = {
  granola: {
    id: 'granola',
    name: 'Мюсли с молоком и бананом',
    emoji: '🥣',
    ingredients: ['80 г мюсли', '310 г молока', '1 банан (~120 г без кожуры)'],
    kcal: 620,
    protein: 18,
    steps: ['Мюсли в миску', 'Залить молоком', 'Сверху нарезанный банан'],
  },
  shake: {
    id: 'shake',
    name: 'Шоколадный коктейль',
    emoji: '🥤',
    ingredients: [
      '260 г молока',
      '30 г шоколадного протеина (≈1 мерная ложка)',
      '1 банан (~120 г)',
      '16 г арахисовой пасты',
      '1 пастеризованное яйцо (~50 г)',
    ],
    kcal: 540,
    protein: 43,
    steps: ['Всё в блендер, 30 сек'],
    note: 'Сырое яйцо — только пастеризованное.',
  },
  yogurt: {
    id: 'yogurt',
    name: 'Йогурт',
    emoji: '🍨',
    ingredients: ['200 г греческого йогурта', '40 г гранолы (или 1 банан ~120 г / 80 г ягод)', '7 г мёда'],
    kcal: 330,
    protein: 24,
    steps: ['Смешать'],
  },
  eggs: {
    id: 'eggs',
    name: 'Яичница',
    emoji: '🍳',
    ingredients: ['4 яйца (~200 г)', '5 г сливочного масла', 'соль', '30 г тёртого сыра (по желанию)'],
    kcal: 435,
    protein: 31,
    steps: ['Масло на сковороду, средний огонь', 'Яйца, 3–4 мин', 'В конце сыр'],
  },
  bacon_sandwich: {
    id: 'bacon_sandwich',
    name: 'Бутерброды с беконом',
    emoji: '🥓',
    ingredients: ['2 куска хлеба (~70 г)', '20 г Филадельфии', '45 г бекона (≈3 ломтика)'],
    kcal: 360,
    protein: 16,
    steps: [
      'Бекон обжарить 3–4 мин (или микроволновка 2–3 мин на бумажном полотенце)',
      'Хлеб намазать Филадельфией, сверху бекон',
    ],
  },
  chicken_sandwich: {
    id: 'chicken_sandwich',
    name: 'Сэндвич с курицей',
    emoji: '🥪',
    ingredients: [
      '2 куска хлеба (~70 г)',
      '30 г Филадельфии',
      '120 г варёной куриной грудки ломтиками',
      '20 г сыра (≈1 ломтик)',
      '30 г капусты или салата',
    ],
    kcal: 545,
    protein: 50,
    steps: ['Хлеб — Филадельфия — курица — сыр — капуста — Филадельфия — хлеб'],
  },
  pasta: {
    id: 'pasta',
    name: 'Паста с фаршем',
    emoji: '🍝',
    ingredients: ['100 г сухой пасты', '150 г говяжьего фарша 88/12', '120 г соуса маринара', '20 г пармезана'],
    kcal: 800,
    protein: 50,
    steps: ['Из заготовки: разогреть 2 мин', 'Посыпать пармезаном'],
  },
  chicken_rice: {
    id: 'chicken_rice',
    name: 'Курица с рисом и салатом',
    emoji: '🍗',
    ingredients: ['170 г готовой курицы (≈250 г сырых бёдер)', '80 г сухого риса (≈250 г готового)'],
    kcal: 825,
    protein: 53,
    steps: ['Из заготовки: курицу и рис разогреть 2 мин', 'Рядом салат'],
    salad: true,
  },
  rotisserie_rice: {
    id: 'rotisserie_rice',
    name: 'Курица-гриль с рисом и салатом',
    emoji: '🍗',
    ingredients: ['170 г мяса курицы-гриль без кожи', '80 г сухого риса'],
    kcal: 790,
    protein: 52,
    steps: ['Разогреть с рисом 2 мин', 'Рядом салат'],
    salad: true,
  },
  salmon_rice: {
    id: 'salmon_rice',
    name: 'Лосось с рисом и салатом',
    emoji: '🐟',
    ingredients: ['170 г лосося', '80 г сухого риса'],
    kcal: 825,
    protein: 46,
    steps: [
      'Лосось: масло, соль, перец',
      'Духовка 400°F 12–15 мин или аэрогриль 390°F 9–10 мин',
      'Рис разогреть, рядом салат',
    ],
    salad: true,
  },
  salad: {
    id: 'salad',
    name: 'Салат',
    emoji: '🥗',
    ingredients: ['100 г салатной смеси', '150 г огурца', '120 г помидора', '14 г оливкового масла', 'соль'],
    kcal: 150,
    protein: 2,
    steps: ['Нарезать, заправить'],
  },
};

// Блюда для «Заменить»: салат — часть блюд с рисом, отдельно не предлагается.
export const SWAP_DISHES: DishId[] = [
  'granola',
  'shake',
  'yogurt',
  'eggs',
  'bacon_sandwich',
  'chicken_sandwich',
  'pasta',
  'chicken_rice',
  'rotisserie_rice',
  'salmon_rice',
];

// Фото блюд из assets/food/<id>.jpg. Пока файлов нет — показывается эмодзи-заглушка.
// Чтобы подключить фото: положить файл и добавить строку, например `granola: require('../../assets/food/granola.jpg'),`.
export const DISH_IMAGES: Partial<Record<DishId, number>> = {};

export type DayType = 'gym' | 'rest';

export const DAY_TYPE_LABEL: Record<DayType, string> = { gym: 'День зала', rest: 'Обычный день' };

export type MealSlot = {
  id: string;
  title: string;
  time: string; // «HH:MM» по умолчанию
  dishes: DishId[];
  sunday?: DishId[]; // Вс — другое блюдо
};

export const SCHEDULE: Record<DayType, MealSlot[]> = {
  gym: [
    { id: 'pre', title: 'До зала', time: '07:00', dishes: ['yogurt'] },
    { id: 'post', title: 'После зала', time: '09:30', dishes: ['eggs', 'bacon_sandwich'] },
    { id: 'lunch', title: 'Обед', time: '13:00', dishes: ['chicken_rice'] },
    { id: 'snack', title: 'Перекус', time: '16:00', dishes: ['chicken_sandwich'] },
    { id: 'dinner', title: 'Ужин', time: '19:30', dishes: ['salmon_rice'] },
  ],
  rest: [
    { id: 'breakfast', title: 'Завтрак', time: '08:00', dishes: ['granola'] },
    { id: 'snack1', title: 'Перекус 1', time: '11:00', dishes: ['shake'] },
    { id: 'lunch', title: 'Обед', time: '13:30', dishes: ['pasta'], sunday: ['chicken_rice'] },
    { id: 'snack2', title: 'Перекус 2', time: '16:30', dishes: ['chicken_sandwich'] },
    { id: 'dinner', title: 'Ужин', time: '19:30', dishes: ['rotisserie_rice'], sunday: ['salmon_rice'] },
  ],
};

export const GYM_WEEKDAYS = [2, 4, 6]; // Вт, Чт, Сб (0 = Вс)
export const PREP_WEEKDAYS = [0, 3]; // Вс, Ср

export type PrepItem = { id: string; title: string; text: string };

// Чек-лист заготовки; паста отличается в Вс и Ср.
export function prepItems(weekday: number): PrepItem[] {
  const pasta =
    weekday === 0
      ? 'Вс — 200 г пасты + 300 г фарша (на Пн, Ср).'
      : 'Ср — 100 г пасты + 150 г фарша (на Пт).';
  return [
    {
      id: 'rice',
      title: 'Рис',
      text: 'Промыть 450 г, 675 г воды, закипит → минимальный огонь под крышкой 15 мин → 10 мин не открывать → по 250 г в контейнеры.',
    },
    {
      id: 'thighs',
      title: 'Куриные бёдра 500 г',
      text: 'Масло, соль, перец, чеснок, паприка → духовка 425°F 25–30 мин → 2 порции по 170 г.',
    },
    {
      id: 'breast',
      title: 'Куриная грудка для сэндвичей (~400 г)',
      text: 'Варить в подсоленной воде 20 мин после закипания, остудить, нарезать ломтиками.',
    },
    {
      id: 'pasta',
      title: 'Паста с фаршем',
      text: `${pasta} Фарш обжарить 8–10 мин, маринара 120 г на порцию, 5 мин, смешать с пастой, по контейнерам.`,
    },
    {
      id: 'salmon',
      title: 'Лосось',
      text: 'Переложить лосось из морозилки в холодильник накануне дня с лососем.',
    },
  ];
}
