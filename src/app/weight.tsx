import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { LineChart } from '../components/charts/LineChart';
import { DayPicker, EntryRow, NumInput } from '../components/form';
import { Button, Card } from '../components/ui';
import { formatDay } from '../logic/format';
import { addBodyWeight, dayKey, latestFirst, parseNum, removeEntry, weightSeries } from '../logic/metrics';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';

export default function WeightScreen() {
  const { data, update } = useStore();
  const [text, setText] = useState('');
  const [day, setDay] = useState(dayKey());
  const entries = latestFirst(data.bodyWeight);

  const save = () => {
    const value = parseNum(text);
    if (value == null || value <= 0) return Alert.alert('Введите вес в lb');
    update((d) => addBodyWeight(d, day, value));
    setText('');
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <NumInput label="Вес, lb" value={text} onChangeText={setText} placeholder={String(data.profile.startWeight)} />
          <DayPicker value={day} onChange={setDay} />
          <Button title="Сохранить" onPress={save} />
        </Card>
        <Card style={styles.card}>
          <LineChart points={weightSeries(data.bodyWeight)} unit="lb" formatDate={formatDay} />
        </Card>
        <Card style={styles.list}>
          <Text style={styles.section}>ЗАПИСИ</Text>
          {entries.length === 0 && <Text style={styles.muted}>Пока нет записей.</Text>}
          {entries.map((e) => (
            <EntryRow
              key={e.id}
              title={`${e.value} lb`}
              detail={formatDay(e.date)}
              onDelete={() => update((d) => removeEntry(d, 'bodyWeight', e.id))}
            />
          ))}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap },
  card: { gap: 12 },
  list: { gap: 0 },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.5, marginBottom: 6 },
  muted: { fontSize: 15, color: colors.muted },
});
