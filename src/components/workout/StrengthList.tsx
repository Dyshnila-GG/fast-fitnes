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
import { lengths, WorkoutPreview } from './WorkoutPreview';
import { templateTitle } from '../../i18n/content';
import { tp } from '../../i18n';
import { useT } from '../../i18n/useT';

// «Силовые»: тренировки Вт/Чт/Сб — длина, предпросмотр, «Начать».
export function StrengthList() {
  const t = useT();
  const { data, update } = useStore();
  const highlight = highlightedTemplate();
  const [open, setOpen] = useState<TemplateId | null>(null);

  const setLength = (id: TemplateId, length: Length) => update((d) => setLengthChoice(d, id, length));
  const start = (id: TemplateId) => update((d) => startWorkout(d, id));

  return (
    <View style={styles.list}>
      {PROGRAM.map((tpl) => {
        const length = data.lengthChoice[tpl.id] ?? 'long';
        const last = lastFinished(data, tpl.id);
        const isHighlighted = highlight.id === tpl.id;
        return (
          <Card key={tpl.id} style={[styles.card, isHighlighted && styles.cardHighlighted]}>
            <View style={styles.row}>
              <Text style={styles.title}>{templateTitle(tpl)}</Text>
              {isHighlighted && (
                <Text style={styles.badge}>{t(highlight.isToday ? 'common.today' : 'strength.nearest')}</Text>
              )}
            </View>
            <Text style={styles.meta}>
              {last ? t('strength.last', { date: formatDate(last.finishedAt!) }) : t('strength.never')}
            </Text>
            <Segmented options={lengths()} value={length} onChange={(l) => setLength(tpl.id, l)} />
            <Text style={styles.meta}>
              {length === 'long'
                ? t('strength.longInfo', { exercises: tp('count.exercises', tpl.exercises.length) })
                : t('strength.shortInfo', { exercises: tp('count.exercises', SHORT_EXERCISES), sets: SHORT_MAX_WORK_SETS })}
            </Text>
            <Button
              title={t(open === tpl.id ? 'strength.hideExercises' : 'strength.exercises')}
              variant="secondary"
              small
              onPress={() => setOpen(open === tpl.id ? null : tpl.id)}
            />
            {open === tpl.id && <WorkoutPreview data={data} id={tpl.id} length={length} />}
            <Button title={t('common.start')} onPress={() => start(tpl.id)} />
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.text },
  badge: {
    flexShrink: 0,
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
