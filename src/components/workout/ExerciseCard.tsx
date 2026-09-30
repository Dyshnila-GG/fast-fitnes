import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getExercise, getVariant } from '../../data/program';
import { formatPlan, formatRest } from '../../logic/format';
import { isExerciseComplete } from '../../logic/session';
import { colors } from '../../theme';
import { needsFeel } from '../../logic/records';
import type { ExerciseLog, Feel, Kind, SetLog } from '../../types';
import { Button, Card, Segmented } from '../ui';
import { ExerciseGif } from './ExerciseGif';
import { GifModal } from './GifModal';
import { FeelBlock } from './FeelBlock';
import { NoteField } from './NoteField';
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
  onFeel: (feel: Feel) => void;
  onToday: (weight: number) => void;
  onNote: (text: string | undefined) => void;
  onRest: () => void;
  prevNote?: string;
};

export function ExerciseCard(props: Props) {
  const { log, number, onVariant, onSet, onCopy, onRemove, onAdd, onFeel, onToday, onNote, onRest, prevNote } = props;
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
      {prevNote ? <Text style={styles.prevNote}>Прошлая заметка: {prevNote}</Text> : null}
      <Text style={styles.meta}>
        {variant.equipment} ·{' '}
        {formatPlan(variant, {
          sets: work.length,
          reps: first?.planReps,
          repsMax: first?.planRepsMax,
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
      {needsFeel(variant) && <FeelBlock log={log} variant={variant} onFeel={onFeel} onToday={onToday} />}
      <SetsTable type="work" sets={log.sets} variant={variant} onChange={onSet} onCopy={onCopy} onRemove={onRemove} onAdd={() => onAdd('work')} />
      <Text style={styles.meta}>Оставляйте 1–2 повтора в запасе, не до отказа.</Text>
      <Button title={`Отдых ${formatRest(ex.restSec)}`} onPress={onRest} />
      <NoteField value={log.comment} onChange={onNote} />
      <GifModal exercise={ex} variant={variant} visible={demo} onClose={() => setDemo(false)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  index: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '800', color: colors.text },
  meta: { fontSize: 14, color: colors.muted },
  prevNote: { fontSize: 14, color: colors.muted, fontStyle: 'italic' },
  cue: { gap: 4, padding: 12, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  cueText: { fontSize: 15, color: colors.text, lineHeight: 21 },
});
