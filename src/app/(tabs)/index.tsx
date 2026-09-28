import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Segmented } from '../../components/ui';
import { getTemplate, PROGRAM } from '../../data/program';
import { formatDate, formatTime } from '../../logic/format';
import { highlightedTemplate } from '../../logic/schedule';
import { buildSession, lastFinished, SHORT_EXERCISES, SHORT_MAX_WORK_SETS } from '../../logic/session';
import { useStore } from '../../store/AppStore';
import { colors, gap } from '../../theme';
import type { Length, TemplateId } from '../../types';

const LENGTHS: { value: Length; label: string }[] = [
  { value: 'long', label: 'Длинная' },
  { value: 'short', label: 'Короткая' },
];

export default function WorkoutsScreen() {
  const { data, update } = useStore();
  const highlight = highlightedTemplate();
  const active = data.activeSession;

  const setLength = (id: TemplateId, length: Length) =>
    update((d) => ({ ...d, lengthChoice: { ...d.lengthChoice, [id]: length } }));

  const start = (id: TemplateId) => {
    const begin = () => {
      update((d) => ({ ...d, activeSession: buildSession(d, id, d.lengthChoice[id] ?? 'long') }));
      router.push('/workout');
    };
    if (!active) return begin();
    Alert.alert('Есть незавершённая тренировка', 'Начать новую? Незавершённая будет удалена.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Начать новую', style: 'destructive', onPress: begin },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {active && (
        <Card style={styles.banner}>
          <Text style={styles.bannerTitle}>Незавершённая тренировка</Text>
          <Text style={styles.bannerText}>
            {getTemplate(active.templateId).title} · {active.length === 'short' ? 'короткая' : 'длинная'} · начата{' '}
            {formatTime(active.startedAt)}
          </Text>
          <Button title="Продолжить тренировку" onPress={() => router.push('/workout')} />
        </Card>
      )}

      {PROGRAM.map((t) => {
        const length = data.lengthChoice[t.id] ?? 'long';
        const last = lastFinished(data, t.id);
        const isHighlighted = highlight.id === t.id;
        return (
          <Card key={t.id} style={[styles.card, isHighlighted && styles.cardHighlighted]}>
            <View style={styles.row}>
              <Text style={styles.title}>{t.title}</Text>
              {isHighlighted && (
                <Text style={styles.badge}>{highlight.isToday ? 'Сегодня' : 'Ближайшая'}</Text>
              )}
            </View>
            <Text style={styles.meta}>
              {last ? `Последняя: ${formatDate(last.finishedAt!)}` : 'Ещё не выполнялась'}
            </Text>
            <Segmented options={LENGTHS} value={length} onChange={(l) => setLength(t.id, l)} />
            <Text style={styles.meta}>
              {length === 'long'
                ? `${t.exercises.length} упражнений · все подходы по плану · бег 5–8 мин`
                : `${SHORT_EXERCISES} упражнения · до ${SHORT_MAX_WORK_SETS} рабочих подходов · бег 5 мин`}
            </Text>
            <Button title="Начать" onPress={() => start(t.id)} />
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap },
  banner: { backgroundColor: colors.warningSoft, gap: 8 },
  bannerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  bannerText: { fontSize: 15, color: colors.text },
  card: { gap: 10, borderWidth: 2, borderColor: 'transparent' },
  cardHighlighted: { borderColor: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  badge: {
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  meta: { fontSize: 14, color: colors.muted },
});
