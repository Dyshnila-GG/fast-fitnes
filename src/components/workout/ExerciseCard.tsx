import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { getExercise, getVariant } from '../../data/program';
import { formatPlan, formatRest, ratingLabel } from '../../logic/format';
import { isExerciseComplete } from '../../logic/session';
import { colors } from '../../theme';
import { needsFeel } from '../../logic/records';
import type { ExerciseLog, Feel, Kind, Mode, Rating, SetLog, Units, Variant } from '../../types';
import { Button, Card, Segmented } from '../ui';
import { ExerciseGif } from './ExerciseGif';
import { GifModal } from './GifModal';
import { FeelBlock } from './FeelBlock';
import { NoteField } from './NoteField';
import { RatingBlock } from './RatingBlock';
import { SetsTable } from './SetsTable';
import { t as tr } from '../../i18n';
import { exerciseMuscles, exerciseTitle, variantCue, variantEquipment, variantName } from '../../i18n/content';
import { useT } from '../../i18n/useT';

const kinds = (): { value: Kind; label: string }[] => [
  { value: 'machine', label: tr('kind.machine') },
  { value: 'free', label: tr('kind.free') },
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
  onRate: (rating: Rating) => void;
  onRest: () => void;
  prevNote?: string;
  prevRating?: Rating;
  v4?: boolean;
  units?: Units;
  restMinSec?: number;
  planExercise?: {
    title?: string; variantName?: string; equipment?: string; gifId?: string; cue?: string; muscles?: string;
    kind?: Kind; mode?: Mode; restMinSec?: number;
  };
};

export function ExerciseCard(props: Props) {
  const t = useT();
  const { log, number, onVariant, onSet, onCopy, onRemove, onAdd, onFeel, onToday, onNote, onRate, onRest, prevNote, prevRating, v4, units='imperial', restMinSec, planExercise } = props;
  const ex = v4 ? undefined : getExercise(log.exerciseId);
  const legacyVariant = ex ? getVariant(ex, log.variant) : undefined;
  const variant: Variant = legacyVariant ?? {
    id: log.variantId,
    kind: planExercise?.kind ?? log.variant,
    name: planExercise?.variantName ?? planExercise?.title ?? log.exerciseId,
    equipment: planExercise?.equipment ?? '',
    gifId: planExercise?.gifId ?? '',
    cue: planExercise?.cue ?? '',
    mode: planExercise?.mode ?? (log.sets.some((s) => s.planSeconds != null) ? 'time' : 'weight'),
    plan: { sets: log.sets.filter((s) => s.type === 'work').length },
    warmup: [],
  };
  const work = log.sets.filter((s) => s.type === 'work');
  const first = work[0];
  const complete = isExerciseComplete(log, !!v4);
  const [demo, setDemo] = useState(false);

  return (
    <Card style={styles.card}>
      <Text style={styles.index}>
        {number}. {ex ? exerciseTitle(ex) : (planExercise?.title ?? log.exerciseId)}
        {complete ? ` · ${t('exercise.done')}` : ''}
      </Text>
      <Text style={styles.name}>{ex ? variantName(variant) : variant.name}</Text>
      {prevRating ? <Text style={styles.prevNote}>{t('exercise.prevRating', { rating: ratingLabel(prevRating) })}</Text> : null}
      {prevNote ? <Text style={styles.prevNote}>{t('exercise.prevNote', { note: prevNote })}</Text> : null}
      <Text style={styles.meta}>
        {(ex ? variantEquipment(variant) : variant.equipment) || '—'} ·{' '}
        {formatPlan(variant, {
          sets: work.length,
          reps: first?.planReps,
          repsMax: first?.planRepsMax,
          seconds: first?.planSeconds,
          weight: first?.planWeight,
        })}
      </Text>
      {!v4 && ex && ex.variants.length > 1 && (
        <Segmented options={kinds()} value={log.variant} onChange={(k) => k !== log.variant && onVariant(k)} />
      )}
      {variant.gifId ? <Pressable onPress={() => setDemo(true)}>
        <ExerciseGif key={variant.gifId} gifId={variant.gifId} playing={!demo} />
      </Pressable> : null}
      <Text style={styles.meta}>{t('exercise.muscles', { muscles: ex ? exerciseMuscles(ex) : (planExercise?.muscles ?? '—') })}</Text>
      <View style={styles.cue}>
        <Text style={styles.cueText}>{ex ? variantCue(ex, variant) : (variant.cue || '—')}</Text>
        <Text style={styles.meta}>
          {ex ? t('exercise.tempoRest', { tempo: ex.tempo, rest: formatRest(ex.restSec) }) : t('exercise.rest', { rest: formatRest(restMinSec ?? 120) })}
        </Text>
      </View>

      <SetsTable type="warmup" sets={log.sets} variant={variant} onChange={onSet} onCopy={onCopy} onRemove={onRemove} onAdd={() => onAdd('warmup')} />
      {!v4 && needsFeel(variant) && <FeelBlock log={log} variant={variant} onFeel={onFeel} onToday={onToday} />}
      <SetsTable type="work" sets={log.sets} variant={variant} onChange={onSet} onCopy={onCopy} onRemove={onRemove} onAdd={() => onAdd('work')} engine={v4 ? {kind:variant.kind,units,targetRir:log.targetRir,restMinSec} : undefined} />
      {!v4 && <Text style={styles.meta}>{t('exercise.reserve')}</Text>}
      <Button title={t('exercise.rest', { rest: formatRest(restMinSec ?? ex?.restSec ?? 120) })} onPress={onRest} />
      {!v4 && <RatingBlock rating={log.rating} onChange={onRate} />}
      <NoteField value={log.comment} onChange={onNote} />
      {ex && variant.gifId ? <GifModal exercise={ex} variant={variant} visible={demo} onClose={() => setDemo(false)} /> : null}
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
