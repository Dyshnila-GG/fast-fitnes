import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import type { CalendarDay, MonthGrid } from '../../logic/home';
import { colors } from '../../theme';
import { weekdayShort } from '../../i18n';
import { useT } from '../../i18n/useT';

const DOT = 10;
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Пн … Вс

type Props = { grid: MonthGrid; canNext: boolean; onPrev: () => void; onNext: () => void };

// Календарь месяца (SPEC_v3_2 §2): столбцы пн–вс, строки — недели; каждый день — точка.
export const MonthCalendar = memo(function MonthCalendar({ grid, canNext, onPrev, onNext }: Props) {
  const t = useT();
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{grid.title}</Text>
        <Arrow label="‹" onPress={onPrev} accessibilityLabel={t('calendar.prev')} />
        <Arrow label="›" onPress={onNext} disabled={!canNext} accessibilityLabel={t('calendar.next')} />
      </View>
      <View style={styles.row}>
        {ORDER.map(weekdayShort).map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>
      {grid.weeks.map((week, i) => (
        <View key={i} style={styles.row}>
          {week.map((d, j) => (
            <View key={d?.day ?? `e${j}`} style={styles.cell}>
              {d && <View style={[styles.dot, dotStyle(d)]} />}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
});

// Без активности — тёмно-серая, сегодня — светло-серая, с тренировкой или пробежкой — белая, будущие — тусклые.
function dotStyle(d: CalendarDay) {
  if (d.active) return styles.active;
  if (d.today) return styles.today;
  if (d.future) return styles.future;
  return null;
}

function Arrow({ label, onPress, disabled, accessibilityLabel }: { label: string; onPress: () => void; disabled?: boolean; accessibilityLabel: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.arrow, disabled && styles.disabled, pressed && styles.pressed]}
    >
      <Text style={styles.arrowText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { flex: 1, fontSize: 17, fontWeight: '600', color: colors.text },
  arrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 22, lineHeight: 26, color: colors.text },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.6 },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11, color: colors.muted },
  cell: { flex: 1, height: 22, alignItems: 'center', justifyContent: 'center' },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: colors.dim },
  active: { backgroundColor: colors.text },
  today: { backgroundColor: colors.muted },
  future: { opacity: 0.4 },
});
