// Питание: стартовые данные (SPEC_v3_3 §C). Блюда, свои продукты и расписание хранятся в данных пользователя
// (FoodData) — здесь только стандартное меню, справочник продуктов и стартовое расписание по дням.
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

export type StdProductId = keyof typeof PRODUCT_LIST;
export const PRODUCTS: Record<StdProductId, Product> = PRODUCT_LIST;
export const isStdProduct = (id: string): id is StdProductId => id in PRODUCTS;

// Ингредиент: продукт (стандартный или свой) и граммы на порцию (соль не считается); count — штук, необязательно.
export type DishItem = { product: string; g: number; count?: number };

export type StdDishId =
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

export type DishId = string;

export type Dish = {
  id: DishId;
  name: string;
  ingredients?: string[]; // текст ингредиентов стандартного блюда; у своих и изменённых — строится из items
  items: DishItem[]; // ингредиенты в граммах — для «Продуктов на неделю»
  kcal: number;
  protein: number;
  steps?: string[]; // стандартный рецепт
  salad?: boolean; // подавать с салатом: ингредиенты салата — отдельной строкой «Салат: …»
  note?: string; // подсказка на экране блюда
  std?: StdDishId; // стандартное блюдо без изменений (для перевода стандартного контента)
};

export const SALAD: StdDishId = 'salad';

const STANDARD_DISHES: Record<StdDishId, Omit<Dish, 'std'>> = {
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

export const isStdDish = (id: string): id is StdDishId => id in STANDARD_DISHES;
export const STD_DISH_IDS = Object.keys(STANDARD_DISHES) as StdDishId[];

// Стандартные блюда — копия (данные пользователя меняются независимо).
export function standardDish(id: StdDishId): Dish {
  return JSON.parse(JSON.stringify({ ...STANDARD_DISHES[id], std: id }));
}

export function defaultDishes(): Record<DishId, Dish> {
  return Object.fromEntries(STD_DISH_IDS.map((id) => [id, standardDish(id)]));
}

export type DayType = 'gym' | 'rest';

export const GYM_WEEKDAYS = [2, 4, 6]; // Вт, Чт, Сб (0 = Вс)

// Приём пищи в расписании дня; id уникален в пределах дня (по нему — отметки «Съел» и замены).
export type MealSlot = { id: string; title: string; time: string; dishes: DishId[] };

// Стартовое расписание под режим «подъём 5:00, зал 6:00, сон 22:00» (SPEC_v3_3 §C3).
const GYM_DAY: MealSlot[] = [
  { id: 'pre', title: 'До зала', time: '05:15', dishes: ['yogurt'] },
  { id: 'post', title: 'После зала', time: '07:30', dishes: ['eggs', 'bacon_sandwich'] },
  { id: 'lunch', title: 'Обед', time: '11:30', dishes: ['chicken_rice'] },
  { id: 'snack', title: 'Перекус', time: '15:00', dishes: ['meat_sandwich'] },
  { id: 'dinner', title: 'Ужин', time: '18:30', dishes: ['salmon_rice'] },
];
const REST_DAY: MealSlot[] = [
  { id: 'breakfast', title: 'Завтрак', time: '06:00', dishes: ['granola'] },
  { id: 'snack1', title: 'Перекус', time: '09:30', dishes: ['shake'] },
  { id: 'lunch', title: 'Обед', time: '12:30', dishes: ['pasta'] },
  { id: 'snack2', title: 'Перекус', time: '15:30', dishes: ['meat_sandwich'] },
  { id: 'dinner', title: 'Ужин', time: '18:30', dishes: ['chicken_rice'] },
];
const SUNDAY: MealSlot[] = REST_DAY.map((s) =>
  s.id === 'lunch' ? { ...s, dishes: ['chicken_rice'] } : s.id === 'dinner' ? { ...s, dishes: ['salmon_rice'] } : s,
);

// Индекс — день недели JS (0 = Вс).
export function defaultSchedule(): MealSlot[][] {
  const day = (w: number) => (w === 0 ? SUNDAY : GYM_WEEKDAYS.includes(w) ? GYM_DAY : REST_DAY);
  return [0, 1, 2, 3, 4, 5, 6].map((w) => day(w).map((s) => ({ ...s, dishes: [...s.dishes] })));
}
