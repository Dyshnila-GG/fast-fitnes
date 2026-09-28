import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { NavCard } from '../../components/form';
import { formatAge, formatDate, formatDay, formatHeight } from '../../logic/format';
import { finishedSessions, latestFirst, progressItems } from '../../logic/metrics';
import { useStore } from '../../store/AppStore';
import { gap } from '../../theme';

const round = (n: number) => Math.round(n * 10) / 10;

export default function MetricsScreen() {
  const { data } = useStore();
  const { profile } = data;
  const lastWeight = latestFirst(data.bodyWeight)[0];
  const lastMeasure = latestFirst(data.measurements)[0];
  const sessions = finishedSessions(data.sessions);
  const progress = progressItems(data.sessions);

  const weightSub = lastWeight
    ? `${lastWeight.value} lb · ${formatDay(lastWeight.date)} · ${signed(round(lastWeight.value - profile.startWeight))} lb от стартового`
    : 'Нет записей';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <NavCard title="Вес тела" subtitle={weightSub} onPress={() => router.push('/weight')} />
      <NavCard
        title="Замеры"
        subtitle={lastMeasure ? `Последние: ${formatDay(lastMeasure.date)}` : 'Нет записей'}
        onPress={() => router.push('/measurements')}
      />
      <NavCard
        title="История тренировок"
        subtitle={sessions.length > 0 ? `${sessions.length} · последняя ${formatDate(sessions[0].finishedAt!)}` : 'Пока пусто'}
        onPress={() => router.push('/history')}
      />
      <NavCard
        title="Прогресс по упражнению"
        subtitle={progress.length > 0 ? `Упражнений с результатами: ${progress.length}` : 'Появится после первой тренировки'}
        onPress={() => router.push('/progress')}
      />
      <NavCard
        title="Профиль"
        subtitle={`${formatAge(profile.age)} · ${formatHeight(profile.heightIn)} · старт ${profile.startWeight} lb`}
        onPress={() => router.push('/profile')}
      />
      <NavCard title="Экспорт / импорт" subtitle="Резервная копия всех данных в JSON" onPress={() => router.push('/data')} />
    </ScrollView>
  );
}

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

const styles = StyleSheet.create({
  content: { padding: 16, gap },
});
