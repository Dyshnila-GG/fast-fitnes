import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { Button, Card } from '../components/ui';
import { DAY_TYPE_LABEL, SCHEDULE, type DayType } from '../data/food';
import { formatMealTime, mealTime, resetMealTimes, shiftMealTime } from '../logic/food';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';

const STEP_MIN = 15;
const TYPES: DayType[] = ['gym', 'rest'];

// Время приёмов пищи — отдельно для «Дня зала» и «Обычного дня».
export default function FoodSettingsScreen() {
  const { data, update } = useStore();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {TYPES.map((type) => (
        <Card key={type} style={styles.card}>
          <Text style={styles.title}>{DAY_TYPE_LABEL[type]}</Text>
          {SCHEDULE[type].map((s) => (
            <View key={s.id} style={styles.row}>
              <Text style={styles.label}>{s.title}</Text>
              <Pressable onPress={() => update((d) => shiftMealTime(d, type, s.id, -STEP_MIN))} hitSlop={6} style={styles.arrow}>
                <Text style={styles.arrowText}>−</Text>
              </Pressable>
              <Text style={styles.time}>{formatMealTime(mealTime(data.food, type, s.id))}</Text>
              <Pressable onPress={() => update((d) => shiftMealTime(d, type, s.id, STEP_MIN))} hitSlop={6} style={styles.arrow}>
                <Text style={styles.arrowText}>+</Text>
              </Pressable>
            </View>
          ))}
        </Card>
      ))}
      <Text style={styles.muted}>Шаг — {STEP_MIN} мин. Промежутки между приёмами лучше держать 2.5–3.5 часа.</Text>
      <Button title="Вернуть время по умолчанию" variant="secondary" onPress={() => update(resetMealTimes)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap, paddingBottom: 40 },
  card: { gap: 10 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { flex: 1, fontSize: 16, color: colors.text },
  arrow: { width: 40, height: 36, borderRadius: 10, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 20, color: colors.text },
  time: { width: 64, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
});
