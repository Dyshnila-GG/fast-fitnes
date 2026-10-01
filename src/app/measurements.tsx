import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { DayPicker, EntryRow, NumInput } from '../components/form';
import { Button, Card } from '../components/ui';
import { formatDay, formatLength } from '../logic/format';
import { addMeasurement, dayKey, latestFirst, parseNum, removeEntry, type MeasurementValues } from '../logic/metrics';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import type { MeasurementEntry } from '../types';
import { t as tr } from '../i18n';
import { lengthToIn, lengthUnit } from '../logic/units';
import { useT } from '../i18n/useT';

const FIELDS: (keyof MeasurementValues)[] = ['chest', 'waist', 'biceps', 'thigh', 'calf'];
const label = (key: keyof MeasurementValues) => tr(`measure.${key}`);

type Texts = Record<keyof MeasurementValues, string>;
const EMPTY: Texts = { chest: '', waist: '', biceps: '', thigh: '', calf: '' };

export default function MeasurementsScreen() {
  const t = useT();
  const { data, update } = useStore();
  const [texts, setTexts] = useState<Texts>(EMPTY);
  const [day, setDay] = useState(dayKey());
  const entries = latestFirst(data.measurements);

  const save = () => {
    const values: MeasurementValues = {};
    // Ввод в выбранных единицах (in / cm), хранение — дюймы.
    for (const f of FIELDS) {
      const n = parseNum(texts[f]);
      if (n != null && n > 0) values[f] = lengthToIn(n);
    }
    if (Object.keys(values).length === 0) return Alert.alert(t('measure.enter'));
    update((d) => addMeasurement(d, day, values));
    setTexts(EMPTY);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.section}>{t('measure.title', { u: lengthUnit() })}</Text>
          <View style={styles.grid}>
            {FIELDS.map((f) => (
              <View key={f} style={styles.cell}>
                <NumInput label={label(f)} value={texts[f]} onChangeText={(v) => setTexts((s) => ({ ...s, [f]: v }))} />
              </View>
            ))}
          </View>
          <DayPicker value={day} onChange={setDay} />
          <Button title={t('common.save')} onPress={save} />
        </Card>
        <Card style={styles.list}>
          <Text style={styles.section}>{t('measure.history')}</Text>
          {entries.length === 0 && <Text style={styles.muted}>{t('weight.empty')}</Text>}
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
  return FIELDS.filter((f) => e[f] != null)
    .map((f) => `${label(f).toLowerCase()} ${formatLength(e[f]!)}`)
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
