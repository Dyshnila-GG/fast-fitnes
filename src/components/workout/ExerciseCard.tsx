import { StyleSheet, Text, View } from 'react-native';
import { getExercise, getVariant } from '../../data/program';
import { formatPlan, formatRest } from '../../logic/format';
import { isExerciseComplete } from '../../logic/session';
import { colors } from '../../theme';
import type { ExerciseLog, Kind, SetLog } from '../../types';
import { Button, Card, Segmented } from '../ui';
import { RatingBlock } from './RatingBlock';
import { SetsTable } from './SetsTable';

const KINDS: { value: Kind; label: string }[] = [
  { value: 'machine', label: 'ТРЕНАЖЁР' },
  { value: 'free', label: 'СВОБОДНЫЙ ВЕС' },
];

type Props = {
  log: ExerciseLog;
  number: number;
  onVariant: (kind: Kind) => void;
  onSet: (index: number, patch: Partial<SetLog>) => void;
  onCopy: (index: number) => void;
  onRemove: (index: number) => void;
  onAdd: (type: SetLog['type']) => void;
  onRate: (patch: Partial<ExerciseLog>) => void;
  onRest: () => void;
};

export function ExerciseCard({ log, number, onVariant, onSet, onCopy, onRemove, onAdd, onRate, onRest }: Props) {
  const ex = getExercise(log.exerciseId);
  const variant = getVariant(ex, log.variant);
  const work = log.sets.filter((s) => s.type === 'work');
  const first = work[0];
  const complete = isExerciseComplete(log);

  return (
    <Card style={[styles.card, complete && styles.complete]}>
      <Text style={styles.index}>
        {number}. {ex.title}
        {complete ? ' · готово' : ''}
      </Text>
      <Text style={styles.name}>{variant.name}</Text>
      <Text style={styles.meta}>
        {variant.equipment} ·{' '}
        {formatPlan(variant, {
          sets: work.length,
          reps: first?.planReps,
          repsMax: variant.plan.repsMax,
          seconds: first?.planSeconds,
          weight: first?.planWeight,
        })}
      </Text>
      {ex.variants.length > 1 && (
        <Segmented options={KINDS} value={log.variant} onChange={(k) => k !== log.variant && onVariant(k)} />
      )}
      <Text style={styles.meta}>Мышцы: {ex.muscles}</Text>
      <View style={styles.cue}>
        <Text style={styles.cueText}>{variant.cue}</Text>
        <Text style={styles.meta}>
          Темп {ex.tempo} · отдых {formatRest(ex.restSec)}
        </Text>
      </View>

      <SetsTable type="warmup" sets={log.sets} variant={variant} onChange={onSet} onCopy={onCopy} onRemove={onRemove} onAdd={() => onAdd('warmup')} />
      <SetsTable type="work" sets={log.sets} variant={variant} onChange={onSet} onCopy={onCopy} onRemove={onRemove} onAdd={() => onAdd('work')} />
      <Button title={`Отдых ${formatRest(ex.restSec)}`} onPress={onRest} />
      <RatingBlock log={log} onChange={onRate} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, borderWidth: 2, borderColor: 'transparent' },
  complete: { borderColor: colors.successSoft },
  index: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.muted },
  cue: { gap: 4, padding: 10, borderRadius: 12, backgroundColor: colors.bg },
  cueText: { fontSize: 15, color: colors.text, lineHeight: 21 },
});
