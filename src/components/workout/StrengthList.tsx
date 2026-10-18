import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { PROGRAM } from '../../data/program';
import { formatDate } from '../../logic/format';
import { highlightedTemplate } from '../../logic/schedule';
import { lastFinished, SHORT_EXERCISES, setLengthChoice, SHORT_MAX_WORK_SETS, startWorkout } from '../../logic/session';
import { planExerciseLabel } from '../../logic/planRuntime';
import { startImportedWorkout } from '../../logic/importedSession';
import { useStore } from '../../store/AppStore';
import { colors, gap } from '../../theme';
import type { Length, TemplateId } from '../../types';
import { Button, Card, Segmented } from '../ui';
import { lengths, WorkoutPreview } from './WorkoutPreview';
import { templateTitle } from '../../i18n/content';
import { useT } from '../../i18n/useT';

export function StrengthList() {
  const t = useT();
  const { data, update } = useStore();
  const imported=data.installedPlan?.pack.training?.workouts;
  const highlight = highlightedTemplate();
  const [open, setOpen] = useState<TemplateId | null>(null);

  // Once a Plan Pack contains training, it becomes the source of truth for the list.
  if (imported?.length) {
    return (
      <View style={styles.list}>
        {imported.map((tpl)=>{
          const last=lastFinished(data,tpl.id);
          const opened=open===tpl.id;
          return (
            <Card key={tpl.id} style={styles.card}>
              <Text style={styles.title}>{tpl.title}</Text>
              <Text style={styles.meta}>{last ? t('strength.last',{date:formatDate(last.finishedAt!)}) : t('strength.never')}</Text>
              <Text style={styles.meta}>{tpl.exercises.length} упражнений · Plan Pack</Text>
              <Button title={opened ? t('strength.hideExercises') : t('strength.exercises')} variant="secondary" small onPress={()=>setOpen(opened?null:tpl.id)} />
              {opened && <View>{tpl.exercises.map((e,i)=><View key={`${e.exerciseId}:${i}`} style={styles.exercise}><Text style={styles.exerciseName}>{i+1}. {e.exerciseId}</Text><Text style={styles.meta}>{planExerciseLabel(e)}</Text></View>)}</View>}
              <Button title={t('common.start')} onPress={()=>update(d=>startImportedWorkout(d,tpl.id))} />
            </Card>
          );
        })}
      </View>
    );
  }

  const setLength = (id: TemplateId, length: Length) => update((d) => setLengthChoice(d, id, length));
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
              {isHighlighted && <Text style={styles.badge}>{t(highlight.isToday ? 'common.today' : 'strength.nearest')}</Text>}
            </View>
            <Text style={styles.meta}>{last ? t('strength.last', { date: formatDate(last.finishedAt!) }) : t('strength.never')}</Text>
            <Segmented options={lengths()} value={length} onChange={(l) => setLength(tpl.id, l)} />
            <Text style={styles.meta}>{length === 'long' ? t('strength.longInfo',{n:tpl.exercises.length}) : t('strength.shortInfo',{n:SHORT_EXERCISES,sets:SHORT_MAX_WORK_SETS})}</Text>
            <Button title={t(open === tpl.id ? 'strength.hideExercises' : 'strength.exercises')} variant="secondary" small onPress={() => setOpen(open === tpl.id ? null : tpl.id)} />
            {open === tpl.id && <WorkoutPreview data={data} id={tpl.id} length={length} />}
            <Button title={t('common.start')} onPress={() => update((d)=>startWorkout(d,tpl.id))} />
          </Card>
        );
      })}
    </View>
  );
}
const styles=StyleSheet.create({
 list:{gap},card:{gap:12},cardHighlighted:{borderColor:colors.highlight},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 title:{fontSize:24,fontWeight:'800',color:colors.text},badge:{backgroundColor:colors.button,color:colors.text,fontWeight:'600',fontSize:13,paddingHorizontal:10,paddingVertical:4,borderRadius:999,overflow:'hidden'},
 meta:{fontSize:14,color:colors.muted},exercise:{paddingVertical:8,borderTopWidth:1,borderTopColor:colors.border,gap:2},exerciseName:{fontSize:16,fontWeight:'600',color:colors.text}
});
