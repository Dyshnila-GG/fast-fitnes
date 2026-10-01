import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { formatRest } from '../../logic/format';
import { colors, radius } from '../../theme';
import type { Exercise, Variant } from '../../types';
import { ExerciseGif } from './ExerciseGif';
import { Icon } from '../Icon';
import { variantCue, variantEquipment, variantName } from '../../i18n/content';
import { useT } from '../../i18n/useT';

type Props = { exercise: Exercise; variant: Variant; visible: boolean; onClose: () => void };

// Большая анимация, название и техника (SPEC §3.3).
export function GifModal({ exercise, variant, visible, onClose }: Props) {
  const t = useT();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.title}>{variantName(variant)}</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
              <Icon name="close" size={20} />
            </Pressable>
          </View>
          <ExerciseGif key={variant.gifId} gifId={variant.gifId} playing={visible} />
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Text style={styles.meta}>{variantEquipment(variant)}</Text>
            <Text style={styles.cue}>{variantCue(exercise, variant)}</Text>
            <Text style={styles.meta}>
              {t('exercise.tempoRest', { tempo: exercise.tempo, rest: formatRest(exercise.restSec) })}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 12 },
  sheet: { backgroundColor: colors.card, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12, maxHeight: '90%' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.text },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center' },
  body: { flexGrow: 0 },
  bodyContent: { gap: 8 },
  meta: { fontSize: 14, color: colors.muted },
  cue: { fontSize: 16, color: colors.text, lineHeight: 23 },
});
