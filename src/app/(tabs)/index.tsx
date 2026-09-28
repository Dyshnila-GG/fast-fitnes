import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Segmented } from '../../components/ui';
import { PROGRAM } from '../../data/program';
import { formatDate } from '../../logic/format';
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

  const setLength = (id: TemplateId, length: Length) =>
    update((d) => ({ ...d, lengthChoice: { ...d.lengthChoice, [id]: length } }));

  // Экран тренировки открывается сам, как только появляется activeSession (см. _layout).
  const start = (id: TemplateId) =>
    update((d) => (d.activeSession ? d : { ...d, activeSession: buildSession(d, id, d.lengthChoice[id] ?? 'long') }));

  return (
    <ScrollView contentContainerStyle={styles.content}>
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
