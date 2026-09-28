import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme';
import type { SetLog, Variant } from '../../types';
import { Button } from '../ui';

const HELP: Record<SetLog['type'], [string, string]> = {
  warmup: [
    'Разминочные подходы',
    'Лёгкий вес, чтобы подготовить мышцы и суставы: 50% × 12, затем 75% × 6. Не до отказа, отдых короткий.',
  ],
  work: [
    'Рабочие подходы',
    'Основной вес по плану. Запишите фактический вес и повторы. ✓ — всё сделано по плану (копирует план в факт).',
  ],
};

type Props = {
  type: SetLog['type'];
  sets: SetLog[]; // все подходы упражнения
  variant: Variant;
  onChange: (index: number, patch: Partial<SetLog>) => void;
  onCopy: (index: number) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
};

export function SetsTable({ type, sets, variant, onChange, onCopy, onRemove, onAdd }: Props) {
  const rows = sets.map((s, i) => ({ s, i })).filter((r) => r.s.type === type);
  if (type === 'warmup' && rows.length === 0) return null;
  const [title, help] = HELP[type];
  const time = variant.mode === 'time' && type === 'work';

  return (
    <View style={styles.block}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title.toUpperCase()}</Text>
        <Pressable onPress={() => Alert.alert(title, help)} hitSlop={10} style={styles.help}>
          <Text style={styles.helpText}>?</Text>
        </Pressable>
      </View>
      <View style={styles.headRow}>
        <Text style={[styles.head, styles.num]}>№</Text>
        <Text style={[styles.head, styles.plan]}>План</Text>
        <Text style={[styles.head, styles.fact]}>Факт</Text>
      </View>
      {rows.map(({ s, i }, n) => (
        <View key={i} style={[styles.row, s.done ? styles.rowDone : styles.rowPending]}>
          <Text style={[styles.cell, styles.num]}>{n + 1}</Text>
          <Text style={[styles.cell, styles.plan]}>{planText(s, variant)}</Text>
          <View style={[styles.fact, styles.inputs]}>
            {time ? (
              <NumField value={s.factSeconds} placeholder="сек" onChange={(v) => onChange(i, { factSeconds: v })} />
            ) : (
              <>
                <NumField
                  decimal
                  value={s.factWeight}
                  placeholder={variant.mode === 'bodyweight' ? 'свой' : 'lb'}
                  onChange={(v) => onChange(i, { factWeight: v })}
                />
                <NumField value={s.factReps} placeholder="повт" onChange={(v) => onChange(i, { factReps: v })} />
              </>
            )}
          </View>
          <Pressable onPress={() => onCopy(i)} hitSlop={6} style={[styles.icon, styles.copy]}>
            <Text style={styles.copyText}>✓</Text>
          </Pressable>
          <Pressable onPress={() => onRemove(i)} hitSlop={6} style={styles.icon}>
            <Text style={styles.removeText}>✕</Text>
          </Pressable>
        </View>
      ))}
      <Button title="Добавить подход" variant="secondary" small onPress={onAdd} />
    </View>
  );
}

function planText(s: SetLog, variant: Variant): string {
  if (s.planSeconds != null) return `${s.planSeconds} сек`;
  const reps =
    s.type === 'work' && variant.plan.repsMax && s.planReps === variant.plan.reps
      ? `${s.planReps}–${variant.plan.repsMax}`
      : `${s.planReps ?? '—'}`;
  const weight = variant.mode === 'bodyweight' ? 'свой' : s.planWeight != null ? `${s.planWeight}` : '—';
  return `${weight} × ${reps}`;
}

function parse(text: string): number | undefined {
  if (text.trim() === '') return undefined;
  const n = Number(text);
  return Number.isFinite(n) ? n : undefined;
}

function NumField({
  value,
  onChange,
  placeholder,
  decimal,
}: {
  value?: number;
  onChange: (v: number | undefined) => void;
  placeholder: string;
  decimal?: boolean;
}) {
  const [text, setText] = useState(value == null ? '' : String(value));
  // Синхронизация, если значение поменялось извне (кнопка ✓, удаление подхода).
  useEffect(() => {
    setText((prev) => (parse(prev) === value ? prev : value == null ? '' : String(value)));
  }, [value]);

  return (
    <TextInput
      value={text}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      returnKeyType="done"
      onChangeText={(t) => {
        const clean = t.replace(',', '.').replace(/[^0-9.]/g, '');
        setText(clean);
        onChange(parse(clean));
      }}
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  block: { gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  title: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.5 },
  help: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center' },
  helpText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6 },
  head: { fontSize: 12, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6, paddingVertical: 6, borderRadius: 12, borderWidth: 1, backgroundColor: colors.bg },
  rowDone: { borderColor: colors.border },
  rowPending: { borderColor: colors.highlight },
  cell: { fontSize: 15, color: colors.text },
  num: { width: 18 },
  plan: { flex: 1, fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  fact: { width: 106 },
  inputs: { flexDirection: 'row', gap: 6 },
  input: {
    flex: 1,
    minWidth: 0,
    width: 50,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  icon: { width: 28, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  copy: { backgroundColor: colors.button },
  copyText: { fontSize: 16, fontWeight: '800', color: colors.text },
  removeText: { fontSize: 14, color: colors.muted },
});
