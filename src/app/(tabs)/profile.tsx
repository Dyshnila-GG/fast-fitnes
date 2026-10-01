import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { NavCard } from '../../components/form';
import { foodStats, formatNum } from '../../logic/food';
import { formatAge, formatDate, formatDay, formatHeight } from '../../logic/format';
import { dayKey, finishedSessions, latestFirst, progressItems } from '../../logic/metrics';
import { formatSleep, sleepAverage } from '../../logic/sleep';
import { formatRunTime } from '../../logic/run';
import { backupSupported } from '../../services/backup';
import { useStore } from '../../store/AppStore';
import { gap } from '../../theme';

const round = (n: number) => Math.round(n * 10) / 10;

// «Профиль» (бывшие «Метрики», SPEC_v3 §10).
export default function ProfileScreen() {
  const { data } = useStore();
  const { profile } = data;
  const today = dayKey();
  const lastWeight = latestFirst(data.bodyWeight)[0];
  const lastMeasure = latestFirst(data.measurements)[0];
  const sessions = finishedSessions(data.sessions);
  const progress = progressItems(data.sessions);
  const food = foodStats(data.food, today);
  const sleep7 = sleepAverage(data.sleep, today, 7);
  const runDays = Object.keys(data.runs).sort().reverse();
  const lastRun = runDays[0] ? data.runs[runDays[0]] : undefined;

  const weightSub = lastWeight
    ? `${lastWeight.value} lb · ${formatDay(lastWeight.date)} · ${signed(round(lastWeight.value - profile.startWeight))} lb от стартового`
    : 'Нет записей';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <NavCard
        title="Профиль"
        subtitle={`${formatAge(profile.age)} · ${formatHeight(profile.heightIn)} · старт ${profile.startWeight} lb`}
        onPress={() => router.push('/personal')}
      />
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
        title="Еда"
        subtitle={`7 дней: отмечено ${food.eaten} из ${food.total} приёмов · в среднем ${formatNum(food.avgKcal)} ккал и ${food.avgProtein} г белка в день`}
        onPress={() => router.push('/food')}
      />
      <NavCard
        title="Сон"
        subtitle={sleep7 != null ? `Среднее за 7 дней: ${formatSleep(sleep7)}` : 'Нет записей'}
        onPress={() => router.push('/sleep')}
      />
      <NavCard
        title="Пробежки"
        subtitle={
          lastRun
            ? `${runDays.length} · последняя ${formatDay(runDays[0])}, ${formatRunTime(lastRun.minutes)}${lastRun.distanceMi != null ? ` · ${lastRun.distanceMi} mi` : ''}`
            : 'Тренировки → Пробежка или отметка на «Главной»'
        }
        onPress={() => router.push('/runs')}
      />
      <NavCard title="Настройки еды" subtitle="Время приёмов пищи для «Дня зала» и «Обычного дня»" onPress={() => router.push('/food-settings')} />
      <NavCard
        title="Бэкап"
        subtitle={
          !backupSupported
            ? 'Восстановить из файла'
            : data.backup.lastAt
              ? `Последний бэкап: ${formatDate(data.backup.lastAt)}`
              : data.backup.dirUri
                ? 'Бэкапа ещё не было'
                : 'Выберите папку на телефоне — бэкап раз в неделю'
        }
        warning={data.backup.error}
        onPress={() => router.push('/backup')}
      />
      <NavCard
        title="Напоминания"
        subtitle={[
          `Сон ${data.reminders.sleep.on ? data.reminders.sleep.time : 'выкл.'}`,
          `Тренировка ${data.reminders.workout.on ? data.reminders.workout.time : 'выкл.'}`,
        ].join(' · ')}
        onPress={() => router.push('/reminders')}
      />
      <NavCard
        title="Корзина"
        subtitle={data.trash.length > 0 ? `Удалённых тренировок: ${data.trash.length}` : 'Пусто'}
        onPress={() => router.push('/trash')}
      />
      <NavCard title="Экспорт / импорт" subtitle="Резервная копия всех данных в JSON" onPress={() => router.push('/data')} />
    </ScrollView>
  );
}

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

const styles = StyleSheet.create({
  content: { padding: 16, gap },
});
