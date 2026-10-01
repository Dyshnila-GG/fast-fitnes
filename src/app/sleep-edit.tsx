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
import { useT } from '../i18n/useT';

// Модалка сна (под Garmin): длительность и оценка 0–100; «лёг / встал» — необязательно.
export default function SleepEditScreen() {
  const t = useT();
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
      return Alert.alert(t('sleepEdit.checkTitle'), t('sleepEdit.checkText'));
    }
    const score = parseNum(garmin);
    if (score != null && (!Number.isInteger(score) || score < 0 || score > 100)) {
      return Alert.alert(t('sleepEdit.garminRange'));
    }
    const entry: SleepEntry = { minutes };
    if (score != null) entry.garmin = score;
    if (times) Object.assign(entry, times);
    if (existing?.quality != null) entry.quality = existing.quality;
    update((d) => setSleep(d, day, entry));
    router.back();
  };

  const remove = () =>
    Alert.alert(t('sleepEdit.deleteTitle'), formatDay(day), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
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
          {t('sleepEdit.night', { from: formatDay(shiftDay(day, -1)), to: formatDay(day) })}
        </Text>
        <Card style={styles.card}>
          <Text style={styles.label}>{t('report.duration')}</Text>
          <View style={styles.row}>
            <NumInput label={t('sleepEdit.hours')} value={hours} onChangeText={setHours} keyboardType="number-pad" placeholder="7" />
            <NumInput label={t('sleepEdit.minutes')} value={mins} onChangeText={setMins} keyboardType="number-pad" placeholder="30" />
          </View>
          <NumInput
            label={t('sleepEdit.garmin')}
            value={garmin}
            onChangeText={setGarmin}
            keyboardType="number-pad"
            placeholder="—"
          />
          {existing?.quality != null && <Text style={styles.muted}>{t('sleepEdit.oldQuality', { q: existing.quality })}</Text>}
        </Card>
        <Card style={styles.card}>
          <Text style={styles.label}>{t('sleepEdit.bedWake')}</Text>
          {times ? (
            <>
              <TimeField label={t('sleepEdit.bed')} value={times.bed} onChange={(bed) => changeTimes({ ...times, bed })} />
              <TimeField label={t('sleepEdit.wake')} value={times.wake} onChange={(wake) => changeTimes({ ...times, wake })} />
              <Button title={t('sleepEdit.removeTime')} variant="secondary" small onPress={() => setTimes(null)} />
            </>
          ) : (
            <Button title={t('sleepEdit.setTime')} variant="secondary" small onPress={() => changeTimes({ bed: '22:00', wake: '05:00' })} />
          )}
        </Card>
        <Button title={t('common.save')} onPress={save} />
        {existing && <Button title={t('sleepEdit.delete')} variant="danger" onPress={remove} />}
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
