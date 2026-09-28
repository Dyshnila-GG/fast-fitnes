import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { getExercise, getVariant } from '../../data/program';
import { formatPlanValue, formatSetPlan, RATING_LABEL } from '../../logic/format';
import { sessionPlan } from '../../logic/progression';
import { buildSets } from '../../logic/session';
import { colors } from '../../theme';
import type { ExerciseLog, Plan } from '../../types';

type Props = {
  log: ExerciseLog;
  plan: Plan; // план на следующую тренировку
  onChange: (patch: Partial<Plan>) => void;
};

// Строка блока «План на следующую тренировку»: было → стало, ручная правка, разминка от нового веса.
export function NextPlanRow({ log, plan, onChange }: Props) {
  const variant = getVariant(getExercise(log.exerciseId), log.variant);
  const before = sessionPlan(log);
  const warmup = buildSets(variant, plan, 'long').filter((s) => s.type === 'warmup');
  const field = variant.mode === 'weight' ? 'weight' : variant.mode === 'time' ? 'seconds' : 'reps';
  const unit = variant.mode === 'weight' ? 'lb' : variant.mode === 'time' ? 'сек' : 'повт';

  const set = (v: number) => {
    // Для диапазона «8–10» сдвигаем обе границы.
    if (field === 'reps' && plan.repsMax != null && plan.reps != null) {
      onChange({ reps: v, repsMax: v + (plan.repsMax - plan.reps) });
    } else {
      onChange({ [field]: v });
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.name}>{variant.name}</Text>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.change}>
            {formatPlanValue(variant, before)} → {formatPlanValue(variant, plan)}
          </Text>
          <Text style={styles.meta}>{log.rating ? RATING_LABEL[log.rating] : 'нет оценки — без изменений'}</Text>
        </View>
        <PlanField value={plan[field]} decimal={field === 'weight'} onChange={set} />
        <Text style={styles.unit}>{unit}</Text>
      </View>
      {warmup.length > 0 && (
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
