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
import { tp } from '../i18n';
import { templateTitle } from '../i18n/content';
import { useT } from '../i18n/useT';

// «Корзина» (SPEC_v3_3 §B1): удалённые тренировки, автоудаление через 30 дней.
export default function TrashScreen() {
  const t = useT();
  const { data, update } = useStore();
  const items = trashLatestFirst(data.trash);

  const removeForever = (item: TrashItem) =>
    Alert.alert(t('trash.deleteTitle'), `${templateTitle(getTemplate(item.session.templateId))}. ${t('common.irreversible')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => update((d) => deleteForever(d, item.session.id)) },
    ]);

  const clearAll = () =>
    Alert.alert(t('trash.clearTitle'), `${t('trash.count', { n: items.length })} ${t('common.irreversible')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('trash.clear'), style: 'destructive', onPress: () => update(clearTrash) },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="delete-outline" size={44} color={colors.muted} />
          <Text style={styles.emptyTitle}>{t('trash.empty')}</Text>
          <Text style={styles.muted}>{t('trash.emptyHint', { days: TRASH_DAYS })}</Text>
        </View>
      ) : (
        <>
          {items.map((item) => {
            const s = item.session;
            const left = daysLeft(item);
            return (
              <Card key={s.id} style={styles.card}>
                <Text style={styles.title}>
                  {templateTitle(getTemplate(s.templateId))} · {t(s.length === 'short' ? 'length.shortLower' : 'length.longLower')}
                </Text>
                <Text style={styles.muted}>{t('trash.workoutDate', { date: formatDate(s.finishedAt ?? s.startedAt) })}</Text>
                <View style={styles.meta}>
                  <Text style={styles.muted}>{t('trash.deletedAt', { date: formatShortDate(item.deletedAt) })}</Text>
                  <Text style={styles.left}>
                    {t('trash.left', { days: tp('days', left) })}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <Button title={t('common.restore')} small style={styles.flex} onPress={() => update((d) => restoreSession(d, s.id))} />
                  <Pressable
                    onPress={() => removeForever(item)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.danger, pressed && styles.pressed]}
                  >
                    <Text style={styles.dangerText}>{t('trash.deleteForever')}</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })}
          <Button title={t('trash.clearShort')} variant="danger" onPress={clearAll} />
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
