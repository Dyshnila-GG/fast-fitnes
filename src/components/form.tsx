import { Alert, Pressable, StyleSheet, View, type TextInputProps } from 'react-native';
import { Text, TextInput } from './Text';
import { formatDay } from '../logic/format';
import { dayKey, shiftDay } from '../logic/metrics';
import { colors } from '../theme';
import { Icon } from './Icon';
import { useT } from '../i18n/useT';

// Числовое поле с подписью.
export function NumInput({ label, style, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType="decimal-pad"
        returnKeyType="done"
        placeholderTextColor={colors.muted}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

// Выбор дня кнопками ‹ ›, без клавиатуры. Будущие дни недоступны.
export function DayPicker({ value, onChange }: { value: string; onChange: (day: string) => void }) {
  const t = useT();
  const isToday = value >= dayKey();
  return (
    <View style={styles.day}>
      <Pressable onPress={() => onChange(shiftDay(value, -1))} hitSlop={8} style={styles.arrow}>
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>
      <Text style={styles.dayText}>{isToday ? t('run.todayDate', { date: formatDay(value) }) : formatDay(value)}</Text>
      <Pressable
        onPress={() => !isToday && onChange(shiftDay(value, 1))}
        hitSlop={8}
        style={[styles.arrow, isToday && styles.disabled]}
      >
        <Text style={styles.arrowText}>›</Text>
      </Pressable>
    </View>
  );
}

// Карточка-переход на вкладке «Профиль».
// warning — предупреждение красным под подписью (например, папка бэкапа недоступна).
export function NavCard({ title, subtitle, warning, onPress }: { title: string; subtitle: string; warning?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.nav, warning && styles.navWarning, pressed && styles.pressed]}>
      <View style={styles.flex}>
        <Text style={styles.navTitle}>{title}</Text>
        <Text style={styles.navSub}>{subtitle}</Text>
        {warning ? (
          <View style={styles.warning}>
            <Icon name="alert-circle-outline" size={16} color={colors.danger} />
            <Text style={styles.warningText}>{warning}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

// Строка списка с удалением (✕ с подтверждением).
export function EntryRow({ title, detail, onDelete }: { title: string; detail: string; onDelete: () => void }) {
  const t = useT();
  const confirm = () =>
    Alert.alert(t('form.deleteEntry'), title, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: onDelete },
    ]);
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <Pressable onPress={confirm} hitSlop={10} style={styles.remove}>
        <Icon name="close" size={16} color={colors.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { flex: 1, gap: 4 },
  label: { fontSize: 13, color: colors.muted },
  input: {
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  day: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  arrow: { width: 44, height: 40, borderRadius: 12, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 24, color: colors.text, lineHeight: 28 },
  disabled: { opacity: 0.3 },
  dayText: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: colors.text },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  pressed: { opacity: 0.7 },
  navTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  navSub: { fontSize: 14, color: colors.muted, marginTop: 2 },
  navWarning: { borderColor: colors.danger },
  warning: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8 },
  warningText: { flex: 1, fontSize: 14, color: colors.danger },
  chevron: { fontSize: 26, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowDetail: { fontSize: 14, color: colors.muted, marginTop: 2 },
  remove: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center' },
});
