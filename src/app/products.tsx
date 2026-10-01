import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { formatShortDay } from '../logic/format';
import { weekProducts, type ProductRow } from '../logic/food';
import { dayKey, shiftDay } from '../logic/metrics';
import { weekStart } from '../logic/home';
import { useStore } from '../store/AppStore';
import { colors, radius } from '../theme';

// «Продукты на неделю» (SPEC_v3_2 §5.2): сумма ингредиентов меню пн–вс с заменами, без галочек.
export default function ProductsScreen() {
  const { data } = useStore();
  const thisWeek = weekStart(dayKey());
  const [monday, setMonday] = useState(thisWeek);
  const { food } = data;
  const sections = useMemo(
    () => weekProducts(food, monday).map((g) => ({ key: g.section, title: g.title, data: g.rows })),
    [food, monday],
  );
  const near = monday === thisWeek ? 'Эта неделя' : monday === shiftDay(thisWeek, 7) ? 'Следующая неделя' : monday === shiftDay(thisWeek, -7) ? 'Прошлая неделя' : 'Неделя';

  return (
    <SectionList
      sections={sections}
      keyExtractor={(row) => row.product}
      contentContainerStyle={styles.content}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={styles.week}>
          <Arrow label="‹" onPress={() => setMonday((m) => shiftDay(m, -7))} accessibilityLabel="Предыдущая неделя" />
          <View style={styles.weekText}>
            <Text style={styles.weekTitle}>{near}</Text>
            <Text style={styles.weekRange}>
              {formatShortDay(monday)} – {formatShortDay(shiftDay(monday, 6))}
            </Text>
          </View>
          <Arrow label="›" onPress={() => setMonday((m) => shiftDay(m, 7))} accessibilityLabel="Следующая неделя" />
        </View>
      }
      renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
      renderItem={({ item, index, section }) => (
        <Row item={item} first={index === 0} last={index === section.data.length - 1} />
      )}
    />
  );
}

function Row({ item, first, last }: { item: ProductRow; first: boolean; last: boolean }) {
  return (
    <View style={[styles.row, first && styles.rowFirst, last && styles.rowLast, !first && styles.rowBorder]}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.amount}>{item.amount}</Text>
    </View>
  );
}

function Arrow({ label, onPress, accessibilityLabel }: { label: string; onPress: () => void; accessibilityLabel: string }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
    >
      <Text style={styles.arrowText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, backgroundColor: colors.bg },
  week: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  weekText: { flex: 1, alignItems: 'center' },
  weekTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  weekRange: { fontSize: 14, color: colors.muted, marginTop: 2 },
  arrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 24, lineHeight: 28, color: colors.text },
  pressed: { opacity: 0.6 },
  section: { fontSize: 13, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 24, marginBottom: 8, marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 12, paddingVertical: 13, paddingHorizontal: 16, backgroundColor: colors.card },
  rowFirst: { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  rowLast: { borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  name: { flex: 1, fontSize: 16, color: colors.text },
  amount: { fontSize: 16, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
});
