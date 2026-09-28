import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { RATING_LABEL } from '../../logic/format';
import { colors } from '../../theme';
import type { ExerciseLog, Rating } from '../../types';

const RATINGS = (Object.keys(RATING_LABEL) as Rating[]).map((value) => ({ value, label: RATING_LABEL[value] }));

type Props = { log: ExerciseLog; onChange: (patch: Partial<ExerciseLog>) => void };

export function RatingBlock({ log, onChange }: Props) {
  return (
    <View style={[styles.block, !log.rating && styles.pending]}>
      <Text style={styles.title}>ОЦЕНКА ПОСЛЕДНЕГО РАБОЧЕГО ПОДХОДА</Text>
      <View style={styles.row}>
        {RATINGS.map((r) => (
          <Chip key={r.value} half label={r.label} active={log.rating === r.value} onPress={() => onChange({ rating: r.value })} />
        ))}
      </View>
      <Text style={styles.title}>СЛОЖНОСТЬ 1–10</Text>
      <View style={styles.scale}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <Chip
            key={n}
            compact
            label={String(n)}
            active={log.difficulty === n}
            onPress={() => onChange({ difficulty: log.difficulty === n ? undefined : n })}
          />
        ))}
      </View>
      <TextInput
        value={log.comment ?? ''}
        onChangeText={(t) => onChange({ comment: t || undefined })}
        placeholder="Комментарий"
        placeholderTextColor={colors.muted}
        multiline
        style={styles.comment}
      />
    </View>
  );
}

type ChipProps = { label: string; active: boolean; compact?: boolean; half?: boolean; onPress: () => void };

function Chip({ label, active, compact, half, onPress }: ChipProps) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, compact && styles.compact, half && styles.half, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8, padding: 12, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  pending: { borderColor: colors.highlight },
  title: { fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 0.5 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexGrow: 1, minWidth: 26, paddingVertical: 9, paddingHorizontal: 6, borderRadius: 10, backgroundColor: colors.button, alignItems: 'center' },
  scale: { flexDirection: 'row', gap: 4 },
  half: { flexBasis: '45%' },
  compact: { flex: 1, minWidth: 0, paddingHorizontal: 0 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  chipTextActive: { color: colors.onPrimary, fontWeight: '700' },
  comment: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
});
