import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { TimeField } from '../components/TimeField';
import { Button, Card, Segmented } from '../components/ui';
import { formatDay } from '../logic/format';
import { dayKey, shiftDay } from '../logic/metrics';
import { formatSleep, removeSleep, setSleep, sleepMinutes } from '../logic/sleep';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';

const QUALITY = ['1', '2', '3', '4', '5'].map((v) => ({ value: v, label: v }));

// Запись или исправление сна за ночь, закончившуюся утром дня `day`.
export default function SleepEditScreen() {
  const params = useLocalSearchParams<{ day?: string }>();
  const day = params.day ?? dayKey();
  const { data, update } = useStore();
  const existing = data.sleep[day];
  const [bed, setBed] = useState(existing?.bed ?? '23:00');
  const [wake, setWake] = useState(existing?.wake ?? '07:00');
  const [quality, setQuality] = useState(String(existing?.quality ?? 4));

  const save = () => {
    update((d) => setSleep(d, day, { bed, wake, quality: Number(quality) }));
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
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.muted}>
        Ночь с {formatDay(shiftDay(day, -1))} на {formatDay(day)}
      </Text>
      <Card style={styles.card}>
        <TimeField label="Лёг" value={bed} onChange={setBed} />
        <TimeField label="Встал" value={wake} onChange={setWake} />
        <Text style={styles.total}>{formatSleep(sleepMinutes({ bed, wake }))}</Text>
        <Text style={styles.label}>Качество сна</Text>
        <Segmented options={QUALITY} value={quality} onChange={setQuality} />
      </Card>
      <Button title="Сохранить" onPress={save} />
      {existing && <Button title="Удалить запись" variant="danger" onPress={remove} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap },
  card: { gap: 14 },
  muted: { fontSize: 14, color: colors.muted },
  label: { fontSize: 14, color: colors.muted },
  total: { fontSize: 28, fontWeight: '800', color: colors.text },
});
