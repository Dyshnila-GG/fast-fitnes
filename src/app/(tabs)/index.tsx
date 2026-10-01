import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DishImage } from '../../components/food/DishImage';
import { MonthCalendar } from '../../components/home/MonthCalendar';
import { Ring } from '../../components/home/Ring';
import { Tile, TILE_GAP, TileRow } from '../../components/home/Tile';
import { Icon } from '../../components/Icon';
import { DISHES } from '../../data/food';
import { useNow } from '../../hooks/useNow';
import { dayTotals, formatMealTime, formatNum, nextMeal, toggleEaten } from '../../logic/food';
import {
  dayLabel,
  daysAgo,
  homeDayType,
  monthGrid,
  monthOf,
  nextWorkout,
  RUNS_PER_WEEK,
  shiftMonth,
  weekCounts,
  WORKOUTS_PER_WEEK,
} from '../../logic/home';
import { dayKey, latestFirst } from '../../logic/metrics';
import { formatRunTime } from '../../logic/run';
import { startWorkout } from '../../logic/session';
import { formatSleepClock, sleepScore } from '../../logic/sleep';
import { useStore } from '../../store/AppStore';
import { colors } from '../../theme';
import type { AppData } from '../../types';

// «Главная» (SPEC_v3_1 §6): сетка плиток, крупные цифры, ввод — только в модалках.
export default function HomeScreen() {
  const { data } = useStore();
  const insets = useSafeAreaInsets();
  const now = new Date(useNow(60_000));
  const today = dayKey(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Text style={styles.h1}>Главная</Text>
        <Pressable onPress={() => router.navigate('/profile')} hitSlop={8} style={({ pressed }) => [styles.round, pressed && styles.pressed]}>
          <Icon name="tune-variant" size={22} />
        </Pressable>
      </View>
      <TileRow>
        <WorkoutTile data={data} today={today} />
        <WeightTile data={data} today={today} />
      </TileRow>
      <ActivityTile data={data} today={today} />
      <TileRow>
        <MealTile data={data} today={today} nowMin={nowMin} />
        <CaloriesTile data={data} today={today} />
      </TileRow>
      <TileRow>
        <SleepTile data={data} today={today} />
        <RunTile data={data} today={today} />
      </TileRow>
    </ScrollView>
  );
}

type TileProps = { data: AppData; today: string };

function WorkoutTile({ data, today }: TileProps) {
  const { update } = useStore();
  const { workouts } = weekCounts(data, today);
  const next = nextWorkout(data, today);
  // nextWorkout даёт сегодняшнюю, только если сегодня день зала и тренировка ещё не сделана.
  const isToday = next.day === today;
  const openStart = () => router.push({ pathname: '/workout-preview', params: { id: next.template.id, start: '1' } });
  const openPreview = () => router.push({ pathname: '/workout-preview', params: { id: next.template.id } });

  return (
    <Tile onPress={isToday ? openStart : openPreview}>
      <Ring size={84} stroke={9} progress={workouts / WORKOUTS_PER_WEEK}>
        <Text style={styles.ringNum}>{workouts}</Text>
      </Ring>
      <Text style={styles.name} numberOfLines={2}>
        {next.template.title.split(' — ')[1] ?? next.template.title}
      </Text>
      <Text style={styles.muted}>{dayLabel(next.day, today)}</Text>
      {isToday && (
        <Pressable
          onPress={() => update((d) => startWorkout(d, next.template.id, 'long'))}
          onLongPress={openStart}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        >
          <Text style={styles.primaryText}>Начать</Text>
        </Pressable>
      )}
    </Tile>
  );
}

function WeightTile({ data, today }: TileProps) {
  const last = latestFirst(data.bodyWeight).find((e) => e.date <= today);
  return (
    <Tile onPress={() => router.push('/weight-add')}>
      <View style={styles.grow} />
      <Text style={styles.bigLine} numberOfLines={1} adjustsFontSizeToFit>
        <Text style={styles.big}>{last ? last.value : '—'}</Text>
        {last && <Text style={styles.unit}> lb</Text>}
      </Text>
      <Text style={styles.name}>Вес тела</Text>
      <Text style={styles.muted}>{last ? daysAgo(last.date, today) : 'Нет записей'}</Text>
    </Tile>
  );
}

// «Активность»: календарь месяца, листается назад, но не дальше текущего месяца.
function ActivityTile({ data, today }: TileProps) {
  const counts = weekCounts(data, today);
  const current = monthOf(today);
  const [picked, setPicked] = useState(current);
  const month = picked > current ? current : picked;
  const { sessions, runs } = data;
  const grid = useMemo(() => monthGrid({ sessions, runs }, month, today), [sessions, runs, month, today]);
  const prev = useCallback(() => setPicked((m) => shiftMonth(m > current ? current : m, -1)), [current]);
  const next = useCallback(() => setPicked((m) => (m < current ? shiftMonth(m, 1) : current)), [current]);
  return (
    <Tile onPress={() => router.push('/history')} style={styles.full}>
      <Text style={styles.muted}>Активность</Text>
      <MonthCalendar grid={grid} canNext={month < current} onPrev={prev} onNext={next} />
      <Text style={styles.muted}>
        Неделя: тренировок {counts.workouts} из {WORKOUTS_PER_WEEK} · пробежек {counts.runs} из {RUNS_PER_WEEK}
      </Text>
    </Tile>
  );
}

function MealTile({ data, today, nowMin }: TileProps & { nowMin: number }) {
  const { update } = useStore();
  const meal = nextMeal(data.food, today, nowMin);
  if (!meal) {
    return (
      <Tile onPress={() => router.navigate('/food')}>
        <Text style={styles.muted}>Следующая еда</Text>
        <View style={styles.grow} />
        <Icon name="check" size={32} color={colors.muted} />
        <Text style={styles.name}>Всё отмечено</Text>
      </Tile>
    );
  }
  return (
    <Tile onPress={() => router.push({ pathname: '/meal', params: { day: today, slot: meal.slot } })}>
      <Text style={styles.muted}>{formatMealTime(meal.time)}</Text>
      <DishImage dish={meal.dishes[0]} style={styles.thumb} iconSize={24} />
      <Text style={styles.name} numberOfLines={2}>
        {meal.dishes.map((id) => DISHES[id].name).join(' + ')}
      </Text>
      <Text style={styles.muted}>~{formatNum(meal.kcal)} ккал</Text>
      <Pressable
        onPress={() => update((d) => toggleEaten(d, today, meal.slot))}
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
      >
        <Text style={styles.primaryText}>Съел</Text>
      </Pressable>
    </Tile>
  );
}

function CaloriesTile({ data, today }: TileProps) {
  const t = dayTotals(data.food, today);
  return (
    <Tile onPress={() => router.navigate('/food')}>
      <Text style={styles.muted}>Калории</Text>
      <View style={styles.center}>
        <Ring size={112} stroke={10} progress={t.kcalTotal > 0 ? t.kcalEaten / t.kcalTotal : 0}>
          <Text style={styles.ringNum} numberOfLines={1} adjustsFontSizeToFit>
            {formatNum(t.kcalEaten)}
          </Text>
        </Ring>
      </View>
      <Text style={styles.muted}>/ {formatNum(t.kcalTotal)} ккал</Text>
      <Text style={styles.muted}>
        белок {t.proteinEaten} / {t.proteinTotal} г
      </Text>
    </Tile>
  );
}

function SleepTile({ data, today }: TileProps) {
  const e = data.sleep[today];
  return (
    <Tile onPress={() => router.push({ pathname: '/sleep-edit', params: { day: today } })}>
      <View style={styles.grow} />
      <Text style={styles.big} numberOfLines={1} adjustsFontSizeToFit>
        {e ? formatSleepClock(e.minutes) : '—'}
      </Text>
      <Text style={styles.name}>Сон</Text>
      <Text style={styles.muted}>{e ? sleepScore(e) || 'без оценки' : 'Записать'}</Text>
    </Tile>
  );
}

function RunTile({ data, today }: TileProps) {
  const { runs } = weekCounts(data, today);
  const runDay = homeDayType(today) === 'run';
  const run = data.runs[today];
  return (
    <Tile onPress={() => router.push(runDay ? '/run-edit' : '/runs')}>
      <View style={styles.grow} />
      <Text style={styles.big} numberOfLines={1} adjustsFontSizeToFit>
        {runs}/{RUNS_PER_WEEK}
      </Text>
      <Text style={styles.name}>Пробежки за неделю</Text>
      {runDay && <Text style={styles.muted}>{run ? `Сегодня: ${formatRunTime(run.minutes)}` : 'Сегодня пробежка'}</Text>}
    </Tile>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: TILE_GAP, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  h1: { fontSize: 36, fontWeight: '700', color: colors.text },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
  full: { flex: 0 },
  grow: { flex: 1 },
  center: { alignItems: 'center', paddingVertical: 4 },
  ringNum: { fontSize: 30, fontWeight: '700', color: colors.text },
  bigLine: { color: colors.text },
  big: { fontSize: 48, fontWeight: '700', color: colors.text, letterSpacing: -1 },
  unit: { fontSize: 18, fontWeight: '600', color: colors.muted },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  thumb: { height: 64, borderRadius: 16 },
  primary: { marginTop: 6, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  primaryText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
});
