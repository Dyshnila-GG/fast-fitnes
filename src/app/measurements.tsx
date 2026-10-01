import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { DayPicker, EntryRow, NumInput } from '../components/form';
import { Button, Card } from '../components/ui';
import { formatDay } from '../logic/format';
import { addMeasurement, dayKey, latestFirst, parseNum, removeEntry, type MeasurementValues } from '../logic/metrics';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import type { MeasurementEntry } from '../types';

const FIELDS: { key: keyof MeasurementValues; label: string }[] = [
  { key: 'chest', label: 'Грудь' },
  { key: 'waist', label: 'Талия' },
  { key: 'biceps', label: 'Бицепс' },
  { key: 'thigh', label: 'Бедро' },
  { key: 'calf', label: 'Икра' },
];

type Texts = Record<keyof MeasurementValues, string>;
const EMPTY: Texts = { chest: '', waist: '', biceps: '', thigh: '', calf: '' };

export default function MeasurementsScreen() {
  const { data, update } = useStore();
  const [texts, setTexts] = useState<Texts>(EMPTY);
  const [day, setDay] = useState(dayKey());
  const entries = latestFirst(data.measurements);

  const save = () => {
    const values: MeasurementValues = {};
    for (const f of FIELDS) {
      const n = parseNum(texts[f.key]);
      if (n != null && n > 0) values[f.key] = n;
    }
    if (Object.keys(values).length === 0) return Alert.alert('Введите хотя бы один замер в дюймах');
    update((d) => addMeasurement(d, day, values));
    setTexts(EMPTY);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.section}>ЗАМЕРЫ, ДЮЙМЫ</Text>
          <View style={styles.grid}>
            {FIELDS.map((f) => (
              <View key={f.key} style={styles.cell}>
                <NumInput label={f.label} value={texts[f.key]} onChangeText={(t) => setTexts((s) => ({ ...s, [f.key]: t }))} />
              </View>
            ))}
          </View>
          <DayPicker value={day} onChange={setDay} />
          <Button title="Сохранить" onPress={save} />
        </Card>
        <Card style={styles.list}>
          <Text style={styles.section}>ИСТОРИЯ</Text>
          {entries.length === 0 && <Text style={styles.muted}>Пока нет записей.</Text>}
          {entries.map((e) => (
            <EntryRow
              key={e.id}
              title={formatDay(e.date)}
              detail={describe(e)}
              onDelete={() => update((d) => removeEntry(d, 'measurements', e.id))}
            />
          ))}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function describe(e: MeasurementEntry): string {
  return FIELDS.filter((f) => e[f.key] != null)
    .map((f) => `${f.label.toLowerCase()} ${e[f.key]}″`)
    .join(' · ');
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap },
  card: { gap: 12 },
  list: { gap: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { flexBasis: '30%', flexGrow: 1 },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.5, marginBottom: 6 },
  muted: { fontSize: 15, color: colors.muted },
});
