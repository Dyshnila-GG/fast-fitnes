import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { getExercise, getVariant } from '../../data/program';
import { exerciseMeta, formatFact } from '../../logic/format';
import { colors } from '../../theme';
import type { ExerciseLog } from '../../types';
import { variantName } from '../../i18n/content';
import { useT } from '../../i18n/useT';

// Упражнение в итоге: факт по подходам, ответ после разминки, заметка.
export function ExerciseResult({ log }: { log: ExerciseLog }) {
  const t = useT();
  const variant = getVariant(getExercise(log.exerciseId), log.variant);
  const warmup = log.sets.filter((s) => s.type === 'warmup');
  const work = log.sets.filter((s) => s.type === 'work');
  const meta = exerciseMeta(log, variant);

  return (
    <View style={styles.box}>
      <Text style={styles.name}>{variantName(variant)}</Text>
      {warmup.length > 0 && (
        <Text style={styles.sets}>{t('result.warmup', { sets: warmup.map((s) => formatFact(s, variant)).join(' · ') })}</Text>
      )}
      <Text style={styles.sets}>{t('result.work', { sets: work.length > 0 ? work.map((s) => formatFact(s, variant)).join(' · ') : '—' })}</Text>
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
