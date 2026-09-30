import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from '../components/charts/LineChart';
import { Card } from '../components/ui';
import { formatDate } from '../logic/format';
import { progressItems, progressSeries } from '../logic/metrics';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import type { Mode } from '../types';

const UNIT: Record<Mode, string> = { weight: 'lb', bodyweight: 'повт', time: 'сек' };
const AXIS: Record<Mode, string> = { weight: 'Рабочий вес (макс. за тренировку), lb', bodyweight: 'Повторы (макс. за тренировку)', time: 'Время (макс. за тренировку), сек' };

export default function ProgressScreen() {
  const { data } = useStore();
  const items = progressItems(data.sessions);
  const [key, setKey] = useState<string | null>(null);
  const selected = items.find((i) => i.key === key) ?? items[0];

  if (!selected) {
    return (
      <View style={styles.content}>
        <Card>
          <Text style={styles.muted}>Появится после первой тренировки с заполненными подходами.</Text>
        </Card>
      </View>
    );
  }

  const points = progressSeries(data.sessions, selected.key);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.name}>{selected.key}</Text>
        <Text style={styles.muted}>{AXIS[selected.mode]}</Text>
        <LineChart key={selected.key} points={points} unit={UNIT[selected.mode]} formatDate={formatDate} />
      </Card>
      <Card style={styles.list}>
        <Text style={styles.section}>ПО ДАТАМ</Text>
        {[...points].reverse().map((p, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.cell}>{formatDate(p.date)}</Text>
            <Text style={[styles.cell, styles.value]}>
              {p.y} {UNIT[selected.mode]}
            </Text>
          </View>
        ))}
      </Card>
      <Card style={styles.list}>
        <Text style={styles.section}>УПРАЖНЕНИЕ</Text>
        {items.map((i) => (
          <Pressable key={i.key} onPress={() => setKey(i.key)} style={styles.row}>
            <Text style={[styles.cell, i.key === selected.key && styles.active]}>
              {i.key}
            </Text>
            <Text style={styles.muted}>{i.count}</Text>
          </Pressable>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap },
  card: { gap: 8 },
  list: { gap: 0 },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.5, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  cell: { fontSize: 16, color: colors.text, flexShrink: 1 },
  value: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  active: { fontWeight: '800' },
});
