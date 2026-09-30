import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useNow } from '../../hooks/useNow';
import { formatDuration } from '../../logic/format';
import { parseNum } from '../../logic/metrics';
import { isWarmupItemDone, stopwatchMs, WARMUP_ITEMS, type WarmupId } from '../../logic/session';
import { colors } from '../../theme';
import type { Length, SessionWarmup } from '../../types';
import { Button, Card } from '../ui';

type Props = {
  length: Length;
  warmup: SessionWarmup;
  paused: boolean;
  onStart: (id: WarmupId) => void;
  onStop: (id: WarmupId) => void;
  onDistance: (mi: number | undefined) => void;
};

// Разминка (SPEC_v2 §1a): пробежка и суставная разминка, у каждой свой секундомер.
export function WarmupBlock({ length, warmup, paused, onStart, onStop, onDistance }: Props) {
  const running = WARMUP_ITEMS.some((i) => warmup[i.id].since);
  const now = useNow(running ? 250 : 60_000);
  const complete = WARMUP_ITEMS.every((i) => isWarmupItemDone(warmup[i.id], now));

  return (
    <Card style={[styles.card, !complete && styles.pending]}>
      <Text style={styles.title}>Разминка</Text>
      {WARMUP_ITEMS.map((item) => {
        const sw = warmup[item.id];
        const ms = stopwatchMs(sw, now);
        return (
          <View key={item.id} style={[styles.item, !isWarmupItemDone(sw, now) && styles.pending]}>
            <Text style={styles.name}>{item.title}</Text>
            <Text style={styles.hint}>{item.hint(length)}</Text>
            <View style={styles.row}>
              <Text style={styles.clock}>{formatDuration(ms)}</Text>
              {sw.since ? (
                <Button title="Стоп" variant="secondary" style={styles.button} onPress={() => onStop(item.id)} />
              ) : (
                <Button title="Старт" style={styles.button} disabled={paused} onPress={() => onStart(item.id)} />
              )}
            </View>
            {item.id === 'run' && <DistanceField value={warmup.run.distanceMi} onChange={onDistance} />}
          </View>
        );
      })}
      {paused && <Text style={styles.hint}>Тренировка на паузе — секундомеры остановлены.</Text>}
    </Card>
  );
}

function DistanceField({ value, onChange }: { value?: number; onChange: (v: number | undefined) => void }) {
  const [text, setText] = useState(value == null ? '' : String(value));
  useEffect(() => {
    setText((prev) => (parseNum(prev) === value ? prev : value == null ? '' : String(value)));
  }, [value]);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Дистанция, mi</Text>
      <TextInput
        value={text}
        placeholder="0.45"
        placeholderTextColor={colors.muted}
        keyboardType="decimal-pad"
        returnKeyType="done"
        onChangeText={(t) => {
          const clean = t.replace(',', '.').replace(/[^0-9.]/g, '');
          setText(clean);
          onChange(parseNum(clean));
        }}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  pending: { borderColor: colors.highlight },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  item: { gap: 8, padding: 12, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  hint: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clock: { flex: 1, fontSize: 34, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  button: { minWidth: 110 },
  label: { flex: 1, fontSize: 15, color: colors.text },
  input: {
    width: 90,
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
