import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { ratingLabel } from '../../logic/format';
import { colors } from '../../theme';
import type { Rating } from '../../types';
import { useT } from '../../i18n/useT';

const RATINGS: Rating[] = ['easy', 'normal', 'hard', 'fail'];

type Props = { rating?: Rating; onChange: (rating: Rating) => void };

// Оценка после рабочих подходов — только вручную (SPEC §3.5).
export function RatingBlock({ rating, onChange }: Props) {
  const t = useT();
  return (
    <View style={[styles.block, !rating && styles.pending]}>
      <Text style={styles.title}>{t('rating.title')}</Text>
      <View style={styles.row}>
        {RATINGS.map((r) => {
          const active = rating === r;
          return (
            <Pressable key={r} onPress={() => onChange(r)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{ratingLabel(r)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8, padding: 12, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  pending: { borderColor: colors.highlight },
  title: { fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 0.5 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexGrow: 1, flexBasis: '45%', paddingVertical: 11, borderRadius: 10, backgroundColor: colors.button, alignItems: 'center' },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  chipTextActive: { color: colors.onPrimary, fontWeight: '700' },
});
