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
import { coachImportedSet } from '../logic/importedSession';
import { useStore } from '../store/AppStore';
import { gap } from '../theme';
import type { ExerciseLog, Kind, Mode, Session } from '../types';
import { sessionUnits } from '../logic/session';
import { useT } from '../i18n/useT';

export default function WorkoutScreen() {
  const t = useT();
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
    const urls = session?.planSnapshot
      ? session.planSnapshot.exercises.flatMap((e) => e.gifId ? demoUrls(e.gifId) : [])
      : exerciseIds.split(',').flatMap((id) => getExercise(id).variants.flatMap((v) => demoUrls(v.gifId)));
    if (urls.length) Image.prefetch(urls, 'memory-disk').catch(() => {});
  }, [exerciseIds, session?.planSnapshot]);

  // Системная кнопка «назад» на Android заблокирована.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (Platform.OS === 'android') ToastAndroid.show(t('workout.backBlocked'), ToastAndroid.SHORT);
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

  const importedPlanExercise = (log: ExerciseLog) => session.planSnapshot?.exercises.find((e) => e.exerciseId === log.exerciseId && e.variantId === log.variantId);
  const variantOf = (log: ExerciseLog) => getVariant(getExercise(log.exerciseId), log.variant);
  // Imported Plan Pack exercises must not depend on the built-in catalog (handoff §46).
  const modeOf = (log: ExerciseLog): Mode => {
    const imported = importedPlanExercise(log);
    if (imported) return imported.mode ?? (imported.seconds != null ? 'time' : 'weight');
    return variantOf(log).mode;
  };

  const switchVariant = (index: number, kind: Kind) => {
    const apply = () =>
      update((d) => {
        const s = d.activeSession;
        if (!s) return d;
        const ex = getExercise(s.exercises[index].exerciseId);
        const prev = s.exercises[index];
        // Единицы — как у этой тренировки (округления разминки и плана).
        const log = { ...buildExerciseLog({ ...d, settings: { ...d.settings, units: sessionUnits(s) } }, ex, kind, s.length), comment: prev.comment };
        return {
          ...d,
          variantChoice: { ...d.variantChoice, [ex.id]: kind },
          activeSession: { ...s, exercises: s.exercises.map((l, i) => (i === index ? log : l)) },
        };
      });
    if (!hasFacts(session.exercises[index])) return apply();
    Alert.alert(t('workout.switchTitle'), t('workout.switchText'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('workout.switch'), style: 'destructive', onPress: apply },
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
                onSet={(si, patch) => updateSession((s) => { const exercises=s.exercises.map((l,ei)=>ei===i?updateSet(l,modeOf(l),si,patch):l); const next={...s,exercises}; return next.planSnapshot && patch.rir != null ? coachImportedSet(next,i,si,importedPlanExercise(exercises[i])?.kind ?? exercises[i].variant).session : next; })}
                onCopy={(si) => updateLog(i, (l) => copyPlanToFact(l, modeOf(l), si))}
                onRemove={(si) => updateLog(i, (l) => removeSet(l, si))}
                onAdd={(type) => updateLog(i, (l) => addSet(l, type))}
                onFeel={(feel) => updateLog(i, (l) => applyFeel(l, variantOf(l), feel, sessionUnits(session)))}
                onToday={(w) => updateLog(i, (l) => setTodayWeight(l, variantOf(l), w, sessionUnits(session)))}
                onNote={(comment) => updateLog(i, (l) => ({ ...l, comment }))}
                onRate={(rating) => updateLog(i, (l) => ({ ...l, rating }))}
                prevRating={session.planSnapshot ? undefined : lastRating(data.sessions, variantOf(log).name)}
                prevNote={session.planSnapshot ? undefined : lastNote(data.sessions, variantOf(log).name)}
                v4={!!session.planSnapshot}
                units={sessionUnits(session)}
                restMinSec={importedPlanExercise(log)?.restMinSec}
                planExercise={importedPlanExercise(log)}
                onRest={() => {
                  const imported = importedPlanExercise(log);
                  const rest = imported?.restMinSec ?? (session.planSnapshot ? 120 : getExercise(log.exerciseId).restSec);
                  // Rest belongs to the NEXT work set: that set's performance must be
                  // evaluated against the rest that happened immediately before it.
                  const setIndex = log.sets.findIndex((x) => x.type === 'work' && !x.done);
                  updateSession((s) => startRest(s, rest, Date.now(), setIndex < 0 ? undefined : { exerciseIndex: i, setIndex }));
                }}
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
