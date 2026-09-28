import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { Button, Card } from '../components/ui';
import { getExercise, getTemplate, getVariant } from '../data/program';
import { formatPlan } from '../logic/format';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';

// Этап 1: просмотр состава тренировки. Полный экран — на этапе 2.
export default function WorkoutScreen() {
  const { data, update } = useStore();
  const session = data.activeSession;

  if (!session) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.muted}>Нет активной тренировки.</Text>
        </Card>
      </ScrollView>
    );
  }

  const cancel = () =>
    Alert.alert('Удалить тренировку?', 'Данные этой тренировки будут потеряны.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          update((d) => ({ ...d, activeSession: null }));
          router.back();
        },
      },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        {getTemplate(session.templateId).title} · {session.length === 'short' ? 'короткая' : 'длинная'}
      </Text>
      {session.exercises.map((log, i) => {
        const ex = getExercise(log.exerciseId);
        const variant = getVariant(ex, log.variant);
        const work = log.sets.filter((s) => s.type === 'work');
        const w = work[0];
        return (
          <Card key={log.exerciseId} style={styles.card}>
            <Text style={styles.exTitle}>
              {i + 1}. {variant.name}
            </Text>
            <Text style={styles.muted}>
              {variant.equipment} ·{' '}
              {formatPlan(variant, {
                sets: work.length,
                reps: w?.planReps,
                repsMax: variant.plan.repsMax,
                seconds: w?.planSeconds,
                weight: w?.planWeight,
              })}
            </Text>
            <Text style={styles.muted}>Мышцы: {ex.muscles}</Text>
          </Card>
        );
      })}
      <Button title="Удалить тренировку" variant="danger" onPress={cancel} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  card: { gap: 4 },
  exTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
});
