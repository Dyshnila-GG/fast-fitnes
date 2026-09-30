import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DISHES } from '../../data/food';
import { formatMealTime, formatNum, type Meal } from '../../logic/food';
import { colors, gap, radius } from '../../theme';
import { Button } from '../ui';
import { DishImage } from './DishImage';
import { Icon } from '../Icon';

export const saladLine = () => `Салат: ${DISHES.salad.ingredients.join(', ')}`;

// Ингредиенты блюда списком; у блюд с рисом салат — отдельной строкой.
export function Ingredients({ dish, withTitle }: { dish: keyof typeof DISHES; withTitle?: boolean }) {
  const d = DISHES[dish];
  return (
    <View style={styles.ingredients}>
      {withTitle && <Text style={styles.groupTitle}>{d.name}</Text>}
      {d.ingredients.map((i) => (
        <Text key={i} style={styles.ingredient}>
          • {i}
        </Text>
      ))}
      {d.salad && <Text style={styles.ingredient}>• {saladLine()}</Text>}
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

export function MealCard({ meal, day, eaten, next, onToggle, compact }: Props) {
  const open = () => router.push({ pathname: '/meal', params: { day, slot: meal.slot } });
  const multi = meal.dishes.length > 1;
  return (
    <Pressable onPress={open} style={({ pressed }) => [styles.card, next && styles.next, pressed && styles.pressed]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {meal.title} · {formatMealTime(meal.time)}
        </Text>
        {next && <Text style={styles.badge}>Следующий</Text>}
        {eaten && (
          <View style={styles.badgeRow}>
            <Icon name="check" size={14} />
            <Text style={styles.badgeText}>Съедено</Text>
          </View>
        )}
      </View>
      <View style={styles.images}>
        {meal.dishes.map((id) => (
          <DishImage key={id} dish={id} style={styles.image} iconSize={multi ? 32 : 40} />
        ))}
      </View>
      <Text style={styles.name}>{meal.dishes.map((id) => DISHES[id].name).join(' + ')}</Text>
      {meal.swapped && <Text style={styles.muted}>Замена на этот день</Text>}
      {!compact && meal.dishes.map((id) => <Ingredients key={id} dish={id} withTitle={multi} />)}
      <View style={styles.numbers}>
        <Text style={styles.kcal}>~{formatNum(meal.kcal)} ккал</Text>
        <Text style={styles.protein}>{meal.protein} г белка</Text>
      </View>
      <View style={styles.actions}>
        <Button
          title={eaten ? 'Съедено' : 'Съел'}
          variant={eaten ? 'secondary' : 'primary'}
          onPress={onToggle}
          style={styles.flex}
        />
        {!compact && (
          <Button
            title="Заменить"
            variant="secondary"
            onPress={() => router.push({ pathname: '/food-swap', params: { day, slot: meal.slot } })}
            style={styles.flex}
          />
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
  muted: { fontSize: 13, color: colors.muted },
  ingredients: { gap: 2 },
  groupTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 },
  ingredient: { fontSize: 14, color: colors.muted },
  numbers: { flexDirection: 'row', alignItems: 'baseline', gap },
  kcal: { fontSize: 28, fontWeight: '800', color: colors.text },
  protein: { fontSize: 16, fontWeight: '600', color: colors.muted },
  actions: { flexDirection: 'row', gap: 8 },
});
