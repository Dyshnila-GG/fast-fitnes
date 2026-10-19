import type { StdProductId } from './food';

// Пищевая ценность на 100 г (ориентир, USDA). Сухие крупы и макароны — в сухом виде, мясо и рыба — сырые.
export type Per100 = { kcal: number; protein: number };

export const NUTRITION: Record<StdProductId, Per100> = {
  chicken: { kcal: 120, protein: 22.5 },
  salmon: { kcal: 208, protein: 20 },
  mince: { kcal: 200, protein: 19.5 },
  bacon: { kcal: 400, protein: 13 },
  sandwich_meat: { kcal: 110, protein: 18 },
  milk: { kcal: 50, protein: 3.4 },
  greek_yogurt: { kcal: 73, protein: 10 },
  eggs: { kcal: 143, protein: 12.6 },
  pasteurized_eggs: { kcal: 143, protein: 12.6 },
  butter: { kcal: 717, protein: 0.9 },
  cheese: { kcal: 403, protein: 23 },
  philadelphia: { kcal: 342, protein: 6 },
  parmesan: { kcal: 431, protein: 38 },
  rice: { kcal: 360, protein: 6.7 },
  pasta: { kcal: 371, protein: 13 },
  muesli: { kcal: 360, protein: 10 },
  granola: { kcal: 470, protein: 10 },
  bread: { kcal: 265, protein: 9 },
  bananas: { kcal: 89, protein: 1.1 },
  salad_mix: { kcal: 17, protein: 1.5 },
  cucumbers: { kcal: 15, protein: 0.7 },
  tomatoes: { kcal: 18, protein: 0.9 },
  cabbage: { kcal: 25, protein: 1.3 },
  protein: { kcal: 380, protein: 75 },
  peanut_butter: { kcal: 588, protein: 25 },
  honey: { kcal: 304, protein: 0.3 },
  marinara: { kcal: 50, protein: 1.5 },
  olive_oil: { kcal: 884, protein: 0 },
};
