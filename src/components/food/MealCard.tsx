import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import type { DishId } from '../../data/food';
import { dishOf, dishTitle, formatMealTime, formatNum, ingredientLines, saladLine, type Meal } from '../../logic/food';
import { useStore } from '../../store/AppStore';
import type { FoodData } from '../../types';
import { colors, gap, radius } from '../../theme';
import { Button } from '../ui';
import { DishImage } from './DishImage';
import { Icon } from '../Icon';
import { t as tr } from '../../i18n';
import { dishName } from '../../i18n/content';
import { useT } from '../../i18n/useT';

// Ингредиенты блюда списком; у блюд «с салатом» салат — отдельной строкой.
export function Ingredients({ dish, withTitle }: { dish: DishId; withTitle?: boolean }) {
  const t = useT();
  const { food } = useStore().data;
  const d = dishOf(food, dish);
  if (!d) return null;
  const salad = d.salad ? saladLine(food) : undefined;
  return (
    <View style={styles.ingredients}>
      {withTitle && <Text style={styles.groupTitle}>{dishName(d)}</Text>}
      {ingredientLines(food, d).map((i, n) => (
        <Text key={`${n}-${i}`} style={styles.ingredient}>
          • {i}
        </Text>
      ))}
      {salad && <Text style={styles.ingredient}>• {salad}</Text>}
    </View>
  );
}

type Props = {
  meal: Meal;
  day: string;
  eaten: boolean;
  next?: boolean;
  onToggle: () => void;
  compact?: boolean; // без ингредиентов и «Заменить» (Главная)
};

// Рецепт блюда; у приёма из двух блюд — сначала выбор блюда.
export function openRecipe(food: FoodData, dishes: DishId[]) {
  const go = (dish: DishId) => router.push({ pathname: '/recipe', params: { dish } });
  if (dishes.length === 0) return;
  if (dishes.length === 1) return go(dishes[0]);
  Alert.alert(tr('meal.recipe'), tr('meal.whichDish'), [
    ...dishes.map((id) => ({ text: dishTitle(food, id) || id, onPress: () => go(id) })),
    { text: tr('common.cancel'), style: 'cancel' as const },
  ]);
}

export function MealCard({ meal, day, eaten, next, onToggle, compact }: Props) {
  const t = useT();
  const { food } = useStore().data;
  const open = () => router.push({ pathname: '/meal', params: { day, slot: meal.slot } });
  const multi = meal.dishes.length > 1;
  return (
    <Pressable onPress={open} style={({ pressed }) => [styles.card, next && styles.next, pressed && styles.pressed]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {meal.title} · {formatMealTime(meal.time)}
        </Text>
        {next && <Text style={styles.badge}>{t('meal.next')}</Text>}
        {eaten && (
          <View style={styles.badgeRow}>
            <Icon name="check" size={14} />
            <Text style={styles.badgeText}>{t('meal.eaten')}</Text>
          </View>
        )}
      </View>
      {meal.dishes.length > 0 && (
        <View style={styles.images}>
          {meal.dishes.map((id) => (
            <DishImage key={id} dish={id} style={styles.image} iconSize={multi ? 32 : 40} />
          ))}
        </View>
      )}
      <Text style={[styles.name, meal.dishes.length === 0 && styles.empty]}>
        {meal.dishes.length > 0 ? meal.dishes.map((id) => dishTitle(food, id)).join(' + ') : t('meal.noDish')}
      </Text>
      {meal.swapped && <Text style={styles.muted}>{t('meal.swapped')}</Text>}
      {!compact && meal.dishes.map((id) => <Ingredients key={id} dish={id} withTitle={multi} />)}
      <View style={styles.numbers}>
        <Text style={styles.kcal}>~{formatNum(meal.kcal)} {t('unit.kcal')}</Text>
        <Text style={styles.protein}>{t('food.protein', { n: meal.protein })}</Text>
      </View>
      <View style={styles.actions}>
        <Button
          title={t(eaten ? 'meal.eaten' : 'meal.eat')}
          variant={eaten ? 'secondary' : 'primary'}
          onPress={onToggle}
          style={[styles.flex, styles.tight]}
        />
        {!compact && (
          <>
            <Button
              title={t('common.replace')}
              variant="secondary"
              onPress={() => router.push({ pathname: '/food-swap', params: { day, slot: meal.slot } })}
              style={[styles.flex, styles.tight]}
            />
            <Button title={t('meal.recipe')} variant="secondary" onPress={() => openRecipe(food, meal.dishes)} style={[styles.flex, styles.tight]} />
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { backgroundColor: colors.card, borderRadius: radius, padding: 18, borderWidth: 1, borderColor: colors.border, gap: 10 },
  next: { borderColor: colors.highlight },
  pressed: { opacity: 0.8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.muted },
  badge: { fontSize: 12, fontWeight: '600', color: colors.text, backgroundColor: colors.button, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.button, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600', color: colors.text },
  images: { flexDirection: 'row', gap: 8 },
  image: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  empty: { color: colors.muted },
  muted: { fontSize: 13, color: colors.muted },
  ingredients: { gap: 2 },
  groupTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 },
  ingredient: { fontSize: 14, color: colors.muted },
  numbers: { flexDirection: 'row', alignItems: 'baseline', gap },
  kcal: { fontSize: 28, fontWeight: '800', color: colors.text },
  protein: { fontSize: 16, fontWeight: '600', color: colors.muted },
  actions: { flexDirection: 'row', gap: 8 },
  tight: { paddingHorizontal: 6 },
});
