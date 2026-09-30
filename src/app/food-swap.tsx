import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DishImage } from '../components/food/DishImage';
import { Button } from '../components/ui';
import { DISHES, SWAP_DISHES, type DishId } from '../data/food';
import { formatDay } from '../logic/format';
import { formatNum, mealsFor, setSwap } from '../logic/food';
import { useStore } from '../store/AppStore';
import { colors, gap, radius } from '../theme';

// «Заменить»: другое блюдо для приёма только на эту дату.
export default function FoodSwapScreen() {
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
        {meal.title} · {formatDay(day)}. Замена действует только на этот день.
      </Text>
      {meal.swapped && <Button title="Вернуть блюдо по расписанию" variant="secondary" onPress={() => choose(null)} />}
      {SWAP_DISHES.map((id) => {
        const dish = DISHES[id];
        const current = meal.dishes.length === 1 && meal.dishes[0] === id;
        return (
          <Pressable
            key={id}
            onPress={() => choose(id)}
            style={({ pressed }) => [styles.row, current && styles.current, pressed && styles.pressed]}
          >
            <DishImage dish={id} style={styles.thumb} emojiSize={30} />
            <View style={styles.flex}>
              <Text style={styles.name}>{dish.name}</Text>
              <Text style={styles.muted}>
                ~{formatNum(dish.kcal)} ккал · {dish.protein} г белка
              </Text>
            </View>
            {current && <Text style={styles.name}>✓</Text>}
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
