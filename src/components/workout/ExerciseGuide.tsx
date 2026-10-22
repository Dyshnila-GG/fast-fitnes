import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { Icon } from '../Icon';
import { colors, radius } from '../../theme';
import { formatRest } from '../../logic/format';
import type { PlanExercise } from '../../planPack';
import { ExerciseGif } from './ExerciseGif';

const rirLabel = (r?: number) => (r == null ? undefined : r >= 4 ? '4+' : String(r));

function restRange(e: PlanExercise): string | undefined {
  if (e.restMinSec == null) return undefined;
  const max = e.restMaxSec ?? e.restMinSec;
  return max > e.restMinSec ? `${formatRest(e.restMinSec)}–${formatRest(max)}` : formatRest(e.restMinSec);
}


/** Exercise guidance (handoff §14): muscles, setup, execution, mistakes, what to feel. */
export function GuideBody({ e }: { e: PlanExercise }) {
  const rest = restRange(e);
  const rir = rirLabel(e.targetRir);
  const tempo = e.tempo ?? '2-0-1';
  const reps = e.repsMin != null
    ? (e.repsMax != null && e.repsMax !== e.repsMin ? `${e.repsMin}–${e.repsMax}` : String(e.repsMin))
    : undefined;
  const technique = e.cue ?? e.execution?.[0];

  return (
    <View style={styles.body}>
      <View style={styles.prescription}>
        {reps ? <Text style={styles.prescriptionStrong}>{reps} повторов</Text> : null}
        {rir ? <Text style={styles.prescriptionStrong}>RIR {rir}</Text> : null}
        <Text style={styles.prescriptionStrong}>TEMPO {tempo}</Text>
      </View>

      {e.primaryMuscles?.length ? (
        <View style={styles.section}>
          <Text style={styles.label}>ЧУВСТВУЙ</Text>
          <Text style={styles.text}>
            <Text style={styles.strong}>{e.primaryMuscles.join(' · ')}</Text>
            {e.secondaryMuscles?.length ? <Text style={styles.muted}>{`  · помогают: ${e.secondaryMuscles.join(', ')}`}</Text> : null}
          </Text>
        </View>
      ) : null}

      {technique ? (
        <View style={styles.section}>
          <Text style={styles.label}>ТЕХНИКА</Text>
          <Text style={styles.text}>{technique}</Text>
        </View>
      ) : null}

      {e.feel ? (
        <View style={styles.section}>
          <Text style={styles.label}>ОРИЕНТИР</Text>
          <Text style={styles.text}>{e.feel}</Text>
        </View>
      ) : null}

      {rest ? <Text style={styles.muted}>Отдых {rest}</Text> : null}
    </View>
  );
}

/** Collapsed «Как выполнять» block inside the exercise card. */
export function ExerciseGuide({ e }: { e: PlanExercise }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.box}>
      <Pressable onPress={() => setOpen(!open)} style={styles.toggle} hitSlop={6}>
        <Text style={styles.toggleText}>Как выполнять</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
      </Pressable>
      {open ? <GuideBody e={e} /> : null}
    </View>
  );
}

/** Full-screen demo: big animation + guidance. */
export function PlanDemoModal({ e, visible, onClose }: { e: PlanExercise; visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.title}>{e.variantName ?? e.title ?? e.exerciseId}</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
              <Icon name="close" size={20} />
            </Pressable>
          </View>
          <ExerciseGif key={e.gifId} gifId={e.gifId ?? ''} playing={visible} square />
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {e.equipment ? <Text style={styles.muted}>{e.equipment}</Text> : null}
            <GuideBody e={e} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12 },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  toggleText: { fontSize: 15, fontWeight: '700', color: colors.text },
  body: { gap: 10, paddingBottom: 12 },
  prescription: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prescriptionStrong: { fontSize: 15, fontWeight: '800', color: colors.text },
  section: { gap: 4 },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 0.5 },
  text: { fontSize: 15, color: colors.text, lineHeight: 21 },
  item: { fontSize: 15, color: colors.text, lineHeight: 21 },
  strong: { fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 12 },
  sheet: { backgroundColor: colors.card, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12, maxHeight: '92%' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.text },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 0 },
  scrollContent: { gap: 8 },
});
