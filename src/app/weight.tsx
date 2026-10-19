import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../components/Text';
import { LineChart } from '../components/charts/LineChart';
import { DayPicker, EntryRow, NumInput } from '../components/form';
import { Button, Card } from '../components/ui';
import { formatDay, formatWeight } from '../logic/format';
import { addBodyWeight, dayDate, dayKey, latestFirst, parseNum, removeEntry } from '../logic/metrics';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import { weightToLb, weightUnit, weightValue } from '../logic/units';
import { useT } from '../i18n/useT';
import { router } from 'expo-router';
import { addBodyFlag, recentExcessFat, trendSummary, waistStatus, weightTrend } from '../logic/v4';
import { formatNumber } from '../i18n';

export default function WeightScreen() {
  const t = useT();
  const { data, update } = useStore();
  const [text, setText] = useState('');
  const [day, setDay] = useState(dayKey());
  const entries = latestFirst(data.bodyWeight);
  const today = dayKey();
  const trend = trendSummary(data.bodyWeight, today);
  const waist = waistStatus(data.measurements, today);
  const excess = recentExcessFat(data, today);

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
          <NumInput label={t('weight.label', { u: weightUnit() })} value={text} onChangeText={setText} placeholder={String(weightValue(data.profile.startWeight))} />
          <DayPicker value={day} onChange={setDay} />
          <Button title={t('common.save')} onPress={save} />
        </Card>
        <Card style={styles.card}>
          <Text style={styles.section}>ТРЕНД (СГЛАЖЕННЫЙ)</Text>
          {trend.trend != null ? (
            <Text style={styles.big}>
              {formatWeight(trend.trend)}
              {trend.weekly != null ? <Text style={styles.muted}>{`  ${trend.weekly > 0 ? '+' : ''}${formatNumber(weightValue(trend.weekly))} ${weightUnit()}/нед`}</Text> : null}
            </Text>
          ) : (
            <Text style={styles.muted}>Взвешивайся утром натощак — тренд появится после нескольких записей.</Text>
          )}
          <LineChart points={weightTrend(data.bodyWeight).map((p) => ({ x: dayDate(p.date).getTime(), y: weightValue(p.trend), date: p.date }))} unit={weightUnit()} formatDate={formatDay} />
          <Text style={styles.muted}>Один день ничего не значит — смотри на тренд.</Text>
        </Card>
        <Card style={styles.card}>
          <Text style={styles.section}>ТАЛИЯ</Text>
          <Text style={styles.muted}>
            {waist.daysSince == null ? 'Замеров талии ещё нет. Мерь раз в неделю, утром, на уровне пупка.' : `Последний замер ${waist.daysSince} дн. назад${waist.due ? ' — пора замерить.' : '.'}`}
          </Text>
          {waist.due ? <Button title="Замерить талию" variant="secondary" onPress={() => router.push('/measurements')} /> : null}
        </Card>
        <Card style={styles.card}>
          <Text style={styles.section}>СУХОСТЬ</Text>
          <Text style={styles.muted}>
            {excess ? 'Лишний жир отмечен за последние 2 недели — проверь цель питания.' : 'Если видишь, что талия/пресс заплывают — отметь. Приложение предложит замедлить набор.'}
          </Text>
          <Button
            title={excess ? 'Открыть цель питания' : 'Замечаю лишний жир'}
            variant="secondary"
            onPress={() =>
              excess
                ? router.push('/nutrition-goal')
                : Alert.alert('Замечаешь лишний жир?', 'Это сигнал замедлить набор. Ничего не меняется автоматически.', [
                    { text: 'Отмена', style: 'cancel' },
                    { text: 'Да, отметить', onPress: () => update((d) => addBodyFlag(d, dayKey())) },
                  ])
            }
          />
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
  big: { fontSize: 28, fontWeight: '800', color: colors.text },
});
