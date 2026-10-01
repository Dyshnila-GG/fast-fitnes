import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseResult } from '../components/summary/ExerciseResult';
import { RecordRow } from '../components/summary/RecordRow';
import { Button, Card } from '../components/ui';
import { getExercise, getTemplate, getVariant, isLegacyTemplate } from '../data/program';
import { formatDate, formatDuration, formatWarmup } from '../logic/format';
import { getBest, setBest } from '../logic/records';
import { tonnage } from '../logic/tonnage';
import { elapsedMs } from '../logic/session';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import { formatNumber } from '../i18n';
import { templateTitle } from '../i18n/content';
import { weightUnit, weightValue } from '../logic/units';
import { useT } from '../i18n/useT';

// Итог тренировки (SPEC §3.7). Открыт, пока не нажата «Готово» (см. _layout).
export default function SummaryScreen() {
  const t = useT();
  const { data, update } = useStore();
  const insets = useSafeAreaInsets();
  const session = data.sessions.find((s) => s.id === data.summaryId);
  const close = () => update((d) => ({ ...d, summaryId: null }));

  if (!session) {
    return (
      <View style={[styles.screen, styles.content, { paddingTop: insets.top + 16 }]}>
        <Button title={t('common.done')} onPress={close} />
      </View>
    );
  }

  const end = new Date(session.finishedAt ?? session.startedAt).getTime();
  const warmup = formatWarmup(session);
  const variantOf = (exerciseId: string, kind: 'machine' | 'free') => getVariant(getExercise(exerciseId), kind);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View>
          <Text style={styles.title}>{t('summary.title')}</Text>
          <Text style={styles.sub}>
            {templateTitle(getTemplate(session.templateId))} · {t(session.length === 'short' ? 'length.shortLower' : 'length.longLower')} ·{' '}
            {formatDate(session.finishedAt ?? session.startedAt)}
          </Text>
        </View>

        <Card style={styles.stats}>
          <Stat label={t('report.duration')} value={formatDuration(elapsedMs(session, end))} />
          <Stat label={t('report.pause')} value={formatDuration(session.pausedMs)} />
          <Stat label={t('summary.tonnage', { u: weightUnit() })} value={formatNumber(Math.round(weightValue(tonnage(session))), 0)} />
        </Card>

        {warmup && (
          <Card style={styles.card}>
            <Text style={styles.section}>{t('summary.warmup')}</Text>
            <Text style={styles.warmup}>{warmup}</Text>
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={styles.section}>{t('summary.exercises')}</Text>
          {session.exercises.map((log) => (
            <ExerciseResult key={log.exerciseId} log={log} />
          ))}
        </Card>

        {!isLegacyTemplate(session.templateId) && (
          <Card style={styles.card}>
            <Text style={styles.section}>{t('summary.records')}</Text>
            <Text style={styles.hint}>
              {t('summary.recordsHint')}
            </Text>
            {session.exercises.map((log) => (
              <RecordRow
                key={log.exerciseId}
                log={log}
                best={getBest(data, variantOf(log.exerciseId, log.variant))}
                onChange={(patch) => update((d) => setBest(d, variantOf(log.exerciseId, log.variant), patch))}
              />
            ))}
          </Card>
        )}

        <Button title={t('common.done')} onPress={close} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: { fontSize: 15, color: colors.muted, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, gap: 2 },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 13, color: colors.muted },
  card: { gap: 4 },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.5 },
  hint: { fontSize: 14, color: colors.muted, marginBottom: 4 },
  warmup: { fontSize: 15, color: colors.text, fontVariant: ['tabular-nums'] },
});
