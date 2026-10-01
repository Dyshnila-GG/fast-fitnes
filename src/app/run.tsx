import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ToastAndroid, View } from 'react-native';
import { Text } from '../components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NumInput } from '../components/form';
import { Button, Card } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { formatDay, formatDuration } from '../logic/format';
import { dayKey, parseNum } from '../logic/metrics';
import {
  cancelRun,
  finishRun,
  formatPace,
  paceMinPerMi,
  parseRunTime,
  pauseRun,
  resetRun,
  resumeRun,
  runMs,
  runState,
  saveRun,
} from '../logic/run';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import type { ActiveRun } from '../types';

const STATE_LABEL = { idle: 'Готов к старту', running: 'Идёт', paused: 'Пауза', done: 'Завершено' } as const;

// Активная пробежка (SPEC_v3_2 §4): вкладки скрыты, выйти можно только через итог (см. _layout).
export default function RunScreen() {
  useKeepAwake();
  const { data, update } = useStore();
  const insets = useSafeAreaInsets();
  const run = data.activeRun;

  // Системная кнопка «назад» на Android заблокирована.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (Platform.OS === 'android') ToastAndroid.show('Завершите пробежку', ToastAndroid.SHORT);
      return true;
    });
    return () => sub.remove();
  }, []);

  if (!run) return null;
  const done = runState(run) === 'done';

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.kicker}>Пробежка</Text>
        {done ? (
          <RunSummary
            run={run}
            hasRunToday={data.runs[dayKey()] != null}
            onSave={(minutes, distanceMi) =>
              update((d) => saveRun(d, dayKey(), distanceMi != null ? { minutes, distanceMi } : { minutes }))
            }
            onCancel={() => update(cancelRun)}
          />
        ) : (
          <RunStopwatch
            run={run}
            onStart={() => update((d) => resumeRun(d))}
            onPause={() => update((d) => pauseRun(d))}
            onFinish={() => update((d) => finishRun(d))}
            onReset={() => update(resetRun)}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type StopwatchProps = { run: ActiveRun; onStart: () => void; onPause: () => void; onFinish: () => void; onReset: () => void };

// Большой секундомер; кнопки по состояниям, как у секундомеров разминки.
function RunStopwatch({ run, onStart, onPause, onFinish, onReset }: StopwatchProps) {
  const state = runState(run);
  const now = useNow(state === 'running' ? 250 : 60_000);
  const reset = () =>
    Alert.alert('Сбросить?', 'Время будет обнулено.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Сбросить', style: 'destructive', onPress: onReset },
    ]);

  return (
    <View style={styles.stopwatch}>
      <View style={styles.clockWrap}>
        <Text style={styles.clock} numberOfLines={1} adjustsFontSizeToFit>
          {formatDuration(runMs(run, now))}
        </Text>
        <View style={styles.stateRow}>
          <View style={[styles.stateDot, state === 'running' && styles.stateDotOn]} />
          <Text style={styles.stateText}>{STATE_LABEL[state]}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {state === 'idle' && <Button title="Старт" onPress={onStart} style={styles.big} />}
        {state === 'running' && <Button title="Пауза" variant="secondary" onPress={onPause} style={styles.big} />}
        {state === 'paused' && <Button title="Продолжить" onPress={onStart} style={styles.big} />}
        {state !== 'idle' && (
          <View style={styles.row}>
            <Button title="Завершить" variant="secondary" onPress={onFinish} style={styles.flex} />
            <Button title="Сброс" variant="danger" onPress={reset} style={styles.flex} />
          </View>
        )}
      </View>
    </View>
  );
}

type SummaryProps = {
  run: ActiveRun;
  hasRunToday: boolean;
  onSave: (minutes: number, distanceMi?: number) => void;
  onCancel: () => void;
};

// Итог: время из секундомера (можно поправить), дистанция — необязательно, темп считается сам.
function RunSummary({ run, hasRunToday, onSave, onCancel }: SummaryProps) {
  const [time, setTime] = useState(() => formatDuration(runMs(run)));
  const [distance, setDistance] = useState('');
  const minutes = parseRunTime(time);
  const mi = parseNum(distance);
  const pace = useMemo(() => (minutes != null ? paceMinPerMi(minutes, mi) : undefined), [minutes, mi]);

  const save = () => {
    if (minutes == null) return Alert.alert('Введите время пробежки', 'Например, 23:20');
    if (distance.trim() !== '' && (mi == null || mi <= 0)) return Alert.alert('Дистанция должна быть больше нуля');
    if (!hasRunToday) return onSave(minutes, mi);
    Alert.alert('Заменить пробежку за сегодня?', 'Сегодня пробежка уже отмечена — она будет заменена этой.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Заменить', style: 'destructive', onPress: () => onSave(minutes, mi) },
    ]);
  };

  const cancel = () =>
    Alert.alert('Отменить без сохранения?', 'Пробежка не будет записана.', [
      { text: 'Назад', style: 'cancel' },
      { text: 'Не сохранять', style: 'destructive', onPress: onCancel },
    ]);

  return (
    <View style={styles.summary}>
      <Text style={styles.title}>Итог пробежки</Text>
      <Text style={styles.muted}>Сегодня, {formatDay(dayKey())}</Text>
      <Card style={styles.card}>
        <View style={styles.row}>
          <NumInput label="Время, мм:сс" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" />
          <NumInput label="Дистанция, mi" value={distance} onChangeText={setDistance} placeholder="—" />
        </View>
        <View style={styles.paceRow}>
          <Text style={styles.paceLabel}>Темп</Text>
          <Text style={[styles.pace, pace == null && styles.paceEmpty]}>{pace != null ? formatPace(pace) : 'укажите дистанцию'}</Text>
        </View>
      </Card>
      <Button title="Сохранить" onPress={save} />
      <Button title="Отменить без сохранения" variant="danger" onPress={cancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: 16, gap },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 10 },
  kicker: { fontSize: 15, fontWeight: '600', color: colors.muted, letterSpacing: 0.4 },
  stopwatch: { flex: 1, justifyContent: 'space-between', gap: 24 },
  clockWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 280 },
  clock: { fontSize: 88, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'], letterSpacing: -2 },
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stateDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dim },
  stateDotOn: { backgroundColor: colors.text },
  stateText: { fontSize: 16, color: colors.muted },
  actions: { gap: 10 },
  big: { minHeight: 64 },
  summary: { gap },
  title: { fontSize: 32, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  card: { gap: 16 },
  paceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  paceLabel: { fontSize: 15, color: colors.muted },
  pace: { fontSize: 24, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  paceEmpty: { fontSize: 15, fontWeight: '400', color: colors.muted },
});
