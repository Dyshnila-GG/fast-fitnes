import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../Text';
import { getExercise, getVariant } from '../../data/program';
import { formatBest, formatSetPlan } from '../../logic/format';
import { parseNum } from '../../logic/metrics';
import { startBest, warmupSets } from '../../logic/records';
import { cleanDecimal, inputNum } from '../../i18n';
import { colors } from '../../theme';
import type { Best, ExerciseLog } from '../../types';
import { variantName } from '../../i18n/content';
import { weightToLb, weightUnit, weightValue } from '../../logic/units';
import { useSettings } from '../../store/AppStore';
import { useT } from '../../i18n/useT';

type Props = {
  log: ExerciseLog;
  best: Best; // рекорд сейчас
  onChange: (patch: Best) => void;
};

// Строка блока «Рекорды»: было → стало (или «без изменений»), ручная правка, разминка в следующий раз.
export function RecordRow({ log, best, onChange }: Props) {
  const t = useT();
  const { units } = useSettings();
  const variant = getVariant(getExercise(log.exerciseId), log.variant);
  const before = log.record ?? startBest(variant);
  const field = variant.mode === 'weight' ? 'weight' : variant.mode === 'time' ? 'seconds' : 'reps';
  const unit = variant.mode === 'weight' ? weightUnit() : variant.mode === 'time' ? t('unit.sec') : t('unit.reps');
  const same = before[field] === best[field];
  const warmup = warmupSets(variant, best, units);

  return (
    <View style={styles.box}>
      <Text style={styles.name}>{variantName(variant)}</Text>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.change}>
            {same ? formatBest(variant, best) : `${formatBest(variant, before)} → ${formatBest(variant, best)}`}
          </Text>
          <Text style={styles.meta}>{t(same ? 'records.same' : 'records.new')}</Text>
        </View>
        <PlanField value={best[field]} weight={field === 'weight'} onChange={(v) => onChange({ [field]: v })} />
        <Text style={styles.unit}>{unit}</Text>
      </View>
      {warmup.length > 0 && variant.mode === 'weight' && (
        <Text style={styles.meta}>{t('result.warmup', { sets: warmup.map(formatSetPlan).join(' · ') })}</Text>
      )}
    </View>
  );
}

// weight — вес: показ и ввод в выбранных единицах, хранение — lb.
function PlanField({ value, weight: decimal, onChange }: { value?: number; weight: boolean; onChange: (v: number) => void }) {
  const shown = value == null ? undefined : decimal ? weightValue(value) : value;
  const [text, setText] = useState(inputNum(shown));
  useEffect(() => {
    setText((prev) => (parseNum(prev) === shown ? prev : inputNum(shown)));
  }, [shown]);

  return (
    <TextInput
      value={text}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      returnKeyType="done"
      onChangeText={(t) => {
        const clean = decimal ? cleanDecimal(t) : t.replace(/[^0-9]/g, '');
        setText(clean);
        const n = parseNum(clean) ?? NaN;
        if (clean !== '' && Number.isFinite(n) && n > 0) onChange(decimal ? weightToLb(n) : n);
      }}
      // Пустое или нулевое значение не сохраняется — возвращаем текущее.
      onEndEditing={() => setText(inputNum(shown))}
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
