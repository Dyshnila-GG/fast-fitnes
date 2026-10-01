import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Text, TextInput } from '../components/Text';
import { TimeField } from '../components/TimeField';
import { Button } from '../components/ui';
import type { MealSlot } from '../data/food';
import { SHORT_WEEKDAYS, WEEKDAYS } from '../logic/format';
import { addSlot, copyDay, dishOf, formatNum, moveSlot, removeSlot, scheduleTotals, slotsOf, updateSlot } from '../logic/food';
import { fromMinutes, toMinutes } from '../logic/time';
import { useStore } from '../store/AppStore';
import { colors, gap, radius } from '../theme';

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Пн … Вс

// «Настройки» еды (SPEC_v3_3 §C3): расписание по дням — время, название, блюда, порядок, копирование дня.
export default function FoodSettingsScreen() {
  const { data, update } = useStore();
  const [weekday, setWeekday] = useState(new Date().getDay());
  const [copying, setCopying] = useState(false);
  const slots = slotsOf(data.food, weekday);
  const totals = scheduleTotals(data.food, weekday);

  const add = () => {
    const last = slots[slots.length - 1];
    const time = last ? fromMinutes(Math.min(toMinutes(last.time) + 180, 23 * 60 + 30)) : '08:00';
    update((d) => addSlot(d, weekday, { title: 'Приём', time, dishes: [] }));
  };

  return (
    <View style={styles.flex}>
      <View style={styles.tabs}>
        {ORDER.map((w) => {
          const active = w === weekday;
          return (
            <Pressable
              key={w}
              onPress={() => setWeekday(w)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={WEEKDAYS[w]}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{SHORT_WEEKDAYS[w]}</Text>
            </Pressable>
          );
        })}
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.summary}>
          <Text style={styles.day}>{WEEKDAYS[weekday]}</Text>
          <View style={styles.totals}>
            <Text style={styles.total}>{formatNum(totals.kcal)}</Text>
            <Text style={styles.totalUnit}>ккал</Text>
            <Text style={styles.total}>{totals.protein}</Text>
            <Text style={styles.totalUnit}>г белка</Text>
          </View>
        </View>

        {slots.length === 0 && <Text style={styles.muted}>В этот день приёмов нет.</Text>}
        {slots.map((slot, i) => (
          <SlotCard key={slot.id} weekday={weekday} slot={slot} first={i === 0} last={i === slots.length - 1} />
        ))}

        <Button title="Добавить приём" variant="secondary" onPress={add} />
        <Button title="Скопировать день на…" variant="secondary" onPress={() => setCopying(true)} />
      </ScrollView>
      <CopyDayModal
        visible={copying}
        from={weekday}
        onClose={() => setCopying(false)}
        onCopy={(to) => {
          update((d) => copyDay(d, weekday, to));
          setCopying(false);
        }}
      />
    </View>
  );
}

function SlotCard({ weekday, slot, first, last }: { weekday: number; slot: MealSlot; first: boolean; last: boolean }) {
  const { data, update } = useStore();
  const [title, setTitle] = useState(slot.title);
  const commitTitle = () => title.trim() !== slot.title && update((d) => updateSlot(d, weekday, slot.id, { title: title.trim() }));
  const names = slot.dishes.map((id) => dishOf(data.food, id)?.name).filter(Boolean);

  const remove = () =>
    Alert.alert(`Удалить приём «${slot.title || 'Приём'}»?`, WEEKDAYS[weekday], [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => update((d) => removeSlot(d, weekday, slot.id)) },
    ]);

  return (
    <View style={styles.slot}>
      <View style={styles.slotHead}>
        <TimeField value={slot.time} onChange={(time) => update((d) => updateSlot(d, weekday, slot.id, { time }))} />
        <TextInput
          value={title}
          onChangeText={setTitle}
          onEndEditing={commitTitle}
          placeholder="Название приёма"
          placeholderTextColor={colors.muted}
          style={styles.title}
          returnKeyType="done"
        />
      </View>
      <Pressable
        onPress={() => router.push({ pathname: '/slot-dishes', params: { weekday: String(weekday), slot: slot.id } })}
        style={({ pressed }) => [styles.dishes, pressed && styles.pressed]}
      >
        <Icon name="silverware-fork-knife" size={18} color={colors.muted} />
        <Text style={[styles.dishText, names.length === 0 && styles.mutedText]} numberOfLines={2}>
          {names.length > 0 ? names.join(' + ') : 'Выбрать блюдо'}
        </Text>
        <Icon name="chevron-right" size={20} color={colors.muted} />
      </Pressable>
      <View style={styles.tools}>
        <Tool icon="arrow-up" label="Выше" disabled={first} onPress={() => update((d) => moveSlot(d, weekday, slot.id, -1))} />
        <Tool icon="arrow-down" label="Ниже" disabled={last} onPress={() => update((d) => moveSlot(d, weekday, slot.id, 1))} />
        <View style={styles.flex} />
        <Tool icon="trash-can-outline" label="Удалить приём" danger onPress={remove} />
      </View>
    </View>
  );
}

function Tool({
  icon,
  label,
  onPress,
  disabled,
  danger,
}: {
  icon: 'arrow-up' | 'arrow-down' | 'trash-can-outline';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.tool, disabled && styles.disabled, pressed && styles.pressed]}
    >
      <Icon name={icon} size={20} color={danger ? colors.danger : colors.text} />
    </Pressable>
  );
}

function CopyDayModal({
  visible,
  from,
  onClose,
  onCopy,
}: {
  visible: boolean;
  from: number;
  onClose: () => void;
  onCopy: (to: number[]) => void;
}) {
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState<number[]>([]);
  const toggle = (w: number) => setPicked((p) => (p.includes(w) ? p.filter((x) => x !== w) : [...p, w]));
  const close = () => {
    setPicked([]);
    onClose();
  };
  const copy = () => {
    const days = ORDER.filter((w) => picked.includes(w)).map((w) => SHORT_WEEKDAYS[w]).join(', ');
    Alert.alert('Скопировать расписание?', `${WEEKDAYS[from]} → ${days}. Приёмы этих дней будут заменены.`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Скопировать',
        onPress: () => {
          onCopy(picked);
          setPicked([]);
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
          <Text style={styles.sheetTitle}>Скопировать {WEEKDAYS[from].toLowerCase()} на…</Text>
          {ORDER.filter((w) => w !== from).map((w) => {
            const on = picked.includes(w);
            return (
              <Pressable
                key={w}
                onPress={() => toggle(w)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={styles.dayRow}
              >
                <Text style={styles.dayRowText}>{WEEKDAYS[w]}</Text>
                <View style={[styles.box, on && styles.boxOn]}>{on && <Icon name="check" size={16} color={colors.onPrimary} />}</View>
              </Pressable>
            );
          })}
          <Button title="Скопировать" onPress={copy} disabled={picked.length === 0} />
          <Button title="Отмена" variant="secondary" onPress={close} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabs: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  tab: { flex: 1, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  tabTextActive: { color: colors.onPrimary },
  content: { padding: 16, paddingTop: 8, gap, paddingBottom: 48 },
  summary: {
    padding: 18,
    borderRadius: radius,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  day: { fontSize: 15, fontWeight: '600', color: colors.muted },
  totals: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  total: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  totalUnit: { fontSize: 15, fontWeight: '600', color: colors.muted, marginRight: 10 },
  muted: { fontSize: 14, color: colors.muted },
  mutedText: { color: colors.muted },
  slot: { padding: 14, borderRadius: radius, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 10 },
  slotHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  dishes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.bg,
  },
  dishText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tool: { width: 40, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.button },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.7 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dayRowText: { fontSize: 16, fontWeight: '600', color: colors.text },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: colors.highlight, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
