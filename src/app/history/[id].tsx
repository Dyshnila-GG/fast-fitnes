import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/ui';
import { getExercise, getTemplate, getVariant } from '../../data/program';
import { exerciseMeta, formatDate, formatDuration, formatFact, formatSetPlan, formatTime, formatWarmup } from '../../logic/format';
import { tonnage } from '../../logic/tonnage';
import { elapsedMs, WARMUP_ITEMS } from '../../logic/session';
import { useStore } from '../../store/AppStore';
import { colors, gap } from '../../theme';
import type { ExerciseLog } from '../../types';

// Детали тренировки: все подходы план/факт, ответ после разминки (v1 — оценки), заметки.
export default function SessionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useStore();
  const s = data.sessions.find((x) => x.id === id);

  if (!s || !s.finishedAt) {
    return (
      <View style={styles.content}>
        <Text style={styles.muted}>Тренировка не найдена.</Text>
      </View>
    );
  }

  // v1 — чек-лист разминки, v2 — секундомеры.
  const warmup =
    formatWarmup(s) ?? WARMUP_ITEMS.map((w) => `${s.warmupDone?.includes(w.id) ? '✓' : '✗'} ${w.label}`).join(' · ');

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: getTemplate(s.templateId).title }} />
      <Card style={styles.card}>
        <Text style={styles.title}>
          {formatDate(s.finishedAt)}, {formatTime(s.startedAt)}–{formatTime(s.finishedAt)} ·{' '}
          {s.length === 'short' ? 'короткая' : 'длинная'}
        </Text>
        <Text style={styles.muted}>
          Длительность {formatDuration(elapsedMs(s, new Date(s.finishedAt).getTime()))} · пауза {formatDuration(s.pausedMs)} · тоннаж{' '}
          {Math.round(tonnage(s))} lb
        </Text>
        <Text style={styles.muted}>Разминка: {warmup}</Text>
      </Card>
      {s.exercises.map((log) => (
        <ExerciseDetails key={log.exerciseId} log={log} />
      ))}
    </ScrollView>
  );
}

function ExerciseDetails({ log }: { log: ExerciseLog }) {
  const ex = getExercise(log.exerciseId);
  const variant = getVariant(ex, log.variant);
  const meta = exerciseMeta(log, variant);
  let warm = 0;
  let work = 0;

  return (
    <Card style={styles.card}>
      <Text style={styles.muted}>{ex.title}</Text>
      <Text style={styles.name}>{variant.name}</Text>
      <View style={styles.head}>
        <Text style={[styles.headText, styles.num]}>№</Text>
        <Text style={[styles.headText, styles.col]}>План</Text>
        <Text style={[styles.headText, styles.col]}>Факт</Text>
      </View>
      {log.sets.map((set, i) => (
        <View key={i} style={styles.row}>
          <Text style={[styles.cell, styles.num, styles.mutedCell]}>{set.type === 'warmup' ? `Р${++warm}` : `${++work}`}</Text>
          <Text style={[styles.cell, styles.col]}>{formatSetPlan(set)}</Text>
          <Text style={[styles.cell, styles.col, styles.fact]}>{formatFact(set, variant)}</Text>
        </View>
      ))}
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      {log.comment ? <Text style={styles.comment}>«{log.comment}»</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap },
  card: { gap: 6 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  head: { flexDirection: 'row', gap: 8, marginTop: 4 },
  headText: { fontSize: 12, color: colors.muted },
  row: { flexDirection: 'row', gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  num: { width: 28 },
  col: { flex: 1 },
  cell: { fontSize: 15, color: colors.text, fontVariant: ['tabular-nums'] },
  mutedCell: { color: colors.muted },
  fact: { fontWeight: '700' },
  meta: { fontSize: 14, color: colors.text, marginTop: 4 },
  comment: { fontSize: 14, color: colors.muted, fontStyle: 'italic' },
});
