import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { Card } from '../components/ui';
import { formatDay, formatDistance, weekdayOf } from '../logic/format';
import { dayDate } from '../logic/metrics';
import { runReport } from '../logic/report';
import { formatRunTime } from '../logic/run';
import { shareReport } from '../services/share';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import { useT } from '../i18n/useT';

// История пробежек. Отмечаются только на «Главной» (Ср и Пт).
export default function RunsScreen() {
  const t = useT();
  const { data } = useStore();
  const days = Object.keys(data.runs).sort().reverse();
  const total = days.reduce((n, d) => n + (data.runs[d].distanceMi ?? 0), 0);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.muted}>
        {t('runs.hint')}
        {days.length > 0 ? ` ${t('runs.total', { n: days.length, distance: formatDistance(total) })}` : ''}
      </Text>
      <Card>
        {days.length === 0 && <Text style={styles.muted}>{t('runs.empty')}</Text>}
        {days.map((day, i) => {
          const r = data.runs[day];
          return (
            <View key={day} style={[styles.row, i > 0 && styles.border]}>
              <View style={styles.flex}>
                <Text style={styles.title}>{formatDay(day)}</Text>
                <Text style={styles.muted}>{weekdayOf(dayDate(day).getDay())}</Text>
              </View>
              <Text style={styles.value}>
                {formatRunTime(r.minutes)}{r.distanceMi != null ? ` · ${formatDistance(r.distanceMi)}` : ''}
              </Text>
              <Pressable
                onPress={() => shareReport(runReport(day, r))}
                accessibilityRole="button"
                accessibilityLabel={t('report.download')}
                hitSlop={6}
                style={({ pressed }) => [styles.download, pressed && styles.pressed]}
              >
                <Icon name="file-download-outline" size={20} />
              </Pressable>
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
  download: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.button },
  pressed: { opacity: 0.7 },
});
