import { StyleSheet, Text, View } from 'react-native';
import { getExercise, getVariant } from '../../data/program';
import { exerciseMeta, formatFact } from '../../logic/format';
import { colors } from '../../theme';
import type { ExerciseLog } from '../../types';

// Упражнение в итоге: факт по подходам, ответ после разминки, заметка.
export function ExerciseResult({ log }: { log: ExerciseLog }) {
  const variant = getVariant(getExercise(log.exerciseId), log.variant);
  const warmup = log.sets.filter((s) => s.type === 'warmup');
  const work = log.sets.filter((s) => s.type === 'work');
  const meta = exerciseMeta(log, variant);

  return (
    <View style={styles.box}>
      <Text style={styles.name}>{variant.name}</Text>
      {warmup.length > 0 && (
        <Text style={styles.sets}>Разминка: {warmup.map((s) => formatFact(s, variant)).join(' · ')}</Text>
      )}
      <Text style={styles.sets}>Рабочие: {work.length > 0 ? work.map((s) => formatFact(s, variant)).join(' · ') : '—'}</Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      {log.comment ? <Text style={styles.comment}>«{log.comment}»</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 4, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  sets: { fontSize: 15, color: colors.text, fontVariant: ['tabular-nums'] },
  meta: { fontSize: 14, color: colors.muted },
  comment: { fontSize: 14, color: colors.muted, fontStyle: 'italic' },
});
