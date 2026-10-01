import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { confirmDeleteSession } from '../../components/history/confirmDelete';
import { Icon } from '../../components/Icon';
import { Card } from '../../components/ui';
import { getExercise, getTemplate, getVariant } from '../../data/program';
import { exerciseMeta, formatDate, formatDuration, formatFact, formatSetPlan, formatTime, formatTonnage, formatWarmup } from '../../logic/format';
import { tonnage } from '../../logic/tonnage';
import { sessionReport } from '../../logic/report';
import { deleteSession, elapsedMs, WARMUP_ITEMS } from '../../logic/session';
import { shareReport } from '../../services/share';
import { useStore } from '../../store/AppStore';
import { colors, gap } from '../../theme';
import type { ExerciseLog } from '../../types';
import { exerciseTitle, templateTitle, variantName } from '../../i18n/content';
import { useT } from '../../i18n/useT';

// Детали тренировки: все подходы план/факт, ответ после разминки (v1 — оценки), заметки.
export default function SessionDetailsScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, update } = useStore();
  const s = data.sessions.find((x) => x.id === id);

  if (!s || !s.finishedAt) {
    return (
      <View style={styles.content}>
        <Text style={styles.muted}>{t('history.notFound')}</Text>
      </View>
    );
  }

  // v1 — чек-лист разминки, v2 — секундомеры.
  const warmup =
    formatWarmup(s) ??
    WARMUP_ITEMS.map((w) => `${w.label} — ${t(s.warmupDone?.includes(w.id) ? 'report.done' : 'report.skipped')}`).join(' · ');

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: templateTitle(getTemplate(s.templateId)) }} />
      <Card style={styles.card}>
        <Text style={styles.title}>
          {formatDate(s.finishedAt)}, {formatTime(s.startedAt)}–{formatTime(s.finishedAt)} ·{' '}
          {t(s.length === 'short' ? 'length.shortLower' : 'length.longLower')}
        </Text>
        <Text style={styles.muted}>
          {t('history.stats', {
            duration: formatDuration(elapsedMs(s, new Date(s.finishedAt).getTime())),
            pause: formatDuration(s.pausedMs),
            tonnage: formatTonnage(tonnage(s)),
          })}
        </Text>
        <Text style={styles.muted}>{t('result.warmup', { sets: warmup })}</Text>
      </Card>
      {s.exercises.map((log) => (
        <ExerciseDetails key={log.exerciseId} log={log} />
      ))}
      <Pressable
        onPress={() => shareReport(sessionReport(s))}
        accessibilityRole="button"
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
      >
        <Icon name="file-download-outline" size={22} color={colors.onPrimary} />
        <Text style={styles.actionText}>{t('report.download')}</Text>
      </Pressable>
      <Pressable
        onPress={() =>
          confirmDeleteSession(s, () => {
            router.back();
            update((d) => deleteSession(d, s.id));
          })
        }
        accessibilityRole="button"
        style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
      >
        <Icon name="trash-can-outline" size={20} color={colors.danger} />
        <Text style={styles.deleteText}>{t('common.delete')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function ExerciseDetails({ log }: { log: ExerciseLog }) {
  const t = useT();
  const ex = getExercise(log.exerciseId);
  const variant = getVariant(ex, log.variant);
  const meta = exerciseMeta(log, variant);
  let warm = 0;
  let work = 0;

  return (
    <Card style={styles.card}>
      <Text style={styles.muted}>{exerciseTitle(ex)}</Text>
      <Text style={styles.name}>{variantName(variant)}</Text>
      <View style={styles.head}>
        <Text style={[styles.headText, styles.num]}>№</Text>
        <Text style={[styles.headText, styles.col]}>{t('report.plan')}</Text>
        <Text style={[styles.headText, styles.col]}>{t('report.fact')}</Text>
      </View>
      {log.sets.map((set, i) => (
        <View key={i} style={styles.row}>
          <Text style={[styles.cell, styles.num, styles.mutedCell]}>{set.type === 'warmup' ? t('history.warmupNum', { n: ++warm }) : `${++work}`}</Text>
          <Text style={[styles.cell, styles.col]}>{formatSetPlan(set)}</Text>
          <Text style={[styles.cell, styles.col, styles.fact]}>{formatFact(set, variant)}</Text>
        </View>
      ))}
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      {log.comment ? <Text style={styles.comment}>«{log.comment}»</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap, paddingBottom: 40 },
  card: { gap: 6 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  head: { flexDirection: 'row', gap: 8, marginTop: 4 },
  headText: { fontSize: 12, color: colors.muted },
  row: { flexDirection: 'row', gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  num: { width: 28 },
  col: { flex: 1 },
  cell: { fontSize: 15, color: colors.text, fontVariant: ['tabular-nums'] },
  mutedCell: { color: colors.muted },
  fact: { fontWeight: '700' },
  meta: { fontSize: 14, color: colors.text, marginTop: 4 },
  comment: { fontSize: 14, color: colors.muted, fontStyle: 'italic' },
  delete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.button,
    marginTop: 4,
  },
  deleteText: { fontSize: 17, fontWeight: '600', color: colors.danger },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  actionText: { fontSize: 17, fontWeight: '700', color: colors.onPrimary },
  pressed: { opacity: 0.7 },
});
