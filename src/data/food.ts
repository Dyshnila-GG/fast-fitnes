// Питание (SPEC_v3 §3–6, SPEC_v3_2 §5): блюда, расписание «День зала» / «Обычный день», продукты.
// Все количества — в граммах; штучное — количество + граммы в скобках.

// ---- Продукты для списка «Продукты на неделю» ----

export type ProductSection = 'meat' | 'dairy' | 'grains' | 'produce' | 'other';

export const PRODUCT_SECTIONS: { id: ProductSection; title: string }[] = [
  { id: 'meat', title: 'Мясо и рыба' },
  { id: 'dairy', title: 'Молочное и яйца' },
  { id: 'grains', title: 'Крупы и хлеб' },
  { id: 'produce', title: 'Овощи и фрукты' },
  { id: 'other', title: 'Прочее' },
];

// piece — вес одной штуки, г, и подпись счёта: такие продукты показываются «8 шт. (~960 г)».
export type Product = { name: string; section: ProductSection; piece?: { g: number; unit: string } };

const PRODUCT_LIST = {
  chicken: { name: 'Куриное филе (сырое)', section: 'meat' },
  salmon: { name: 'Лосось', section: 'meat' },
  mince: { name: 'Говяжий фарш 88/12', section: 'meat' },
  bacon: { name: 'Бекон', section: 'meat' },
  sandwich_meat: { name: 'Мясо для сэндвичей (готовое)', section: 'meat' },
  milk: { name: 'Молоко', section: 'dairy' },
  greek_yogurt: { name: 'Греческий йогурт', section: 'dairy' },
  eggs: { name: 'Яйца', section: 'dairy', piece: { g: 50, unit: 'шт.' } },
  pasteurized_eggs: { name: 'Яйца пастеризованные', section: 'dairy', piece: { g: 50, unit: 'шт.' } },
  butter: { name: 'Сливочное масло', section: 'dairy' },
  cheese: { name: 'Сыр', section: 'dairy' },
  philadelphia: { name: 'Филадельфия', section: 'dairy' },
  parmesan: { name: 'Пармезан', section: 'dairy' },
  rice: { name: 'Рис (сухой)', section: 'grains' },
  pasta: { name: 'Паста (сухая)', section: 'grains' },
  muesli: { name: 'Мюсли', section: 'grains' },
  granola: { name: 'Гранола', section: 'grains' },
  bread: { name: 'Хлеб', section: 'grains', piece: { g: 35, unit: 'кус.' } },
  bananas: { name: 'Бананы', section: 'produce', piece: { g: 120, unit: 'шт.' } },
  salad_mix: { name: 'Салатная смесь', section: 'produce' },
  cucumbers: { name: 'Огурцы', section: 'produce' },
  tomatoes: { name: 'Помидоры', section: 'produce' },
  cabbage: { name: 'Капуста или салат', section: 'produce' },
  protein: { name: 'Шоколадный протеин', section: 'other' },
  peanut_butter: { name: 'Арахисовая паста', section: 'other' },
  honey: { name: 'Мёд', section: 'other' },
  marinara: { name: 'Соус маринара', section: 'other' },
  olive_oil: { name: 'Оливковое масло', section: 'other' },
} satisfies Record<string, Product>;

export type ProductId = keyof typeof PRODUCT_LIST;
export const PRODUCTS: Record<ProductId, Product> = PRODUCT_LIST;

// Ингредиент для подсчёта продуктов: граммы на порцию (соль не считается).
export type DishItem = { product: ProductId; g: number };

export type DishId =
  | 'granola'
  | 'shake'
  | 'yogurt'
  | 'eggs'
  | 'bacon_sandwich'
  | 'meat_sandwich'
  | 'pasta'
  | 'chicken_rice'
  | 'salmon_rice'
  | 'salad';

export type Dish = {
  id: DishId;
  name: string;
  ingredients: string[];
  items: DishItem[]; // те же ингредиенты в граммах — для «Продуктов на неделю»
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
    ingredients: ['80 г мюсли', '310 г молока', '1 банан (~120 г без кожуры)'],
    items: [{ product: 'muesli', g: 80 }, { product: 'milk', g: 310 }, { product: 'bananas', g: 120 }],
    kcal: 620,
    protein: 18,
    steps: ['Мюсли в миску', 'Залить молоком', 'Сверху нарезанный банан'],
  },
  shake: {
    id: 'shake',
    name: 'Шоколадный коктейль',
    ingredients: [
      '260 г молока',
      '30 г шоколадного протеина (≈1 мерная ложка)',
      '1 банан (~120 г)',
      '16 г арахисовой пасты',
      '1 пастеризованное яйцо (~50 г)',
    ],
    items: [
      { product: 'milk', g: 260 },
      { product: 'protein', g: 30 },
      { product: 'bananas', g: 120 },
      { product: 'peanut_butter', g: 16 },
      { product: 'pasteurized_eggs', g: 50 },
    ],
    kcal: 540,
    protein: 43,
    steps: ['Всё в блендер, 30 сек'],
    note: 'Сырое яйцо — только пастеризованное.',
  },
  yogurt: {
    id: 'yogurt',
    name: 'Йогурт',
    ingredients: ['200 г греческого йогурта', '40 г гранолы (или 1 банан ~120 г / 80 г ягод)', '7 г мёда'],
    items: [{ product: 'greek_yogurt', g: 200 }, { product: 'granola', g: 40 }, { product: 'honey', g: 7 }],
    kcal: 330,
    protein: 24,
    steps: ['Смешать'],
  },
  eggs: {
    id: 'eggs',
    name: 'Яичница',
    ingredients: ['4 яйца (~200 г)', '5 г сливочного масла', 'соль', '30 г тёртого сыра (по желанию)'],
    items: [{ product: 'eggs', g: 200 }, { product: 'butter', g: 5 }, { product: 'cheese', g: 30 }],
    kcal: 435,
    protein: 31,
    steps: ['Масло на сковороду, средний огонь', 'Яйца, 3–4 мин', 'В конце сыр'],
  },
  bacon_sandwich: {
    id: 'bacon_sandwich',
    name: 'Бутерброды с беконом',
    ingredients: ['2 куска хлеба (~70 г)', '20 г Филадельфии', '45 г бекона (≈3 ломтика)'],
    items: [{ product: 'bread', g: 70 }, { product: 'philadelphia', g: 20 }, { product: 'bacon', g: 45 }],
    kcal: 360,
    protein: 16,
    steps: [
      'Бекон обжарить 3–4 мин (или микроволновка 2–3 мин на бумажном полотенце)',
      'Хлеб намазать Филадельфией, сверху бекон',
    ],
  },
  meat_sandwich: {
    id: 'meat_sandwich',
    name: 'Сэндвич с мясом',
    ingredients: [
      '2 куска хлеба (~70 г)',
      '30 г Филадельфии',
      '120 г готового мяса (любое: курица, индейка, ветчина)',
      '20 г сыра (≈1 ломтик)',
      '30 г капусты или салата',
    ],
    items: [
      { product: 'bread', g: 70 },
      { product: 'philadelphia', g: 30 },
      { product: 'sandwich_meat', g: 120 },
      { product: 'cheese', g: 20 },
      { product: 'cabbage', g: 30 },
    ],
    kcal: 540,
    protein: 45,
    steps: ['Хлеб — Филадельфия — мясо — сыр — капуста — Филадельфия — хлеб'],
  },
  pasta: {
    id: 'pasta',
    name: 'Паста с фаршем',
    ingredients: ['100 г сухой пасты', '150 г говяжьего фарша 88/12', '120 г соуса маринара', '20 г пармезана'],
    items: [{ product: 'pasta', g: 100 }, { product: 'mince', g: 150 }, { product: 'marinara', g: 120 }, { product: 'parmesan', g: 20 }],
    kcal: 800,
    protein: 50,
    steps: ['Из заготовки: разогреть 2 мин', 'Посыпать пармезаном'],
  },
  chicken_rice: {
    id: 'chicken_rice',
    name: 'Курица с рисом и салатом',
    ingredients: ['170 г готового куриного филе (≈230 г сырого)', '80 г сухого риса (≈250 г готового)'],
    items: [{ product: 'chicken', g: 230 }, { product: 'rice', g: 80 }],
    kcal: 755,
    protein: 62,
    steps: ['Из заготовки: курицу и рис разогреть 2 мин', 'Рядом салат'],
    salad: true,
  },
  salmon_rice: {
    id: 'salmon_rice',
    name: 'Лосось с рисом и салатом',
    ingredients: ['170 г лосося', '80 г сухого риса'],
    items: [{ product: 'salmon', g: 170 }, { product: 'rice', g: 80 }],
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
    ingredients: ['100 г салатной смеси', '150 г огурца', '120 г помидора', '14 г оливкового масла', 'соль'],
    items: [{ product: 'salad_mix', g: 100 }, { product: 'cucumbers', g: 150 }, { product: 'tomatoes', g: 120 }, { product: 'olive_oil', g: 14 }],
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
  'meat_sandwich',
  'pasta',
  'chicken_rice',
  'salmon_rice',
];

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
    { id: 'snack', title: 'Перекус', time: '16:00', dishes: ['meat_sandwich'] },
    { id: 'dinner', title: 'Ужин', time: '19:30', dishes: ['salmon_rice'] },
  ],
  rest: [
    { id: 'breakfast', title: 'Завтрак', time: '08:00', dishes: ['granola'] },
    { id: 'snack1', title: 'Перекус 1', time: '11:00', dishes: ['shake'] },
    { id: 'lunch', title: 'Обед', time: '13:30', dishes: ['pasta'], sunday: ['chicken_rice'] },
    { id: 'snack2', title: 'Перекус 2', time: '16:30', dishes: ['meat_sandwich'] },
    { id: 'dinner', title: 'Ужин', time: '19:30', dishes: ['chicken_rice'], sunday: ['salmon_rice'] },
  ],
};

export const GYM_WEEKDAYS = [2, 4, 6]; // Вт, Чт, Сб (0 = Вс)
