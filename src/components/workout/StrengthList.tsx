import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { PROGRAM } from '../../data/program';
import { formatDate } from '../../logic/format';
import { highlightedTemplate } from '../../logic/schedule';
import { lastFinished, SHORT_EXERCISES, setLengthChoice, SHORT_MAX_WORK_SETS, startWorkout } from '../../logic/session';
import { useStore } from '../../store/AppStore';
import { colors, gap } from '../../theme';
import type { Length, TemplateId } from '../../types';
import { Button, Card, Segmented } from '../ui';
import { LENGTHS, WorkoutPreview } from './WorkoutPreview';

// «Силовые»: тренировки Вт/Чт/Сб — длина, предпросмотр, «Начать».
export function StrengthList() {
  const { data, update } = useStore();
  const highlight = highlightedTemplate();
  const [open, setOpen] = useState<TemplateId | null>(null);

  const setLength = (id: TemplateId, length: Length) => update((d) => setLengthChoice(d, id, length));
  const start = (id: TemplateId) => update((d) => startWorkout(d, id));

  return (
    <View style={styles.list}>
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
            {open === t.id && <WorkoutPreview data={data} id={t.id} length={length} />}
            <Button title="Начать" onPress={() => start(t.id)} />
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap },
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
});
