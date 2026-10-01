import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/ui';
import { formatDay, WEEKDAYS } from '../logic/format';
import { dayDate } from '../logic/metrics';
import { formatRunTime } from '../logic/run';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';

// История пробежек. Отмечаются только на «Главной» (Ср и Пт).
export default function RunsScreen() {
  const { data } = useStore();
  const days = Object.keys(data.runs).sort().reverse();
  const total = days.reduce((n, d) => n + (data.runs[d].distanceMi ?? 0), 0);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.muted}>
        Пробежки записываются из «Тренировки → Пробежка» или отмечаются на «Главной» в среду и пятницу.
        {days.length > 0 ? ` Всего: ${days.length}, ${Math.round(total * 100) / 100} mi.` : ''}
      </Text>
      <Card>
        {days.length === 0 && <Text style={styles.muted}>Пробежек пока нет.</Text>}
        {days.map((day, i) => {
          const r = data.runs[day];
          return (
            <View key={day} style={[styles.row, i > 0 && styles.border]}>
              <View style={styles.flex}>
                <Text style={styles.title}>{formatDay(day)}</Text>
                <Text style={styles.muted}>{WEEKDAYS[dayDate(day).getDay()]}</Text>
              </View>
              <Text style={styles.value}>
                {formatRunTime(r.minutes)}{r.distanceMi != null ? ` · ${r.distanceMi} mi` : ''}
              </Text>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  value: { fontSize: 16, fontWeight: '700', color: colors.text },
});
