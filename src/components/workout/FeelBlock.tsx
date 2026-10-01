import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../Text';
import { feelLabel, formatWeight } from '../../logic/format';
import { weightToLb, weightUnit, weightValue } from '../../logic/units';
import { parseNum } from '../../logic/metrics';
import { cleanDecimal, inputNum } from '../../i18n';
import { colors } from '../../theme';
import type { ExerciseLog, Feel, Variant } from '../../types';
import { useT } from '../../i18n/useT';

const FEELS: Feel[] = ['easy', 'normal', 'hard'];

type Props = {
  log: ExerciseLog;
  variant: Variant;
  onFeel: (feel: Feel) => void;
  onToday: (weight: number) => void;
};

// «Как пошла разминка?» (SPEC_v2 §2.2) и вес «сегодня» для всех рабочих подходов.
export function FeelBlock({ log, variant, onFeel, onToday }: Props) {
  const t = useT();
  const record = log.record?.weight;
  const today = log.todayWeight ?? record;

  return (
    <View style={[styles.block, !log.feel && styles.pending]}>
      <Text style={styles.title}>{t('feel.title')}</Text>
      <View style={styles.row}>
        {FEELS.map((f) => {
          const active = log.feel === f;
          return (
            <Pressable key={f} onPress={() => onFeel(f)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{feelLabel(f)}</Text>
            </Pressable>
          );
        })}
      </View>
      {variant.mode === 'weight' && (
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text style={styles.label}>{t('feel.todayWeight', { u: weightUnit() })}</Text>
            <Text style={styles.meta}>{record != null ? t('feel.record', { w: formatWeight(record) }) : t('feel.noRecord')}</Text>
          </View>
          <WeightField value={today} onChange={onToday} />
        </View>
      )}
      {variant.mode === 'bodyweight' && (
        <Text style={styles.meta}>{t('feel.bodyweightHint')}</Text>
      )}
    </View>
  );
}

// Ввод в выбранных единицах (lb / kg), хранение — lb.
function WeightField({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  const shown = value == null ? undefined : weightValue(value);
  const [text, setText] = useState(inputNum(shown));
  useEffect(() => {
    setText((prev) => (parseNum(prev) === shown ? prev : inputNum(shown)));
  }, [shown]);

  return (
    <TextInput
      value={text}
      keyboardType="decimal-pad"
      returnKeyType="done"
      onChangeText={(t) => {
        const clean = cleanDecimal(t);
        setText(clean);
        const n = parseNum(clean);
        if (n != null && n > 0) onChange(weightToLb(n));
      }}
      // Пустое или нулевое значение не сохраняется — возвращаем текущее.
      onEndEditing={() => setText(inputNum(shown))}
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  block: { gap: 8, padding: 12, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  pending: { borderColor: colors.highlight },
  title: { fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
  chip: { flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: colors.button, alignItems: 'center' },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  chipTextActive: { color: colors.onPrimary, fontWeight: '700' },
  label: { fontSize: 15, color: colors.text, fontWeight: '600' },
  meta: { fontSize: 13, color: colors.muted },
  input: {
    width: 80,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    paddingVertical: 0,
  },
});
