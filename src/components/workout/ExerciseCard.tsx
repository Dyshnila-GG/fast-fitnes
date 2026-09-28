import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getExercise, getVariant } from '../../data/program';
import { formatPlan, formatRest } from '../../logic/format';
import { isExerciseComplete } from '../../logic/session';
import { colors } from '../../theme';
import type { ExerciseLog, Kind, SetLog } from '../../types';
import { Button, Card, Segmented } from '../ui';
import { ExerciseGif } from './ExerciseGif';
import { GifModal } from './GifModal';
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
  const [demo, setDemo] = useState(false);

  return (
    <Card style={styles.card}>
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
      <Pressable onPress={() => setDemo(true)}>
        <ExerciseGif key={variant.gifId} gifId={variant.gifId} playing={!demo} />
      </Pressable>
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
      <GifModal exercise={ex} variant={variant} visible={demo} onClose={() => setDemo(false)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  index: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '800', color: colors.text },
  meta: { fontSize: 14, color: colors.muted },
  cue: { gap: 4, padding: 12, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  cueText: { fontSize: 15, color: colors.text, lineHeight: 21 },
});
