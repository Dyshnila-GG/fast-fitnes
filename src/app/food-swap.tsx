import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { DishImage } from '../components/food/DishImage';
import { Button } from '../components/ui';
import type { DishId } from '../data/food';
import { formatDay } from '../logic/format';
import { formatNum, mealsFor, setSwap, swapDishes } from '../logic/food';
import { useStore } from '../store/AppStore';
import { colors, gap, radius } from '../theme';
import { Icon } from '../components/Icon';
import { dishName } from '../i18n/content';
import { useT } from '../i18n/useT';

// «Заменить»: другое блюдо для приёма только на эту дату.
export default function FoodSwapScreen() {
  const t = useT();
  const { day, slot } = useLocalSearchParams<{ day: string; slot: string }>();
  const { data, update } = useStore();
  const meal = mealsFor(data.food, day).find((m) => m.slot === slot);
  if (!meal) return null;

  const choose = (dish: DishId | null) => {
    update((d) => setSwap(d, day, slot, dish));
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.muted}>
        {t('swap.hint', { meal: meal.title, date: formatDay(day) })}
      </Text>
      {meal.swapped && <Button title={t('swap.reset')} variant="secondary" onPress={() => choose(null)} />}
      {swapDishes(data.food).map((dish) => {
        const id = dish.id;
        const current = meal.dishes.length === 1 && meal.dishes[0] === id;
        return (
          <Pressable
            key={id}
            onPress={() => choose(id)}
            style={({ pressed }) => [styles.row, current && styles.current, pressed && styles.pressed]}
          >
            <DishImage dish={id} style={styles.thumb} iconSize={24} />
            <View style={styles.flex}>
              <Text style={styles.name}>{dishName(dish)}</Text>
              <Text style={styles.muted}>
                ~{t('food.kcalProtein', { kcal: formatNum(dish.kcal), protein: dish.protein })}
              </Text>
            </View>
            {current && <Icon name="check" size={22} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  current: { borderColor: colors.highlight },
  pressed: { opacity: 0.7 },
  thumb: { width: 64, height: 64, borderRadius: 14 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
});
