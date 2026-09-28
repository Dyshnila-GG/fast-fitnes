import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ToastAndroid, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseCard } from '../components/workout/ExerciseCard';
import { FinishModal } from '../components/workout/FinishModal';
import { Header } from '../components/workout/Header';
import { RestTimer } from '../components/workout/RestTimer';
import { WarmupChecklist } from '../components/workout/WarmupChecklist';
import { getExercise, getVariant } from '../data/program';
import {
  addSet,
  buildExerciseLog,
  copyPlanToFact,
  currentExerciseIndex,
  finishActive,
  hasFacts,
  removeSet,
  shiftRest,
  skippedItems,
  startRest,
  stopRest,
  togglePause,
  updateSet,
} from '../logic/session';
import { useStore } from '../store/AppStore';
import { gap } from '../theme';
import type { ExerciseLog, Kind, Session } from '../types';

export default function WorkoutScreen() {
  useKeepAwake();
  const { data, update } = useStore();
  const insets = useSafeAreaInsets();
  const [finishing, setFinishing] = useState(false);
  const session = data.activeSession;

  // Системная кнопка «назад» на Android заблокирована.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (Platform.OS === 'android') ToastAndroid.show('Поставьте на паузу или завершите тренировку', ToastAndroid.SHORT);
      return true;
    });
    return () => sub.remove();
  }, []);

  const updateSession = useCallback(
    (fn: (s: Session) => Session) => update((d) => (d.activeSession ? { ...d, activeSession: fn(d.activeSession) } : d)),
    [update],
  );
  const stopRestTimer = useCallback(() => updateSession(stopRest), [updateSession]);

  if (!session) return null;

  const updateLog = (index: number, fn: (log: ExerciseLog) => ExerciseLog) =>
    updateSession((s) => ({ ...s, exercises: s.exercises.map((l, i) => (i === index ? fn(l) : l)) }));

  const modeOf = (log: ExerciseLog) => getVariant(getExercise(log.exerciseId), log.variant).mode;

  const switchVariant = (index: number, kind: Kind) => {
    const apply = () =>
      update((d) => {
        const s = d.activeSession;
        if (!s) return d;
        const ex = getExercise(s.exercises[index].exerciseId);
        const prev = s.exercises[index];
        const log = { ...buildExerciseLog(d, ex, kind, s.length), difficulty: prev.difficulty, comment: prev.comment };
        return {
          ...d,
          variantChoice: { ...d.variantChoice, [ex.id]: kind },
          activeSession: { ...s, exercises: s.exercises.map((l, i) => (i === index ? log : l)) },
        };
      });
    if (!hasFacts(session.exercises[index])) return apply();
    Alert.alert('Сменить вариант?', 'Введённые подходы этого упражнения будут сброшены.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Сменить', style: 'destructive', onPress: apply },
    ]);
  };

  const toggleWarmup = (id: string) =>
    updateSession((s) => ({
      ...s,
      warmupDone: s.warmupDone.includes(id) ? s.warmupDone.filter((x) => x !== id) : [...s.warmupDone, id],
    }));

  // Выход только через «Завершить»: после изменения activeSession навигация переключается сама (см. _layout).
  const finish = () => {
    setFinishing(false);
    update((d) => finishActive(d));
  };
  const discard = () => {
    setFinishing(false);
    update((d) => ({ ...d, activeSession: null }));
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <Header
        session={session}
        current={currentExerciseIndex(session) + 1}
        total={session.exercises.length}
        onPause={() => updateSession((s) => togglePause(s))}
        onFinish={() => setFinishing(true)}
      />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (session.restEndsAt ? 200 : 24) }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <WarmupChecklist length={session.length} done={session.warmupDone} onToggle={toggleWarmup} />
          {session.exercises.map((log, i) => (
            <ExerciseCard
              key={log.exerciseId}
              log={log}
              number={i + 1}
              onVariant={(k) => switchVariant(i, k)}
              onSet={(si, patch) => updateLog(i, (l) => updateSet(l, modeOf(l), si, patch))}
              onCopy={(si) => updateLog(i, (l) => copyPlanToFact(l, modeOf(l), si))}
              onRemove={(si) => updateLog(i, (l) => removeSet(l, si))}
              onAdd={(type) => updateLog(i, (l) => addSet(l, type))}
              onRate={(patch) => updateLog(i, (l) => ({ ...l, ...patch }))}
              onRest={() => updateSession((s) => startRest(s, getExercise(log.exerciseId).restSec))}
            />
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
      {session.restEndsAt && (
        <RestTimer
          endsAt={session.restEndsAt}
          totalSec={session.restSec ?? 0}
          bottom={insets.bottom}
          onShift={(delta) => updateSession((s) => shiftRest(s, delta))}
          onStop={stopRestTimer}
        />
      )}
      <FinishModal
        visible={finishing}
        skipped={finishing ? skippedItems(session) : []}
        onBack={() => setFinishing(false)}
        onFinish={finish}
        onDiscard={discard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap },
});
