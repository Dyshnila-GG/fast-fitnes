import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { NavCard } from '../../components/form';
import { foodStats, formatNum } from '../../logic/food';
import { formatAge, formatDate, formatDay, formatDistance, formatHeight, formatWeight } from '../../logic/format';
import { dayKey, finishedSessions, latestFirst, progressItems } from '../../logic/metrics';
import { formatSleep, sleepAverage } from '../../logic/sleep';
import { formatRunTime } from '../../logic/run';
import { backupSupported } from '../../services/backup';
import { useStore } from '../../store/AppStore';
import { gap } from '../../theme';
import { formatNumber, LANG_NAMES, tp } from '../../i18n';
import { weightUnit, weightValue } from '../../logic/units';
import { useT } from '../../i18n/useT';

// «Профиль» (бывшие «Метрики», SPEC_v3 §10).
export default function ProfileScreen() {
  const t = useT();
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
    ? t('profile.weightSub', {
        w: formatWeight(lastWeight.value),
        date: formatDay(lastWeight.date),
        diff: signed(weightValue(lastWeight.value) - weightValue(profile.startWeight)),
        u: weightUnit(),
      })
    : t('common.noRecords');

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <NavCard
        title={t('tabs.profile')}
        subtitle={t('profile.personalSub', { age: formatAge(profile.age), height: formatHeight(profile.heightIn), start: formatWeight(profile.startWeight) })}
        onPress={() => router.push('/personal')}
      />
      <NavCard title={t('home.weight')} subtitle={weightSub} onPress={() => router.push('/weight')} />
      <NavCard
        title={t('profile.measurements')}
        subtitle={lastMeasure ? t('profile.measurementsLast', { date: formatDay(lastMeasure.date) }) : t('common.noRecords')}
        onPress={() => router.push('/measurements')}
      />
      <NavCard
        title={t('profile.history')}
        subtitle={sessions.length > 0 ? t('profile.historySub', { workouts: tp('count.workouts', sessions.length), date: formatDate(sessions[0].finishedAt!) }) : t('profile.empty')}
        onPress={() => router.push('/history')}
      />
      <NavCard
        title={t('profile.progress')}
        subtitle={progress.length > 0 ? t('profile.progressSub', { exercises: tp('count.exercises', progress.length) }) : t('profile.progressEmpty')}
        onPress={() => router.push('/progress')}
      />
      <NavCard
        title={t('tabs.food')}
        subtitle={t('profile.foodSub', { meals: tp('count.meals', food.eaten), total: food.total, kcal: formatNum(food.avgKcal), protein: food.avgProtein })}
        onPress={() => router.push('/food')}
      />
      <NavCard
        title={t('reminder.sleep.title')}
        subtitle={sleep7 != null ? t('profile.sleepSub', { avg: formatSleep(sleep7) }) : t('common.noRecords')}
        onPress={() => router.push('/sleep')}
      />
      <NavCard
        title={t('profile.runs')}
        subtitle={
          lastRun
            ? t('profile.runsSub', { runs: tp('count.runs', runDays.length), date: formatDay(runDays[0]), time: formatRunTime(lastRun.minutes) }) +
              (lastRun.distanceMi != null ? ` · ${formatDistance(lastRun.distanceMi)}` : '')
            : t('profile.runsEmpty')
        }
        onPress={() => router.push('/runs')}
      />
      <NavCard title={t('profile.menu')} subtitle={t('profile.menuSub', { dishes: tp('count.dishes', Object.keys(data.food.dishes).length) })} onPress={() => router.push('/menu')} />
      <NavCard title={t('profile.schedule')} subtitle={t('profile.scheduleSub')} onPress={() => router.push('/food-settings')} />
      <NavCard
        title={t('profile.backup')}
        subtitle={
          !backupSupported
            ? t('backup.restore')
            : data.backup.lastAt
              ? t('profile.backupLast', { date: formatDate(data.backup.lastAt) })
              : data.backup.dirUri
                ? t('profile.backupNever')
                : t('profile.backupPick')
        }
        warning={data.backup.error ? t('backup.dirError') : undefined}
        onPress={() => router.push('/backup')}
      />
      <NavCard
        title={t('profile.reminders')}
        subtitle={[
          `${t('reminder.sleep.title')} ${data.reminders.sleep.on ? data.reminders.sleep.time : t('common.off')}`,
          `${t('reminder.workout.title')} ${data.reminders.workout.on ? data.reminders.workout.time : t('common.off')}`,
        ].join(' · ')}
        onPress={() => router.push('/reminders')}
      />
      <NavCard
        title={t('profile.trash')}
        subtitle={data.trash.length > 0 ? t('profile.trashSub', { n: data.trash.length }) : t('profile.trashEmpty')}
        onPress={() => router.push('/trash')}
      />
      <NavCard
        title={t('profile.appSettings')}
        subtitle={`${LANG_NAMES[data.settings.lang]} · ${t(`settings.units.${data.settings.units}`)}`}
        onPress={() => router.push('/app-settings')}
      />
      <NavCard title={t('profile.data')} subtitle={t('profile.dataSub')} onPress={() => router.push('/data')} />
    </ScrollView>
  );
}

const signed = (n: number) => (n > 0 ? `+${formatNumber(n)}` : formatNumber(n));

const styles = StyleSheet.create({
  content: { padding: 16, gap },
});
