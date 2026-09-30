import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Segmented } from '../../components/ui';
import { getVariant, PROGRAM } from '../../data/program';
import { formatDate, formatPreview } from '../../logic/format';
import { getBest } from '../../logic/records';
import { highlightedTemplate } from '../../logic/schedule';
import { chosenKind, lastFinished, sessionExercises, SHORT_EXERCISES, setLengthChoice, SHORT_MAX_WORK_SETS, startWorkout, workSetCount } from '../../logic/session';
import { useStore } from '../../store/AppStore';
import { colors, gap } from '../../theme';
import type { AppData, Length, TemplateId } from '../../types';

const LENGTHS: { value: Length; label: string }[] = [
  { value: 'long', label: 'Длинная' },
  { value: 'short', label: 'Короткая' },
];

export default function WorkoutsScreen() {
  const { data, update } = useStore();
  const highlight = highlightedTemplate();
  const [open, setOpen] = useState<TemplateId | null>(null);

  const setLength = (id: TemplateId, length: Length) => update((d) => setLengthChoice(d, id, length));
  const start = (id: TemplateId) => update((d) => startWorkout(d, id));

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
            <Button
              title={open === t.id ? 'Скрыть упражнения' : 'Упражнения'}
              variant="secondary"
              small
              onPress={() => setOpen(open === t.id ? null : t.id)}
            />
            {open === t.id && <Preview data={data} id={t.id} length={length} />}
            <Button title="Начать" onPress={() => start(t.id)} />
          </Card>
        );
      })}
    </ScrollView>
  );
}

// Предпросмотр: упражнения выбранной версии — вариант, подходы × диапазон × рекорд.
function Preview({ data, id, length }: { data: AppData; id: TemplateId; length: Length }) {
  return (
    <View style={styles.preview}>
      {sessionExercises(id, length).map((e, i) => {
        const variant = getVariant(e, chosenKind(data, e));
        return (
          <View key={e.id} style={styles.previewRow}>
            <Text style={styles.previewName}>
              {i + 1}. {variant.name}
            </Text>
            <Text style={styles.previewPlan}>{formatPreview(variant, getBest(data, variant), workSetCount(variant, length))}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap },
  card: { gap: 12 },
  cardHighlighted: { borderColor: colors.highlight },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  badge: {
    backgroundColor: colors.button,
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  meta: { fontSize: 14, color: colors.muted },
  preview: { gap: 0 },
  previewRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border, gap: 2 },
  previewName: { fontSize: 16, fontWeight: '600', color: colors.text },
  previewPlan: { fontSize: 14, color: colors.muted, fontVariant: ['tabular-nums'] },
});
