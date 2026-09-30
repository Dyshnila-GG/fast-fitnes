import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MealCard } from '../../components/food/MealCard';
import { Card } from '../../components/ui';
import { DAY_TYPE_LABEL, prepItems } from '../../data/food';
import { useNow } from '../../hooks/useNow';
import { formatDay, WEEKDAYS } from '../../logic/format';
import { dayTotals, dayType, formatNum, hasPrep, isEaten, mealsFor, nextMeal, toggleEaten, togglePrep } from '../../logic/food';
import { dayDate, dayKey, shiftDay } from '../../logic/metrics';
import { useStore } from '../../store/AppStore';
import { colors, gap } from '../../theme';

export default function FoodScreen() {
  const { data, update } = useStore();
  const now = useNow(60_000);
  const today = dayKey(new Date(now));
  const [picked, setPicked] = useState<string | null>(null);
  const day = picked ?? today;
  const setDay = (d: string) => setPicked(d === today ? null : d);

  const { food } = data;
  const meals = mealsFor(food, day);
  const totals = dayTotals(food, day);
  const nowDate = new Date(now);
  const next = day === today ? nextMeal(food, day, nowDate.getHours() * 60 + nowDate.getMinutes()) : undefined;
  const offset = Math.round((dayDate(day).getTime() - dayDate(today).getTime()) / 86_400_000);
  const near: Record<number, string> = { [-1]: 'Вчера', 0: 'Сегодня', 1: 'Завтра' };
  const dateText = near[offset] ? `${near[offset]}, ${formatDay(day)}` : formatDay(day);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <View style={styles.dateRow}>
          <Pressable onPress={() => setDay(shiftDay(day, -1))} hitSlop={8} style={styles.arrow}>
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.weekday}>{WEEKDAYS[dayDate(day).getDay()]}</Text>
            <Text style={styles.sub}>
              {dateText} · {DAY_TYPE_LABEL[dayType(day)]}
            </Text>
          </View>
          <Pressable onPress={() => setDay(shiftDay(day, 1))} hitSlop={8} style={styles.arrow}>
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        </View>
        <Text style={styles.progress}>
          Съедено {totals.eaten} из {totals.total}
        </Text>
        <Text style={styles.stat}>
          {formatNum(totals.kcalEaten)} / ~{formatNum(totals.kcalTotal)} ккал
        </Text>
        <Text style={styles.stat}>
          {totals.proteinEaten} / ~{totals.proteinTotal} г белка
        </Text>
      </Card>

      {hasPrep(day) && (
        <Card style={styles.card}>
          <Text style={styles.title}>Заготовка</Text>
          {prepItems(dayDate(day).getDay()).map((item) => {
            const done = (food.prep[day] ?? []).includes(item.id);
            return (
              <Pressable key={item.id} onPress={() => update((d) => togglePrep(d, day, item.id))} style={styles.check}>
                <Text style={styles.box}>{done ? '☑' : '☐'}</Text>
                <View style={styles.flex}>
                  <Text style={[styles.checkTitle, done && styles.doneText]}>{item.title}</Text>
                  <Text style={styles.muted}>{item.text}</Text>
                </View>
              </Pressable>
            );
          })}
        </Card>
      )}

      {meals.map((m) => (
        <MealCard
          key={m.slot}
          meal={m}
          day={day}
          eaten={isEaten(food, day, m.slot)}
          next={next?.slot === m.slot}
          onToggle={() => update((d) => toggleEaten(d, day, m.slot))}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap },
  card: { gap: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  arrow: { width: 44, height: 40, borderRadius: 12, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 24, color: colors.text, lineHeight: 28 },
  weekday: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  muted: { fontSize: 14, color: colors.muted },
  progress: { fontSize: 17, fontWeight: '600', color: colors.text, marginTop: 4 },
  stat: { fontSize: 22, fontWeight: '800', color: colors.text },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  check: { flexDirection: 'row', gap: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  box: { fontSize: 22, color: colors.text, lineHeight: 24 },
  checkTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  doneText: { color: colors.muted, textDecorationLine: 'line-through' },
});
