import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { confirmDeleteSession } from '../../components/history/confirmDelete';
import { Icon } from '../../components/Icon';
import { Card } from '../../components/ui';
import { getTemplate } from '../../data/program';
import { formatDate, formatDuration, formatTime } from '../../logic/format';
import { finishedSessions } from '../../logic/metrics';
import { tonnage } from '../../logic/tonnage';
import { deleteSession, elapsedMs } from '../../logic/session';
import { useStore } from '../../store/AppStore';
import { colors, gap } from '../../theme';

export default function HistoryScreen() {
  const { data, update } = useStore();
  const sessions = finishedSessions(data.sessions);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {sessions.length === 0 && (
        <Card>
          <Text style={styles.muted}>Завершённых тренировок пока нет.</Text>
        </Card>
      )}
      {sessions.map((s) => (
        <Card key={s.id} style={styles.row}>
          <Pressable
            onPress={() => router.push(`/history/${s.id}`)}
            style={({ pressed }) => [styles.flex, styles.main, pressed && styles.pressed]}
          >
            <View style={styles.flex}>
              <Text style={styles.title}>
                {getTemplate(s.templateId).title} · {s.length === 'short' ? 'короткая' : 'длинная'}
              </Text>
              <Text style={styles.muted}>
                {formatDate(s.finishedAt!)}, {formatTime(s.startedAt)} · {formatDuration(elapsedMs(s, new Date(s.finishedAt!).getTime()))} ·{' '}
                {Math.round(tonnage(s))} lb
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <Pressable
            onPress={() => confirmDeleteSession(s, () => update((d) => deleteSession(d, s.id)))}
            accessibilityRole="button"
            accessibilityLabel="Удалить"
            hitSlop={4}
            style={({ pressed }) => [styles.trash, pressed && styles.pressed]}
          >
            <Icon name="trash-can-outline" size={22} color={colors.muted} />
          </Pressable>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  main: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trash: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.button },
  pressed: { opacity: 0.7 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted, marginTop: 2 },
  chevron: { fontSize: 26, color: colors.muted },
});
