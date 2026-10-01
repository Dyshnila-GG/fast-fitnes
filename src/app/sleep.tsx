import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { Button, Card } from '../components/ui';
import { formatDay } from '../logic/format';
import { dayKey } from '../logic/metrics';
import { formatSleep, garminAverage, sleepAverage, sleepScore } from '../logic/sleep';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';

// Сон: среднее за 7 и 30 дней, список ночей (тап — исправить).
export default function SleepScreen() {
  const { data } = useStore();
  const today = dayKey();
  const days = Object.keys(data.sleep).sort().reverse();
  const avg7 = sleepAverage(data.sleep, today, 7);
  const avg30 = sleepAverage(data.sleep, today, 30);
  const g7 = garminAverage(data.sleep, today, 7);
  const g30 = garminAverage(data.sleep, today, 30);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.stats}>
        <Stat label="Среднее за 7 дней" value={avg7 != null ? formatSleep(avg7) : '—'} sub={g7 != null ? `Garmin ${g7}` : undefined} />
        <Stat label="За 30 дней" value={avg30 != null ? formatSleep(avg30) : '—'} sub={g30 != null ? `Garmin ${g30}` : undefined} />
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
                  {[e.bed && e.wake ? `Лёг ${e.bed} · Встал ${e.wake}` : '', sleepScore(e)].filter(Boolean).join(' · ') || '—'}
                </Text>
              </View>
              <Text style={styles.value}>{formatSleep(e.minutes)}</Text>
            </Pressable>
          );
        })}
      </Card>
    </ScrollView>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.flex}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.big}>{value}</Text>
      {sub && <Text style={styles.muted}>{sub}</Text>}
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
