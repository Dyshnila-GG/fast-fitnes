import { StyleSheet, Text, View } from 'react-native';
import type { ActivityGrid } from '../../logic/home';
import { colors } from '../../theme';

const DOT = 9;
const DOT_GAP = 5;

// Точечный календарь: столбцы — недели, строки — пн–вс. Серые — дни, белые — тренировки,
// светло-серые с обводкой — пробежки; будущие дни не показываются.
export function DotCalendar({ grid }: { grid: ActivityGrid }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.row, styles.months]}>
        {grid.months.map((m, i) => (
          <View key={i} style={styles.col}>
            <Text style={styles.month} numberOfLines={1}>
              {m ?? ''}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.row}>
        {grid.columns.map((col, i) => (
          <View key={i} style={[styles.col, styles.dots]}>
            {col.map((d) => (
              <View
                key={d.day}
                style={[styles.dot, d.future ? styles.future : d.workout ? styles.workout : d.run ? styles.run : null]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { width: DOT, overflow: 'visible' },
  dots: { gap: DOT_GAP },
  months: { height: 14 },
  month: { position: 'absolute', left: 0, width: 40, fontSize: 11, color: colors.muted },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: colors.border },
  workout: { backgroundColor: colors.text },
  run: { backgroundColor: colors.muted, borderWidth: 1.5, borderColor: colors.text },
  future: { opacity: 0 },
});
