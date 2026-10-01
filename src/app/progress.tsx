import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { LineChart } from '../components/charts/LineChart';
import { Card } from '../components/ui';
import { formatDate } from '../logic/format';
import { progressItems, progressSeries } from '../logic/metrics';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import type { Mode } from '../types';
import { formatNumber, getLang, t as tr } from '../i18n';
import { variantNameByKey } from '../i18n/content';
import { weightUnit, weightValue } from '../logic/units';
import { useT } from '../i18n/useT';

const unitOf = (mode: Mode) => (mode === 'weight' ? weightUnit() : mode === 'time' ? tr('unit.sec') : tr('unit.reps'));
const axisOf = (mode: Mode) => tr(`progress.axis.${mode}`, { u: weightUnit() });

export default function ProgressScreen() {
  const t = useT();
  const { data } = useStore();
  // По переведённому названию, на текущем языке.
  const items = progressItems(data.sessions).sort((a, b) => variantNameByKey(a.key).localeCompare(variantNameByKey(b.key), getLang()));
  const [key, setKey] = useState<string | null>(null);
  const selected = items.find((i) => i.key === key) ?? items[0];

  if (!selected) {
    return (
      <View style={styles.content}>
        <Card>
          <Text style={styles.muted}>{t('progress.empty')}</Text>
        </Card>
      </View>
    );
  }

  // Вес — в выбранных единицах.
  const points = progressSeries(data.sessions, selected.key).map((p) => (selected.mode === 'weight' ? { ...p, y: weightValue(p.y) } : p));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.name}>{variantNameByKey(selected.key)}</Text>
        <Text style={styles.muted}>{axisOf(selected.mode)}</Text>
        <LineChart key={selected.key} points={points} unit={unitOf(selected.mode)} formatDate={formatDate} />
      </Card>
      <Card style={styles.list}>
        <Text style={styles.section}>{t('progress.byDate')}</Text>
        {[...points].reverse().map((p, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.cell}>{formatDate(p.date)}</Text>
            <Text style={[styles.cell, styles.value]}>
              {formatNumber(p.y)} {unitOf(selected.mode)}
            </Text>
          </View>
        ))}
      </Card>
      <Card style={styles.list}>
        <Text style={styles.section}>{t('progress.exercise')}</Text>
        {items.map((i) => (
          <Pressable key={i.key} onPress={() => setKey(i.key)} style={styles.row}>
            <Text style={[styles.cell, i.key === selected.key && styles.active]}>
              {variantNameByKey(i.key)}
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
