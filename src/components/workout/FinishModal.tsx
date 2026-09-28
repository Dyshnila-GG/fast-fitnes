import { Alert, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme';
import { Button } from '../ui';

type Props = {
  visible: boolean;
  skipped: string[];
  onBack: () => void;
  onFinish: () => void;
  onDiscard: () => void;
};

// Окно «Завершить»: сводка пропусков, завершение или отмена без сохранения.
export function FinishModal({ visible, skipped, onBack, onFinish, onDiscard }: Props) {
  const discard = () =>
    Alert.alert('Отменить без сохранения?', 'Все данные этой тренировки будут удалены.', [
      { text: 'Нет', style: 'cancel' },
      { text: 'Отменить тренировку', style: 'destructive', onPress: onDiscard },
    ]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onBack}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Завершить тренировку?</Text>
          {skipped.length > 0 ? (
            <>
              <Text style={styles.warning}>Пропущено — {skipped.length}:</Text>
              <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                {skipped.map((s, i) => (
                  <Text key={i} style={styles.item}>
                    • {s}
                  </Text>
                ))}
              </ScrollView>
            </>
          ) : (
            <Text style={styles.ok}>Всё заполнено.</Text>
          )}
          <Button title="Вернуться" variant="secondary" onPress={onBack} />
          <Button title={skipped.length > 0 ? 'Всё равно завершить' : 'Завершить'} onPress={onFinish} />
          <Button title="Отменить без сохранения" variant="danger" onPress={discard} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 },
  sheet: { backgroundColor: colors.card, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 20, gap: 10, maxHeight: '85%' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  warning: { fontSize: 15, fontWeight: '600', color: colors.text },
  ok: { fontSize: 15, color: colors.muted },
  list: { flexGrow: 0 },
  listContent: { gap: 6, paddingBottom: 4 },
  item: { fontSize: 14, color: colors.text, lineHeight: 20 },
});
