import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../components/Text';
import { LineChart } from '../components/charts/LineChart';
import { DayPicker, EntryRow, NumInput } from '../components/form';
import { Button, Card } from '../components/ui';
import { formatDay, formatWeight } from '../logic/format';
import { addBodyWeight, dayKey, latestFirst, parseNum, removeEntry, weightSeries } from '../logic/metrics';
import { inputNum } from '../i18n';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import { weightToLb, weightUnit, weightValue } from '../logic/units';
import { useT } from '../i18n/useT';

export default function WeightScreen() {
  const t = useT();
  const { data, update } = useStore();
  const [text, setText] = useState('');
  const [day, setDay] = useState(dayKey());
  const entries = latestFirst(data.bodyWeight);

  const save = () => {
    const value = parseNum(text);
    if (value == null || value <= 0) return Alert.alert(t('weight.enter', { u: weightUnit() }));
    update((d) => addBodyWeight(d, day, weightToLb(value)));
    setText('');
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <NumInput label={t('weight.label', { u: weightUnit() })} value={text} onChangeText={setText} placeholder={inputNum(weightValue(data.profile.startWeight))} />
          <DayPicker value={day} onChange={setDay} />
          <Button title={t('common.save')} onPress={save} />
        </Card>
        <Card style={styles.card}>
          <LineChart points={weightSeries(data.bodyWeight).map((p) => ({ ...p, y: weightValue(p.y) }))} unit={weightUnit()} formatDate={formatDay} />
        </Card>
        <Card style={styles.list}>
          <Text style={styles.section}>{t('weight.entries')}</Text>
          {entries.length === 0 && <Text style={styles.muted}>{t('weight.empty')}</Text>}
          {entries.map((e) => (
            <EntryRow
              key={e.id}
              title={formatWeight(e.value)}
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
