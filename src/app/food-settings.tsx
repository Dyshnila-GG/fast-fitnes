import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Text, TextInput } from '../components/Text';
import { TimeField } from '../components/TimeField';
import { Button } from '../components/ui';
import type { MealSlot } from '../data/food';
import { shortWeekdayOf, weekdayOf } from '../logic/format';
import { addSlot, copyDay, dishTitle, formatNum, moveSlot, removeSlot, scheduleTotals, slotsOf, updateSlot } from '../logic/food';
import { fromMinutes, toMinutes } from '../logic/time';
import { useStore } from '../store/AppStore';
import { colors, gap, radius } from '../theme';
import { useT } from '../i18n/useT';

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Пн … Вс

// «Настройки» еды (SPEC_v3_3 §C3): расписание по дням — время, название, блюда, порядок, копирование дня.
export default function FoodSettingsScreen() {
  const t = useT();
  const { data, update } = useStore();
  const [weekday, setWeekday] = useState(new Date().getDay());
  const [copying, setCopying] = useState(false);
  const slots = slotsOf(data.food, weekday);
  const totals = scheduleTotals(data.food, weekday);

  const add = () => {
    const last = slots[slots.length - 1];
    const time = last ? fromMinutes(Math.min(toMinutes(last.time) + 180, 23 * 60 + 30)) : '08:00';
    update((d) => addSlot(d, weekday, { title: t('meal.default'), time, dishes: [] }));
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
              accessibilityLabel={weekdayOf(w)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{shortWeekdayOf(w)}</Text>
            </Pressable>
          );
        })}
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.summary}>
          <Text style={styles.day}>{weekdayOf(weekday)}</Text>
          <View style={styles.totals}>
            <Text style={styles.total}>{formatNum(totals.kcal)}</Text>
            <Text style={styles.totalUnit}>{t('unit.kcal')}</Text>
            <Text style={styles.total}>{totals.protein}</Text>
            <Text style={styles.totalUnit}>{t('settings.proteinUnit')}</Text>
          </View>
        </View>

        {slots.length === 0 && <Text style={styles.muted}>{t('settings.noMeals')}</Text>}
        {slots.map((slot, i) => (
          <SlotCard key={slot.id} weekday={weekday} slot={slot} first={i === 0} last={i === slots.length - 1} />
        ))}

        <Button title={t('settings.addMeal')} variant="secondary" onPress={add} />
        <Button title={t('settings.copyDay')} variant="secondary" onPress={() => setCopying(true)} />
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
  const t = useT();
  const { data, update } = useStore();
  const [title, setTitle] = useState(slot.title);
  const commitTitle = () => title.trim() !== slot.title && update((d) => updateSlot(d, weekday, slot.id, { title: title.trim() }));
  const names = slot.dishes.map((id) => dishTitle(data.food, id)).filter(Boolean);

  const remove = () =>
    Alert.alert(t('settings.deleteMeal', { name: slot.title || t('meal.default') }), weekdayOf(weekday), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => update((d) => removeSlot(d, weekday, slot.id)) },
    ]);

  return (
    <View style={styles.slot}>
      <View style={styles.slotHead}>
        <TimeField value={slot.time} onChange={(time) => update((d) => updateSlot(d, weekday, slot.id, { time }))} />
        <TextInput
          value={title}
          onChangeText={setTitle}
          onEndEditing={commitTitle}
          placeholder={t('settings.mealName')}
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
          {names.length > 0 ? names.join(' + ') : t('settings.pickDish')}
        </Text>
        <Icon name="chevron-right" size={20} color={colors.muted} />
      </Pressable>
      <View style={styles.tools}>
        <Tool icon="arrow-up" label={t('settings.up')} disabled={first} onPress={() => update((d) => moveSlot(d, weekday, slot.id, -1))} />
        <Tool icon="arrow-down" label={t('settings.down')} disabled={last} onPress={() => update((d) => moveSlot(d, weekday, slot.id, 1))} />
        <View style={styles.flex} />
        <Tool icon="trash-can-outline" label={t('settings.deleteMealShort')} danger onPress={remove} />
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
  const t = useT();
  const [picked, setPicked] = useState<number[]>([]);
  const toggle = (w: number) => setPicked((p) => (p.includes(w) ? p.filter((x) => x !== w) : [...p, w]));
  const close = () => {
    setPicked([]);
    onClose();
  };
  const copy = () => {
    const days = ORDER.filter((w) => picked.includes(w)).map((w) => shortWeekdayOf(w)).join(', ');
    Alert.alert(t('settings.copyTitle'), t('settings.copyText', { from: weekdayOf(from), days }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.copy'),
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
          <Text style={styles.sheetTitle}>{t('settings.copyFrom', { day: weekdayOf(from) })}</Text>
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
                <Text style={styles.dayRowText}>{weekdayOf(w)}</Text>
                <View style={[styles.box, on && styles.boxOn]}>{on && <Icon name="check" size={16} color={colors.onPrimary} />}</View>
              </Pressable>
            );
          })}
          <Button title={t('settings.copy')} onPress={copy} disabled={picked.length === 0} />
          <Button title={t('common.cancel')} variant="secondary" onPress={close} />
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
    minWidth: 0,
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
