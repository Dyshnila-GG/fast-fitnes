import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../Text';
import { useNow } from '../../hooks/useNow';
import { formatDuration } from '../../logic/format';
import { parseNum } from '../../logic/metrics';
import { isWarmupItemDone, stopwatchMs, stopwatchState, WARMUP_ITEMS, type WarmupId } from '../../logic/session';
import { colors } from '../../theme';
import type { Length, SessionWarmup } from '../../types';
import { Button, Card } from '../ui';

type Props = {
  length: Length;
  warmup: SessionWarmup;
  paused: boolean;
  onStart: (id: WarmupId) => void;
  onPause: (id: WarmupId) => void;
  onFinish: (id: WarmupId) => void;
  onReset: (id: WarmupId) => void;
  onDistance: (mi: number | undefined) => void;
};

// Разминка (SPEC §3.2): пробежка и суставная разминка, у каждой свой секундомер.
export function WarmupBlock({ length, warmup, paused, onStart, onPause, onFinish, onReset, onDistance }: Props) {
  const running = WARMUP_ITEMS.some((i) => warmup[i.id].since);
  const now = useNow(running ? 250 : 60_000);
  const complete = WARMUP_ITEMS.every((i) => isWarmupItemDone(warmup[i.id]));

  return (
    <Card style={[styles.card, !complete && styles.pending]}>
      <Text style={styles.title}>Разминка</Text>
      {WARMUP_ITEMS.map((item) => {
        const sw = warmup[item.id];
        const state = stopwatchState(sw);
        const reset = () =>
          Alert.alert('Сбросить?', item.id === 'run' ? 'Время и дистанция будут обнулены.' : 'Время будет обнулено.', [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Сбросить', style: 'destructive', onPress: () => onReset(item.id) },
          ]);
        return (
          <View key={item.id} style={[styles.item, state !== 'done' && styles.pending]}>
            <View style={styles.row}>
              <Text style={[styles.name, styles.flex]}>{item.title}</Text>
              {state === 'done' && <Text style={styles.badge}>Выполнено</Text>}
            </View>
            <Text style={styles.hint}>{item.hint(length)}</Text>
            <Text style={[styles.clock, state === 'done' && styles.clockDone]}>{formatDuration(stopwatchMs(sw, now))}</Text>
            {state === 'idle' && <Button title="Старт" disabled={paused} onPress={() => onStart(item.id)} />}
            {state === 'running' && <Button title="Пауза" variant="secondary" onPress={() => onPause(item.id)} />}
            {state === 'paused' && <Button title="Продолжить" disabled={paused} onPress={() => onStart(item.id)} />}
            {state !== 'idle' && (
              <View style={styles.row}>
                {state !== 'done' && (
                  <Button title="Завершить" variant="secondary" style={styles.flex} onPress={() => onFinish(item.id)} />
                )}
                <Button title="Сброс" variant="danger" style={styles.flex} onPress={reset} />
              </View>
            )}
            {item.id === 'run' && <DistanceField value={warmup.run.distanceMi} onChange={onDistance} />}
          </View>
        );
      })}
      {paused && <Text style={styles.hint}>Тренировка на паузе — секундомеры тоже.</Text>}
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  clock: { fontSize: 34, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  clockDone: { color: colors.muted },
  badge: {
    backgroundColor: colors.button,
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
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
