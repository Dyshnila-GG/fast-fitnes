import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { NumInput } from '../components/form';
import { TimeField } from '../components/TimeField';
import { Button, Card } from '../components/ui';
import { formatDay } from '../logic/format';
import { dayKey, parseNum, shiftDay } from '../logic/metrics';
import { MAX_SLEEP_MIN, minutesBetween, removeSleep, setSleep } from '../logic/sleep';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import type { SleepEntry } from '../types';

// Модалка сна (под Garmin): длительность и оценка 0–100; «лёг / встал» — необязательно.
export default function SleepEditScreen() {
  const params = useLocalSearchParams<{ day?: string }>();
  const day = params.day ?? dayKey();
  const { data, update } = useStore();
  const existing = data.sleep[day];
  const [hours, setHours] = useState(existing ? String(Math.floor(existing.minutes / 60)) : '');
  const [mins, setMins] = useState(existing ? String(existing.minutes % 60) : '');
  const [garmin, setGarmin] = useState(existing?.garmin != null ? String(existing.garmin) : '');
  const [times, setTimes] = useState<{ bed: string; wake: string } | null>(
    existing?.bed && existing.wake ? { bed: existing.bed, wake: existing.wake } : null,
  );

  // «Лёг / встал» подставляют длительность.
  const changeTimes = (next: { bed: string; wake: string }) => {
    setTimes(next);
    const m = minutesBetween(next.bed, next.wake);
    setHours(String(Math.floor(m / 60)));
    setMins(String(m % 60));
  };

  const save = () => {
    const h = parseNum(hours) ?? 0;
    const m = parseNum(mins) ?? 0;
    const minutes = Math.round(h * 60 + m);
    if (h < 0 || m < 0 || m >= 60 || minutes <= 0 || minutes > MAX_SLEEP_MIN) {
      return Alert.alert('Проверьте длительность', 'Часы и минуты (0–59), всего от 1 минуты до 24 часов.');
    }
    const score = parseNum(garmin);
    if (score != null && (!Number.isInteger(score) || score < 0 || score > 100)) {
      return Alert.alert('Оценка Garmin — целое число от 0 до 100');
    }
    const entry: SleepEntry = { minutes };
    if (score != null) entry.garmin = score;
    if (times) Object.assign(entry, times);
    if (existing?.quality != null) entry.quality = existing.quality;
    update((d) => setSleep(d, day, entry));
    router.back();
  };

  const remove = () =>
    Alert.alert('Удалить запись сна?', formatDay(day), [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          update((d) => removeSleep(d, day));
          router.back();
        },
      },
    ]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.muted}>
          Ночь с {formatDay(shiftDay(day, -1))} на {formatDay(day)}
        </Text>
        <Card style={styles.card}>
          <Text style={styles.label}>Длительность</Text>
          <View style={styles.row}>
            <NumInput label="Часы" value={hours} onChangeText={setHours} keyboardType="number-pad" placeholder="7" />
            <NumInput label="Минуты" value={mins} onChangeText={setMins} keyboardType="number-pad" placeholder="30" />
          </View>
          <NumInput
            label="Оценка сна Garmin, 0–100 (необязательно)"
            value={garmin}
            onChangeText={setGarmin}
            keyboardType="number-pad"
            placeholder="—"
          />
          {existing?.quality != null && <Text style={styles.muted}>Старая оценка: качество {existing.quality}/5</Text>}
        </Card>
        <Card style={styles.card}>
          <Text style={styles.label}>Лёг / встал (необязательно)</Text>
          {times ? (
            <>
              <TimeField label="Лёг" value={times.bed} onChange={(bed) => changeTimes({ ...times, bed })} />
              <TimeField label="Встал" value={times.wake} onChange={(wake) => changeTimes({ ...times, wake })} />
              <Button title="Убрать время" variant="secondary" small onPress={() => setTimes(null)} />
            </>
          ) : (
            <Button title="Указать время" variant="secondary" small onPress={() => changeTimes({ bed: '23:00', wake: '07:00' })} />
          )}
        </Card>
        <Button title="Сохранить" onPress={save} />
        {existing && <Button title="Удалить запись" variant="danger" onPress={remove} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap, paddingBottom: 40 },
  card: { gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
  muted: { fontSize: 14, color: colors.muted },
  label: { fontSize: 16, fontWeight: '700', color: colors.text },
});
