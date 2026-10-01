import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../Text';
import { getExercise, getVariant } from '../../data/program';
import { formatBest, formatSetPlan } from '../../logic/format';
import { startBest, warmupSets } from '../../logic/records';
import { colors } from '../../theme';
import type { Best, ExerciseLog } from '../../types';

type Props = {
  log: ExerciseLog;
  best: Best; // рекорд сейчас
  onChange: (patch: Best) => void;
};

// Строка блока «Рекорды»: было → стало (или «без изменений»), ручная правка, разминка в следующий раз.
export function RecordRow({ log, best, onChange }: Props) {
  const variant = getVariant(getExercise(log.exerciseId), log.variant);
  const before = log.record ?? startBest(variant);
  const field = variant.mode === 'weight' ? 'weight' : variant.mode === 'time' ? 'seconds' : 'reps';
  const unit = variant.mode === 'weight' ? 'lb' : variant.mode === 'time' ? 'сек' : 'повт';
  const same = before[field] === best[field];
  const warmup = warmupSets(variant, best);

  return (
    <View style={styles.box}>
      <Text style={styles.name}>{variant.name}</Text>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.change}>
            {same ? formatBest(variant, best) : `${formatBest(variant, before)} → ${formatBest(variant, best)}`}
          </Text>
          <Text style={styles.meta}>{same ? 'без изменений' : 'новый рекорд'}</Text>
        </View>
        <PlanField value={best[field]} decimal={field === 'weight'} onChange={(v) => onChange({ [field]: v })} />
        <Text style={styles.unit}>{unit}</Text>
      </View>
      {warmup.length > 0 && variant.mode === 'weight' && (
        <Text style={styles.meta}>Разминка: {warmup.map(formatSetPlan).join(' · ')}</Text>
      )}
    </View>
  );
}

function PlanField({ value, decimal, onChange }: { value?: number; decimal: boolean; onChange: (v: number) => void }) {
  const [text, setText] = useState(value == null ? '' : String(value));
  useEffect(() => {
    setText((prev) => (Number(prev) === value ? prev : value == null ? '' : String(value)));
  }, [value]);

  return (
    <TextInput
      value={text}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      returnKeyType="done"
      onChangeText={(t) => {
        const clean = t.replace(',', '.').replace(decimal ? /[^0-9.]/g : /[^0-9]/g, '');
        setText(clean);
        const n = Number(clean);
        if (clean !== '' && Number.isFinite(n) && n > 0) onChange(n);
      }}
      // Пустое или нулевое значение не сохраняется — возвращаем текущее.
      onEndEditing={() => setText(value == null ? '' : String(value))}
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  box: { gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  change: { fontSize: 20, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  meta: { fontSize: 14, color: colors.muted },
  unit: { width: 34, fontSize: 14, color: colors.muted },
  input: {
    width: 72,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    paddingVertical: 0,
  },
});
