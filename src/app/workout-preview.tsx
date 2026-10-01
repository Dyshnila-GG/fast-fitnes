import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { Text } from '../components/Text';
import { Button, Card, Segmented } from '../components/ui';
import { lengths, WorkoutPreview } from '../components/workout/WorkoutPreview';
import { getTemplate } from '../data/program';
import { setLengthChoice, startWorkout } from '../logic/session';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import type { TemplateId } from '../types';
import { templateTitle } from '../i18n/content';
import { useT } from '../i18n/useT';

// Модалка с «Главной»: предпросмотр тренировки; start=1 — с кнопкой «Начать» (сегодняшняя).
export default function WorkoutPreviewScreen() {
  const t = useT();
  const { id, start } = useLocalSearchParams<{ id: TemplateId; start?: string }>();
  const { data, update } = useStore();
  const template = getTemplate(id);
  const length = data.lengthChoice[id] ?? 'long';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: t(start ? 'preview.startTitle' : 'preview.title') }} />
      <Text style={styles.title}>{templateTitle(template)}</Text>
      <Segmented options={lengths()} value={length} onChange={(l) => update((d) => setLengthChoice(d, id, l))} />
      {start && <Button title={t('common.start')} onPress={() => update((d) => startWorkout(d, id, length))} />}
      <Card>
        <WorkoutPreview data={data} id={id} length={length} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
});
