import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FEEL_LABEL } from '../../logic/format';
import { parseNum } from '../../logic/metrics';
import { colors } from '../../theme';
import type { ExerciseLog, Feel, Variant } from '../../types';

const FEELS = (Object.keys(FEEL_LABEL) as Feel[]).map((value) => ({ value, label: FEEL_LABEL[value] }));

type Props = {
  log: ExerciseLog;
  variant: Variant;
  onFeel: (feel: Feel) => void;
  onToday: (weight: number) => void;
};

// «Как пошла разминка?» (SPEC_v2 §2.2) и вес «сегодня» для всех рабочих подходов.
export function FeelBlock({ log, variant, onFeel, onToday }: Props) {
  const record = log.record?.weight;
  const today = log.todayWeight ?? record;

  return (
    <View style={[styles.block, !log.feel && styles.pending]}>
      <Text style={styles.title}>КАК ПОШЛА РАЗМИНКА?</Text>
      <View style={styles.row}>
        {FEELS.map((f) => {
          const active = log.feel === f.value;
          return (
            <Pressable key={f.value} onPress={() => onFeel(f.value)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {variant.mode === 'weight' && (
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text style={styles.label}>Вес сегодня, lb</Text>
            <Text style={styles.meta}>{record != null ? `Рекорд ${record} lb` : 'Рекорда пока нет'}</Text>
          </View>
          <WeightField value={today} onChange={onToday} />
        </View>
      )}
      {variant.mode === 'bodyweight' && (
        <Text style={styles.meta}>Легко — верх диапазона, Нормально — середина, Тяжело — низ.</Text>
      )}
    </View>
  );
}

function WeightField({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(value == null ? '' : String(value));
  useEffect(() => {
    setText((prev) => (parseNum(prev) === value ? prev : value == null ? '' : String(value)));
  }, [value]);

  return (
    <TextInput
      value={text}
      keyboardType="decimal-pad"
      returnKeyType="done"
      onChangeText={(t) => {
        const clean = t.replace(',', '.').replace(/[^0-9.]/g, '');
        setText(clean);
        const n = parseNum(clean);
        if (n != null && n > 0) onChange(n);
      }}
      // Пустое или нулевое значение не сохраняется — возвращаем текущее.
      onEndEditing={() => setText(value == null ? '' : String(value))}
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
