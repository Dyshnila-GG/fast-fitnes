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
import { distanceToMi, distanceUnit, distanceValue } from '../logic/units';
import { useT } from '../i18n/useT';

// Модалка с «Главной» (Ср/Пт): отметить пробежку сегодня — время и дистанция (необязательно).
export default function RunEditScreen() {
  const t = useT();
  const { data, update } = useStore();
  const today = dayKey();
  const run = data.runs[today];
  const [minutes, setMinutes] = useState(run ? String(run.minutes) : '');
  const [distance, setDistance] = useState(run?.distanceMi != null ? String(distanceValue(run.distanceMi)) : '');

  const save = () => {
    const m = parseNum(minutes);
    const entered = parseNum(distance);
    if (m == null || m <= 0) return Alert.alert(t('run.enterMinutes'));
    if (entered != null && entered <= 0) return Alert.alert(t('run.distancePositive'));
    const mi = entered != null ? distanceToMi(entered) : undefined;
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
        <Text style={styles.muted}>{t('run.todayDate', { date: formatDay(today) })}</Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            <NumInput label={t('run.timeMin')} value={minutes} onChangeText={setMinutes} keyboardType="number-pad" autoFocus />
            <NumInput label={t('run.distanceLabel', { u: distanceUnit() })} value={distance} onChangeText={setDistance} placeholder="—" />
          </View>
        </Card>
        <Button title={t(run ? 'common.save' : 'run.mark')} onPress={save} />
        {run && <Button title={t('run.unmark')} variant="danger" onPress={unmark} />}
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
