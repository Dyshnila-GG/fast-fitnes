import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { DishDetails } from '../components/food/DishDetails';
import { openRecipe } from '../components/food/MealCard';
import { Text } from '../components/Text';
import { Button, Card } from '../components/ui';
import { formatMealTime, formatNum, isEaten, mealsFor, toggleEaten } from '../logic/food';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';

// Приём пищи на дату: блюда, итог, «Съел», «Заменить», «Рецепт».
export default function MealScreen() {
  const { day, slot } = useLocalSearchParams<{ day: string; slot: string }>();
  const { data, update } = useStore();
  const meal = mealsFor(data.food, day).find((m) => m.slot === slot);
  if (!meal) return null;
  const eaten = isEaten(data.food, day, meal.slot);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: `${meal.title} · ${formatMealTime(meal.time)}` }} />
      {meal.dishes.length === 0 && (
        <Card>
          <Text style={styles.muted}>Блюдо не выбрано. Выберите его в «Еда» → «Настройки» или замените на этот день.</Text>
        </Card>
      )}
      {meal.dishes.map((id) => (
        <DishDetails key={id} id={id} />
      ))}
      <View style={styles.footer}>
        <Text style={styles.kcal}>~{formatNum(meal.kcal)} ккал</Text>
        <Text style={styles.protein}>{meal.protein} г белка</Text>
      </View>
      <View style={styles.actions}>
        <Button
          title={eaten ? 'Съедено' : 'Съел'}
          variant={eaten ? 'secondary' : 'primary'}
          onPress={() => update((d) => toggleEaten(d, day, meal.slot))}
          style={styles.action}
        />
        <Button
          title="Заменить"
          variant="secondary"
          onPress={() => router.push({ pathname: '/food-swap', params: { day, slot: meal.slot } })}
          style={styles.action}
        />
        <Button
          title="Рецепт"
          variant="secondary"
          disabled={meal.dishes.length === 0}
          onPress={() => openRecipe(data.food, meal.dishes)}
          style={styles.action}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap, paddingBottom: 40 },
  muted: { fontSize: 15, color: colors.muted },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, paddingHorizontal: 6 },
  footer: { flexDirection: 'row', alignItems: 'baseline', gap, paddingHorizontal: 4 },
  kcal: { fontSize: 28, fontWeight: '800', color: colors.text },
  protein: { fontSize: 16, fontWeight: '600', color: colors.muted },
});
