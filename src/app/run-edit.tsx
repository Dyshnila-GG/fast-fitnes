import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { NumInput } from '../components/form';
import { Button, Card } from '../components/ui';
import { formatDay } from '../logic/format';
import { dayKey, parseNum } from '../logic/metrics';
import { removeRun, setRun } from '../logic/sleep';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';

// Модалка с «Главной» (Ср/Пт): отметить пробежку сегодня — время и дистанция (необязательно).
export default function RunEditScreen() {
  const { data, update } = useStore();
  const today = dayKey();
  const run = data.runs[today];
  const [minutes, setMinutes] = useState(run ? String(run.minutes) : '');
  const [distance, setDistance] = useState(run?.distanceMi != null ? String(run.distanceMi) : '');

  const save = () => {
    const m = parseNum(minutes);
    const mi = parseNum(distance);
    if (m == null || m <= 0) return Alert.alert('Введите время пробежки в минутах');
    if (mi != null && mi <= 0) return Alert.alert('Дистанция должна быть больше нуля');
    update((d) => setRun(d, today, mi != null ? { minutes: m, distanceMi: mi } : { minutes: m }));
    router.back();
  };

  const unmark = () => {
    update((d) => removeRun(d, today));
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.muted}>Сегодня, {formatDay(today)}</Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            <NumInput label="Время, мин" value={minutes} onChangeText={setMinutes} keyboardType="number-pad" autoFocus />
            <NumInput label="Дистанция, mi" value={distance} onChangeText={setDistance} placeholder="—" />
          </View>
        </Card>
        <Button title={run ? 'Сохранить' : 'Отметить пробежку'} onPress={save} />
        {run && <Button title="Снять отметку" variant="danger" onPress={unmark} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap },
  card: { gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
  muted: { fontSize: 14, color: colors.muted },
});
