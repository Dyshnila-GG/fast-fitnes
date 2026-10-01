import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { getVariant } from '../../data/program';
import { formatPreview } from '../../logic/format';
import { getBest } from '../../logic/records';
import { chosenKind, sessionExercises, workSetCount } from '../../logic/session';
import { colors } from '../../theme';
import type { AppData, Length, TemplateId } from '../../types';
import { t } from '../../i18n';
import { variantName } from '../../i18n/content';
import { useT } from '../../i18n/useT';

// Варианты длины — функция: подписи на текущем языке.
export const lengths = (): { value: Length; label: string }[] => [
  { value: 'long', label: t('length.long') },
  { value: 'short', label: t('length.short') },
];

// Предпросмотр: упражнения выбранной версии — вариант, подходы × диапазон × рекорд.
export function WorkoutPreview({ data, id, length }: { data: AppData; id: TemplateId; length: Length }) {
  useT();
  return (
    <View>
      {sessionExercises(id, length).map((e, i) => {
        const variant = getVariant(e, chosenKind(data, e));
        return (
          <View key={e.id} style={styles.row}>
            <Text style={styles.name}>
              {i + 1}. {variantName(variant)}
            </Text>
            <Text style={styles.plan}>{formatPreview(variant, getBest(data, variant), workSetCount(variant, length))}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border, gap: 2 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  plan: { fontSize: 14, color: colors.muted, fontVariant: ['tabular-nums'] },
});
