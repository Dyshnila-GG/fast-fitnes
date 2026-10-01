import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { Text } from '../components/Text';
import { Button, Card, Segmented } from '../components/ui';
import { LENGTHS, WorkoutPreview } from '../components/workout/WorkoutPreview';
import { getTemplate } from '../data/program';
import { setLengthChoice, startWorkout } from '../logic/session';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import type { TemplateId } from '../types';

// Модалка с «Главной»: предпросмотр тренировки; start=1 — с кнопкой «Начать» (сегодняшняя).
export default function WorkoutPreviewScreen() {
  const { id, start } = useLocalSearchParams<{ id: TemplateId; start?: string }>();
  const { data, update } = useStore();
  const template = getTemplate(id);
  const length = data.lengthChoice[id] ?? 'long';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: start ? 'Начать тренировку' : 'Предпросмотр' }} />
      <Text style={styles.title}>{template.title}</Text>
      <Segmented options={LENGTHS} value={length} onChange={(l) => update((d) => setLengthChoice(d, id, l))} />
      {start && <Button title="Начать" onPress={() => update((d) => startWorkout(d, id, length))} />}
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
