import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from '../components/ui';
import { formatDay } from '../logic/format';
import { dayKey } from '../logic/metrics';
import { formatSleep, sleepAverage, sleepMinutes } from '../logic/sleep';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';

// Сон: среднее за 7 и 30 дней, список ночей (тап — исправить).
export default function SleepScreen() {
  const { data } = useStore();
  const today = dayKey();
  const days = Object.keys(data.sleep).sort().reverse();
  const avg7 = sleepAverage(data.sleep, today, 7);
  const avg30 = sleepAverage(data.sleep, today, 30);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.stats}>
        <Stat label="Среднее за 7 дней" value={avg7 != null ? formatSleep(avg7) : '—'} />
        <Stat label="За 30 дней" value={avg30 != null ? formatSleep(avg30) : '—'} />
      </Card>
      <Button
        title={data.sleep[today] ? 'Исправить сегодняшнюю ночь' : 'Записать сон'}
        onPress={() => router.push({ pathname: '/sleep-edit', params: { day: today } })}
      />
      <Card>
        {days.length === 0 && <Text style={styles.muted}>Записей пока нет.</Text>}
        {days.map((day, i) => {
          const e = data.sleep[day];
          return (
            <Pressable
              key={day}
              onPress={() => router.push({ pathname: '/sleep-edit', params: { day } })}
              style={({ pressed }) => [styles.row, i > 0 && styles.border, pressed && styles.pressed]}
            >
              <View style={styles.flex}>
                <Text style={styles.title}>{formatDay(day)}</Text>
                <Text style={styles.muted}>
                  Лёг {e.bed} · Встал {e.wake} · качество {e.quality}/5
                </Text>
              </View>
              <Text style={styles.value}>{formatSleep(sleepMinutes(e))}</Text>
            </Pressable>
          );
        })}
      </Card>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.flex}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.big}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap, paddingBottom: 40 },
  stats: { flexDirection: 'row', gap },
  big: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  pressed: { opacity: 0.7 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  value: { fontSize: 16, fontWeight: '700', color: colors.text },
});
