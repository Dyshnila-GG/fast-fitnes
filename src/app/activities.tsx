import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { DayPicker, EntryRow, NumInput } from '../components/form';
import { Button, Card } from '../components/ui';
import { formatDay } from '../logic/format';
import { dayKey } from '../logic/metrics';
import { ACTIVITY_TYPES, activityLabel, addActivity, legsFatigue, removeActivity } from '../logic/v4';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import type { ActivityType } from '../types';

// Активности (handoff §22): волейбол, бег и т.д. — отдельные записи. Тяжёлая нагрузка на ноги
// подсвечивается в тренировке ног следующие 48 ч. Garmin добавится позже как ещё один источник.
export default function ActivitiesScreen() {
  const { data, update } = useStore();
  const [type, setType] = useState<ActivityType>('volleyball');
  const [day, setDay] = useState(dayKey());
  const [minutes, setMinutes] = useState('');
  const [rpe, setRpe] = useState(6);
  const legsDefault = ACTIVITY_TYPES.find((t) => t.value === type)?.legs ?? false;
  const [legs, setLegs] = useState<boolean | null>(null);
  const legsOn = legs ?? legsDefault;
  const fatigue = legsFatigue(data, dayKey());

  const save = () => {
    const m = Number(minutes.replace(',', '.'));
    if (!Number.isFinite(m) || m <= 0) return Alert.alert('Укажи длительность в минутах');
    update((d) => addActivity(d, { date: day, type, minutes: Math.round(m), rpe, legs: legsOn }));
    setMinutes('');
    setLegs(null);
  };

  const list = [...data.v4.activities].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {fatigue ? (
          <Card style={styles.warn}>
            <Text style={styles.name}>Ноги нагружены: {activityLabel(fatigue)} · {formatDay(fatigue.date)}</Text>
            <Text style={styles.muted}>В тренировке ног держи RIR 3 и не повышай вес. Боль — отдельный сигнал: стоп.</Text>
          </Card>
        ) : null}
        <Card style={styles.card}>
          <View style={styles.chips}>
            {ACTIVITY_TYPES.map((t) => (
              <Pressable key={t.value} onPress={() => { setType(t.value); setLegs(null); }} style={[styles.chip, type === t.value && styles.chipOn]}>
                <Text style={[styles.chipText, type === t.value && styles.chipTextOn]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
          <DayPicker value={day} onChange={setDay} />
          <NumInput label="Длительность, мин" value={minutes} onChangeText={setMinutes} placeholder="60" />
          <Text style={styles.label}>НАГРУЗКА (1 — легко, 10 — предел): {rpe}</Text>
          <View style={styles.chips}>
            {[2, 4, 6, 8, 10].map((v) => (
              <Pressable key={v} onPress={() => setRpe(v)} style={[styles.chip, rpe === v && styles.chipOn]}>
                <Text style={[styles.chipText, rpe === v && styles.chipTextOn]}>{v}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => setLegs(!legsOn)} style={[styles.chip, styles.toggle, legsOn && styles.chipOn]}>
            <Text style={[styles.chipText, legsOn && styles.chipTextOn]}>{legsOn ? '✓ ' : ''}Сильная нагрузка на ноги (прыжки, бег)</Text>
          </Pressable>
          <Button title="Сохранить" onPress={save} />
        </Card>
        <Card style={styles.list}>
          <Text style={styles.label}>ЗАПИСИ</Text>
          {list.length === 0 ? <Text style={styles.muted}>Пока нет записей.</Text> : null}
          {list.map((a) => (
            <EntryRow
              key={a.id}
              title={`${activityLabel(a)} · ${a.minutes} мин${a.rpe ? ` · ${a.rpe}/10` : ''}`}
              detail={`${formatDay(a.date)}${a.legs ? ' · ноги' : ''}`}
              onDelete={() => update((d) => removeActivity(d, a.id))}
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
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 0.5 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  chipOn: { backgroundColor: colors.text, borderColor: colors.text },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  chipTextOn: { color: colors.bg },
  toggle: { alignSelf: 'flex-start' },
  warn: { gap: 6, borderColor: '#FF9F0A' },
});
