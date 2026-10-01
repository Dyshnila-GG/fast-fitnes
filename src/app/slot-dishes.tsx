import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { DishImage } from '../components/food/DishImage';
import { Text } from '../components/Text';
import { Button } from '../components/ui';
import { formatNum, slotsOf, updateSlot } from '../logic/food';
import { useStore } from '../store/AppStore';
import { colors, gap, radius } from '../theme';

// Блюда приёма в расписании: выбор из «Меню» (одно или несколько).
export default function SlotDishesScreen() {
  const params = useLocalSearchParams<{ weekday: string; slot: string }>();
  const weekday = Number(params.weekday);
  const { data, update } = useStore();
  const slot = slotsOf(data.food, weekday).find((s) => s.id === params.slot);
  if (!slot) return null;
  const dishes = Object.values(data.food.dishes).sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  const toggle = (id: string) =>
    update((d) =>
      updateSlot(d, weekday, slot.id, { dishes: slot.dishes.includes(id) ? slot.dishes.filter((x) => x !== id) : [...slot.dishes, id] }),
    );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: slot.title || 'Приём' }} />
      <Text style={styles.muted}>Отметьте одно или несколько блюд. Их порядок — порядок выбора.</Text>
      {dishes.map((d) => {
        const on = slot.dishes.includes(d.id);
        const n = slot.dishes.indexOf(d.id) + 1;
        return (
          <Pressable
            key={d.id}
            onPress={() => toggle(d.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={({ pressed }) => [styles.row, on && styles.rowOn, pressed && styles.pressed]}
          >
            <DishImage key={d.id} dish={d.id} style={styles.thumb} iconSize={22} />
            <View style={styles.flex}>
              <Text style={styles.name}>{d.name}</Text>
              <Text style={styles.muted}>
                {formatNum(d.kcal)} ккал · {d.protein} г белка
              </Text>
            </View>
            <View style={[styles.check, on && styles.checkOn]}>
              {on ? <Text style={styles.checkText}>{n}</Text> : null}
            </View>
          </Pressable>
        );
      })}
      <Button title="Новое блюдо" variant="secondary" onPress={() => router.push('/dish-edit')} />
      <Button title="Готово" onPress={() => router.back()} />
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
  rowOn: { borderColor: colors.text },
  pressed: { opacity: 0.7 },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.highlight, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkText: { fontSize: 14, fontWeight: '800', color: colors.onPrimary },
});
