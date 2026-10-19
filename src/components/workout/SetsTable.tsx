import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../Text';
import { colors } from '../../theme';
import type { SetLog, Variant } from '../../types';
import { Button } from '../ui';
import { Icon } from '../Icon';
import { t as tr, type Key } from '../../i18n';
import { formatWeightNum } from '../../logic/format';
import { weightToLb, weightUnit, weightValue } from '../../logic/units';
import { useT } from '../../i18n/useT';
import { RirPicker } from './RirPicker';
import { SetDecision } from './SetDecision';
import { decideAfterSet } from '../../logic/trainingEngine';
import type { Kind, Units } from '../../types';

const HELP: Record<SetLog['type'], [Key, Key]> = {
  warmup: ['sets.warmup.title', 'sets.warmup.help'],
  work: ['sets.work.title', 'sets.work.help'],
};

type Props = {
  type: SetLog['type'];
  sets: SetLog[]; // все подходы упражнения
  variant: Variant;
  onChange: (index: number, patch: Partial<SetLog>) => void;
  onCopy: (index: number) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
  engine?: { kind: Kind; units: Units; targetRir?: number; restMinSec?: number; wrongFeel?: string[] };
};

export function SetsTable({ type, sets, variant, onChange, onCopy, onRemove, onAdd, engine }: Props) {
  const t = useT();
  const rows = sets.map((s, i) => ({ s, i })).filter((r) => r.s.type === type);
  if (type === 'warmup' && rows.length === 0) return null;
  const title = t(HELP[type][0]);
  const help = t(HELP[type][1]);
  const time = variant.mode === 'time';

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
        <Text style={[styles.head, styles.plan]}>{t('report.plan')}</Text>
        <Text style={[styles.head, styles.fact]}>{t('report.fact')}</Text>
      </View>
      {rows.map(({ s, i }, n) => (
        <View key={i} style={styles.setBlock}>
          <View style={[styles.row, s.done ? styles.rowDone : styles.rowPending]}>
            <Text style={[styles.cell, styles.num]}>{n + 1}</Text>
            <Text style={[styles.cell, styles.plan]}>{planText(s, variant)}</Text>
            <View style={[styles.fact, styles.inputs]}>
              {time ? (
                <NumField value={s.factSeconds} placeholder={t('unit.sec')} onChange={(v) => onChange(i, { factSeconds: v })} />
              ) : (
                <>
                  <NumField decimal weight value={s.factWeight} placeholder={variant.mode === 'bodyweight' ? t('set.own') : weightUnit()} onChange={(v) => onChange(i, { factWeight: v })} />
                  <NumField value={s.factReps} placeholder={t('unit.reps')} onChange={(v) => onChange(i, { factReps: v })} />
                </>
              )}
            </View>
            <Pressable onPress={() => onCopy(i)} hitSlop={6} style={[styles.icon, styles.copy]}><Icon name="check" size={18} /></Pressable>
            <Pressable onPress={() => onRemove(i)} hitSlop={6} style={styles.icon}><Icon name="close" size={16} color={colors.muted} /></Pressable>
          </View>
          {type === 'work' && (s.factReps != null || s.factSeconds != null) ? <RirPicker value={s.rir} onChange={(rir)=>onChange(i,{rir})} /> : null}
          {type === 'work' && engine && s.factReps != null && s.rir != null && needsLimiter(s) ? (
            <LimiterPicker value={s.stopReason} onChange={(stopReason) => onChange(i, { stopReason })} />
          ) : null}
          {type === 'work' && engine && s.stopReason === 'other_muscle' && engine.wrongFeel?.length ? (
            <View style={styles.hintBox}>{engine.wrongFeel.map((x, k) => <Text key={k} style={styles.hintText}>• {x}</Text>)}</View>
          ) : null}
          {type === 'work' && engine && s.factReps != null && s.rir != null ? <SetDecision units={engine.units} decision={decideAfterSet({
            set:s,
            repsMin:s.planReps,
            repsMax:s.planRepsMax ?? s.planReps,
            targetRir:engine.targetRir,
            kind:engine.kind,
            units:engine.units,
            previousWeight:s.factWeight,
            restMinSec:engine.restMinSec,
          })} /> : null}
        </View>
      ))}
      <Button title={t('sets.add')} variant="secondary" small onPress={onAdd} />
    </View>
  );
}

// «Что ограничило?» (handoff §23): спрашиваем только после тяжёлого подхода — недобор или RIR 0.
function needsLimiter(s: SetLog): boolean {
  if (s.factReps == null || s.rir == null) return false;
  return s.rir === 0 || (s.planReps != null && s.factReps < s.planReps) || s.stopReason != null;
}

const LIMITERS: { value: NonNullable<SetLog['stopReason']>; label: string }[] = [
  { value: 'target', label: 'Мышца' },
  { value: 'technique', label: 'Техника' },
  { value: 'other_muscle', label: 'Другая мышца' },
  { value: 'pain', label: 'Боль' },
];

function LimiterPicker({ value, onChange }: { value?: SetLog['stopReason']; onChange: (v: SetLog['stopReason']) => void }) {
  return (
    <View style={styles.limiter}>
      <Text style={styles.limiterTitle}>Что ограничило?</Text>
      <View style={styles.limiterRow}>
        {LIMITERS.map((o) => {
          const on = value === o.value;
          return (
            <Pressable key={o.value} onPress={() => onChange(on ? undefined : o.value)} style={[styles.chip, on && styles.chipOn, o.value === 'pain' && on && styles.chipPain]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function planText(s: SetLog, variant: Variant): string {
  if (s.planSeconds != null) return `${s.planSeconds} ${tr('unit.sec')}`;
  const reps = s.planRepsMax ? `${s.planReps}–${s.planRepsMax}` : `${s.planReps ?? '—'}`;
  const weight = variant.mode === 'bodyweight' ? tr('set.own') : s.planWeight != null ? formatWeightNum(s.planWeight) : '—';
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
  weight,
}: {
  value?: number;
  onChange: (v: number | undefined) => void;
  placeholder: string;
  decimal?: boolean;
  weight?: boolean; // вес: показ и ввод в выбранных единицах, хранение — lb
}) {
  const shown = value == null ? undefined : weight ? weightValue(value) : value;
  const [text, setText] = useState(shown == null ? '' : String(shown));
  // Синхронизация, если значение поменялось извне (кнопка ✓, удаление подхода).
  useEffect(() => {
    setText((prev) => (parse(prev) === shown ? prev : shown == null ? '' : String(shown)));
  }, [shown]);

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
        const n = parse(clean);
        onChange(n != null && weight ? weightToLb(n) : n);
      }}
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  limiter: { gap: 6, marginTop: 6 },
  limiterTitle: { fontSize: 12, fontWeight: '700', color: colors.muted },
  limiterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  chipOn: { backgroundColor: colors.text, borderColor: colors.text },
  chipPain: { backgroundColor: '#FF453A', borderColor: '#FF453A' },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  chipTextOn: { color: colors.bg },
  hintBox: { marginTop: 6, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, gap: 4 },
  hintText: { fontSize: 13, color: colors.text, lineHeight: 19 },
  block: { gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  title: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.5 },
  help: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center' },
  helpText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6 },
  head: { fontSize: 12, color: colors.muted },
  setBlock: { gap: 7 },
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
});
