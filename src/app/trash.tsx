import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { Button, Card } from '../components/ui';
import { getTemplate } from '../data/program';
import { formatDate, formatShortDate } from '../logic/format';
import { restoreSession } from '../logic/session';
import { clearTrash, daysLeft, deleteForever, TRASH_DAYS, trashLatestFirst } from '../logic/trash';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import type { TrashItem } from '../types';

const daysWord = (n: number) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'день';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'дня';
  return 'дней';
};

// «Корзина» (SPEC_v3_3 §B1): удалённые тренировки, автоудаление через 30 дней.
export default function TrashScreen() {
  const { data, update } = useStore();
  const items = trashLatestFirst(data.trash);

  const removeForever = (item: TrashItem) =>
    Alert.alert('Удалить навсегда?', `${getTemplate(item.session.templateId).title}. Это нельзя отменить.`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => update((d) => deleteForever(d, item.session.id)) },
    ]);

  const clearAll = () =>
    Alert.alert('Очистить корзину?', `Тренировок: ${items.length}. Это нельзя отменить.`, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Очистить', style: 'destructive', onPress: () => update(clearTrash) },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="delete-outline" size={44} color={colors.muted} />
          <Text style={styles.emptyTitle}>Корзина пуста</Text>
          <Text style={styles.muted}>Удалённые тренировки хранятся здесь {TRASH_DAYS} дней.</Text>
        </View>
      ) : (
        <>
          {items.map((item) => {
            const s = item.session;
            const left = daysLeft(item);
            return (
              <Card key={s.id} style={styles.card}>
                <Text style={styles.title}>
                  {getTemplate(s.templateId).title} · {s.length === 'short' ? 'короткая' : 'длинная'}
                </Text>
                <Text style={styles.muted}>Тренировка: {formatDate(s.finishedAt ?? s.startedAt)}</Text>
                <View style={styles.meta}>
                  <Text style={styles.muted}>Удалена {formatShortDate(item.deletedAt)}</Text>
                  <Text style={styles.left}>
                    осталось {left} {daysWord(left)}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <Button title="Восстановить" small style={styles.flex} onPress={() => update((d) => restoreSession(d, s.id))} />
                  <Pressable
                    onPress={() => removeForever(item)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.danger, pressed && styles.pressed]}
                  >
                    <Text style={styles.dangerText}>Удалить навсегда</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })}
          <Button title="Очистить корзину" variant="danger" onPress={clearAll} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap, paddingBottom: 40 },
  flex: { flex: 1 },
  card: { gap: 6 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { fontSize: 14, fontWeight: '600', color: colors.text },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  danger: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.button,
  },
  dangerText: { fontSize: 14, fontWeight: '600', color: colors.danger },
  pressed: { opacity: 0.7 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 64 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
});
