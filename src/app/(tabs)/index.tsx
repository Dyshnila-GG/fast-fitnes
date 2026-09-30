import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MealCard } from '../../components/food/MealCard';
import { NumInput } from '../../components/form';
import { Button, Card, Segmented } from '../../components/ui';
import { getTemplate } from '../../data/program';
import { useNow } from '../../hooks/useNow';
import { dayTotals, formatNum, nextMeal, toggleEaten } from '../../logic/food';
import { formatDay, formatDuration, WEEKDAYS } from '../../logic/format';
import {
  finishedOn,
  HOME_DAY_LABEL,
  homeDayType,
  lastSession,
  nextWorkout,
  recordGains,
  RUNS_PER_WEEK,
  templateForDay,
  weekCounts,
  weightTrend,
  WORKOUTS_PER_WEEK,
} from '../../logic/home';
import { dayDate, dayKey, parseNum } from '../../logic/metrics';
import { elapsedMs, sessionExercises, setLengthChoice, startWorkout } from '../../logic/session';
import { formatSleep, removeRun, setRun, sleepAverage, sleepMinutes } from '../../logic/sleep';
import { useStore } from '../../store/AppStore';
import { colors, gap } from '../../theme';
import type { AppData, Length, Session } from '../../types';

const LENGTHS: { value: Length; label: string }[] = [
  { value: 'long', label: 'Длинная' },
  { value: 'short', label: 'Короткая' },
];

const duration = (s: Session) => formatDuration(elapsedMs(s, new Date(s.finishedAt ?? s.startedAt).getTime()));
const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

// «Главная» (SPEC_v3 §9): что сегодня делать.
export default function HomeScreen() {
  const { data } = useStore();
  const now = new Date(useNow(60_000));
  const today = dayKey(now);
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TodayCard data={data} today={today} />
        <MealBlock data={data} today={today} nowMin={now.getHours() * 60 + now.getMinutes()} />
        <SleepCard data={data} today={today} />
        <WorkoutsCard data={data} today={today} />
        <WeekCard data={data} today={today} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type BlockProps = { data: AppData; today: string };

function TodayCard({ data, today }: BlockProps) {
  const { update } = useStore();
  const type = homeDayType(today);
  const template = templateForDay(today);
  const done = finishedOn(data, today);
  const length = template ? (data.lengthChoice[template.id] ?? 'long') : 'long';

  return (
    <Card style={styles.card}>
      <Text style={styles.label}>СЕГОДНЯ</Text>
      <Text style={styles.title}>
        {WEEKDAYS[dayDate(today).getDay()]}, {formatDay(today)}
      </Text>
      <Text style={styles.big}>{HOME_DAY_LABEL[type]}</Text>
      {done ? (
        <Text style={styles.text}>✓ Выполнено · {duration(done)}</Text>
      ) : template ? (
        <>
          <Text style={styles.text}>
            {template.title} · {sessionExercises(template.id, length).length} упражнений
          </Text>
          <Segmented options={LENGTHS} value={length} onChange={(l) => update((d) => setLengthChoice(d, template.id, l))} />
          <Button title="Начать" onPress={() => update((d) => startWorkout(d, template.id))} />
        </>
      ) : type === 'run' ? (
        <Text style={styles.muted}>Отметьте пробежку в блоке «Неделя».</Text>
      ) : (
        <Text style={styles.muted}>Тренировки сегодня нет.</Text>
      )}
    </Card>
  );
}

function MealBlock({ data, today, nowMin }: BlockProps & { nowMin: number }) {
  const { update } = useStore();
  const meal = nextMeal(data.food, today, nowMin);
  const t = dayTotals(data.food, today);
  const totals = `Съедено за день: ${formatNum(t.kcalEaten)} / ${formatNum(t.kcalTotal)} ккал · ${t.proteinEaten} / ${t.proteinTotal} г белка`;
  return (
    <View style={styles.block}>
      <Text style={[styles.label, styles.outerLabel]}>СЛЕДУЮЩИЙ ПРИЁМ ПИЩИ</Text>
      {meal ? (
        <MealCard meal={meal} day={today} eaten={false} compact onToggle={() => update((d) => toggleEaten(d, today, meal.slot))} />
      ) : (
        <Card>
          <Text style={styles.text}>Все приёмы на сегодня отмечены.</Text>
        </Card>
      )}
      <Text style={[styles.muted, styles.outerLabel]}>{totals}</Text>
    </View>
  );
}

function SleepCard({ data, today }: BlockProps) {
  const e = data.sleep[today];
  const avg = sleepAverage(data.sleep, today, 7);
  const edit = () => router.push({ pathname: '/sleep-edit', params: { day: today } });
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>СОН</Text>
      {e ? (
        <>
          <Text style={styles.text}>
            Лёг {e.bed} · Встал {e.wake} · {formatSleep(sleepMinutes(e))} · качество {e.quality}/5
          </Text>
          <Button title="Исправить" variant="secondary" small onPress={edit} />
        </>
      ) : (
        <>
          <Text style={styles.muted}>За прошлую ночь нет записи.</Text>
          <Button title="Записать сон" onPress={edit} />
        </>
      )}
      <Text style={styles.muted}>Среднее за 7 дней: {avg != null ? formatSleep(avg) : '—'}</Text>
    </Card>
  );
}

function WorkoutsCard({ data, today }: BlockProps) {
  const last = lastSession(data);
  const next = nextWorkout(data, today);
  const gains = last ? recordGains(data, last) : [];
  const offset = Math.round((dayDate(next.day).getTime() - dayDate(today).getTime()) / 86_400_000);
  const when = offset === 0 ? 'сегодня' : offset === 1 ? 'завтра' : `${WEEKDAYS[dayDate(next.day).getDay()].toLowerCase()}, ${formatDay(next.day)}`;
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>ТРЕНИРОВКИ</Text>
      {last ? (
        <Pressable onPress={() => router.push(`/history/${last.id}`)} style={({ pressed }) => [styles.gap4, pressed && styles.pressed]}>
          <Text style={styles.text}>
            Последняя: {formatDay(dayKey(new Date(last.finishedAt!)))} · {getTemplate(last.templateId).title} · {duration(last)} ›
          </Text>
          {gains.length > 0 ? (
            gains.map((g) => (
              <Text key={g} style={styles.muted}>
                ↑ {g}
              </Text>
            ))
          ) : (
            <Text style={styles.muted}>Рекорды без изменений</Text>
          )}
        </Pressable>
      ) : (
        <Text style={styles.muted}>Завершённых тренировок пока нет.</Text>
      )}
      <Text style={styles.text}>
        Следующая: {next.template.title} · {when}
      </Text>
    </Card>
  );
}

function WeekCard({ data, today }: BlockProps) {
  const { update } = useStore();
  const counts = weekCounts(data, today);
  const weight = weightTrend(data.bodyWeight, today);
  const isRunDay = homeDayType(today) === 'run';
  const run = data.runs[today];
  const [minutes, setMinutes] = useState('');
  const [distance, setDistance] = useState('');

  const markRun = () => {
    const m = parseNum(minutes);
    const mi = parseNum(distance);
    if (m == null || m <= 0) return Alert.alert('Введите время пробежки в минутах');
    if (mi != null && mi <= 0) return Alert.alert('Дистанция должна быть больше нуля');
    update((d) => setRun(d, today, mi != null ? { minutes: m, distanceMi: mi } : { minutes: m }));
    setMinutes('');
    setDistance('');
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.label}>НЕДЕЛЯ (ПН–ВС)</Text>
      <Text style={styles.text}>
        Тренировок {counts.workouts} из {WORKOUTS_PER_WEEK} · пробежек {counts.runs} из {RUNS_PER_WEEK}
      </Text>
      <Text style={styles.text}>
        {weight
          ? `Вес ${weight.value} lb${weight.change != null ? ` · ${signed(weight.change)} lb за 7 дней` : ' · нет записи 7 дней назад'}`
          : 'Вес: нет записей'}
      </Text>
      {isRunDay &&
        (run ? (
          <View style={styles.runRow}>
            <Text style={[styles.text, styles.flex]}>
              ✓ Пробежка: {run.minutes} мин{run.distanceMi != null ? ` · ${run.distanceMi} mi` : ''}
            </Text>
            <Button title="Снять" variant="secondary" small onPress={() => update((d) => removeRun(d, today))} />
          </View>
        ) : (
          <View style={styles.gap8}>
            <View style={styles.runRow}>
              <NumInput label="Время, мин" value={minutes} onChangeText={setMinutes} keyboardType="number-pad" />
              <NumInput label="Дистанция, mi" value={distance} onChangeText={setDistance} placeholder="—" />
            </View>
            <Button title="Отметить пробежку" onPress={markRun} />
          </View>
        ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap, paddingBottom: 40 },
  card: { gap: 8 },
  block: { gap: 8 },
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  pressed: { opacity: 0.7 },
  label: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.5 },
  outerLabel: { paddingHorizontal: 4 },
  title: { fontSize: 16, color: colors.muted },
  big: { fontSize: 26, fontWeight: '800', color: colors.text },
  text: { fontSize: 16, color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  runRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
});
