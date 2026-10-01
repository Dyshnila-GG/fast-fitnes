import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { formatDay } from '../../logic/format';
import { RUNS_PER_WEEK, weekCounts } from '../../logic/home';
import { dayKey } from '../../logic/metrics';
import { formatRunTime, startRun } from '../../logic/run';
import { useStore } from '../../store/AppStore';
import { colors } from '../../theme';
import { Button, Card } from '../ui';

// «Пробежка»: счётчик недели, последняя пробежка и «Начать пробежку».
export function RunPanel() {
  const { data, update } = useStore();
  const today = dayKey();
  const { runs } = weekCounts(data, today);
  const last = Object.keys(data.runs).sort().pop();
  const lastRun = last ? data.runs[last] : undefined;

  return (
    <Card style={styles.card}>
      <View style={styles.stats}>
        <Text style={styles.big}>
          {runs}
          <Text style={styles.of}> из {RUNS_PER_WEEK}</Text>
        </Text>
        <Text style={styles.muted}>пробежек на этой неделе</Text>
      </View>
      <Text style={styles.muted}>
        {last && lastRun
          ? `Последняя: ${formatDay(last)} · ${formatRunTime(lastRun.minutes)}${lastRun.distanceMi != null ? ` · ${lastRun.distanceMi} mi` : ''}`
          : 'Пробежек пока нет'}
      </Text>
      <Button title="Начать пробежку" onPress={() => update((d) => startRun(d))} style={styles.start} />
      <Button title="Все пробежки" variant="secondary" small onPress={() => router.push('/runs')} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  stats: { gap: 2 },
  big: { fontSize: 48, fontWeight: '700', color: colors.text, letterSpacing: -1 },
  of: { fontSize: 20, fontWeight: '600', color: colors.muted },
  muted: { fontSize: 14, color: colors.muted },
  start: { minHeight: 60 },
});
