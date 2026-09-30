import { Image } from 'expo-image';
import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ToastAndroid, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ControlBar } from '../components/workout/ControlBar';
import { ExerciseCard } from '../components/workout/ExerciseCard';
import { demoUrls } from '../components/workout/ExerciseGif';
import { FinishModal } from '../components/workout/FinishModal';
import { RestTimer } from '../components/workout/RestTimer';
import { WarmupBlock } from '../components/workout/WarmupBlock';
import { getExercise, getVariant } from '../data/program';
import {
  addSet,
  buildExerciseLog,
  copyPlanToFact,
  currentExerciseIndex,
  finishActive,
  hasFacts,
  lastNote,
  lastRating,
  removeSet,
  setRunDistance,
  shiftRest,
  skippedItems,
  startRest,
  finishStopwatch,
  pauseStopwatch,
  resetStopwatch,
  startStopwatch,
  stopRest,
  togglePause,
  updateSet,
  warmupOf,
} from '../logic/session';
import { applyFeel, setTodayWeight } from '../logic/records';
import { useStore } from '../store/AppStore';
import { gap } from '../theme';
import type { ExerciseLog, Kind, Session } from '../types';

export default function WorkoutScreen() {
  useKeepAwake();
  const { data, update } = useStore();
  const insets = useSafeAreaInsets();
  const [finishing, setFinishing] = useState(false);
  const session = data.activeSession;
  const keyboard = useKeyboardVisible();
  const exerciseIds = session?.exercises.map((l) => l.exerciseId).join(',') ?? '';

  // Кадры обоих вариантов каждого упражнения — заранее, чтобы переключение было мгновенным.
  useEffect(() => {
    if (!exerciseIds) return;
    const urls = exerciseIds.split(',').flatMap((id) => getExercise(id).variants.flatMap((v) => demoUrls(v.gifId)));
    Image.prefetch(urls, 'memory-disk').catch(() => {});
  }, [exerciseIds]);

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

  const variantOf = (log: ExerciseLog) => getVariant(getExercise(log.exerciseId), log.variant);
  const modeOf = (log: ExerciseLog) => variantOf(log).mode;

  const switchVariant = (index: number, kind: Kind) => {
    const apply = () =>
      update((d) => {
        const s = d.activeSession;
        if (!s) return d;
        const ex = getExercise(s.exercises[index].exerciseId);
        const prev = s.exercises[index];
        const log = { ...buildExerciseLog(d, ex, kind, s.length), comment: prev.comment };
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
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.screen}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: session.restEndsAt ? 190 : 24 }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <WarmupBlock
              length={session.length}
              warmup={warmupOf(session)}
              paused={!!session.pausedAt}
              onStart={(id) => updateSession((s) => startStopwatch(s, id))}
              onPause={(id) => updateSession((s) => pauseStopwatch(s, id))}
              onFinish={(id) => updateSession((s) => finishStopwatch(s, id))}
              onReset={(id) => updateSession((s) => resetStopwatch(s, id))}
              onDistance={(mi) => updateSession((s) => setRunDistance(s, mi))}
            />
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
                onFeel={(feel) => updateLog(i, (l) => applyFeel(l, variantOf(l), feel))}
                onToday={(w) => updateLog(i, (l) => setTodayWeight(l, variantOf(l), w))}
                onNote={(comment) => updateLog(i, (l) => ({ ...l, comment }))}
                onRate={(rating) => updateLog(i, (l) => ({ ...l, rating }))}
                prevRating={lastRating(data.sessions, variantOf(log).name)}
                prevNote={lastNote(data.sessions, variantOf(log).name)}
                onRest={() => updateSession((s) => startRest(s, getExercise(log.exerciseId).restSec))}
              />
            ))}
          </ScrollView>
          {session.restEndsAt && (
            <RestTimer
              endsAt={session.restEndsAt}
              totalSec={session.restSec ?? 0}
                onShift={(delta) => updateSession((s) => shiftRest(s, delta))}
              onStop={stopRestTimer}
            />
          )}
        </View>
        {/* При открытой клавиатуре панель скрыта, чтобы не перекрывать поля ввода. */}
        {!keyboard && (
          <ControlBar
            session={session}
            current={currentExerciseIndex(session) + 1}
            total={session.exercises.length}
            bottom={insets.bottom}
            onPause={() => updateSession((s) => togglePause(s))}
            onFinish={() => setFinishing(true)}
          />
        )}
      </KeyboardAvoidingView>
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

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap },
});
