import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { ProductPicker } from '../components/food/ProductPicker';
import { Button, Card } from '../components/ui';
import { Icon } from '../components/Icon';
import { formatDay } from '../logic/format';
import { formatNum, isEaten, mealsFor, toggleEaten } from '../logic/food';
import { dayKey } from '../logic/metrics';
import {
  addFact,
  eatenTotals,
  factsOn,
  itemFromProduct,
  itemsFromDish,
  makeFact,
  manualItem,
  per100Of,
  portionItem,
  removeFact,
  sumItems,
} from '../logic/v4';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import type { FoodFactItem } from '../types';

const SALAD = 'salad';

// «Что съел на самом деле» (handoff §16–18): граммы — главный источник истины.
// Строки из рецепта — только стартовое заполнение, их можно поправить.
export default function FoodLogScreen() {
  const { data, update } = useStore();
  const params = useLocalSearchParams<{ day?: string; slot?: string }>();
  const day = params.day ?? dayKey();
  const meal = useMemo(() => mealsFor(data.food, day).find((m) => m.slot === params.slot), [data.food, day, params.slot]);

  const initial = useMemo<FoodFactItem[]>(() => {
    if (!meal) return [];
    const dishes = meal.dishes.flatMap((id) => (data.food.dishes[id]?.salad ? [id, SALAD] : [id]));
    return dishes.flatMap((id) => itemsFromDish(data.food, id));
    // Заполняем один раз при открытии.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [title, setTitle] = useState(meal?.title ?? 'Приём пищи');
  const [items, setItems] = useState<FoodFactItem[]>(initial);
  const [picker, setPicker] = useState(false);
  const [manual, setManual] = useState({ name: '', g: '', kcal: '', protein: '' });

  const totals = sumItems(items);
  const dayTotals = eatenTotals(data, day);
  const facts = factsOn(data, day);

  const setGrams = (i: number, g: number) =>
    setItems((list) =>
      list.map((it, k) => {
        if (k !== i) return it;
        if (it.product && per100Of(data.food, it.product)) return { ...itemFromProduct(data.food, it.product, g), name: it.name };
        // Без справочника — пересчёт пропорционально, если исходные граммы были.
        const ratio = it.g > 0 ? g / it.g : 1;
        return { ...it, g, kcal: Math.round(it.kcal * ratio), protein: Math.round(it.protein * ratio * 10) / 10 };
      }),
    );

  const addBatchPortion = () => {
    if (data.v4.batches.length === 0) return Alert.alert('Заготовок нет', 'Сначала создай заготовку: «Еда» → «Заготовки».');
    Alert.alert('Из заготовки', 'Какая заготовка?', [
      ...data.v4.batches.slice(-6).reverse().map((b) => ({ text: b.title, onPress: () => setItems((l) => [...l, portionItem(b, Math.min(300, b.outputG))]) })),
      { text: 'Отмена', style: 'cancel' as const },
    ]);
  };

  const addManual = () => {
    const g = Number(manual.g.replace(',', '.'));
    const kcal = Number(manual.kcal.replace(',', '.'));
    const protein = Number(manual.protein.replace(',', '.') || '0');
    if (!manual.name.trim() || !Number.isFinite(kcal) || kcal < 0) return Alert.alert('Укажи название и калории');
    setItems((l) => [...l, manualItem(manual.name.trim(), Number.isFinite(g) ? g : 0, kcal, Number.isFinite(protein) ? protein : 0, !manual.g)]);
    setManual({ name: '', g: '', kcal: '', protein: '' });
  };

  const save = () => {
    if (items.length === 0) return Alert.alert('Добавь хотя бы один продукт');
    update((d) => {
      let next = addFact(d, makeFact(day, title.trim() || 'Приём пищи', items, meal ? { slot: meal.slot } : {}));
      if (meal && !isEaten(next.food, day, meal.slot)) next = toggleEaten(next, day, meal.slot);
      return next;
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.muted}>{formatDay(day)} · съедено за день {formatNum(dayTotals.kcal)} ккал · белок {formatNum(dayTotals.protein)} г</Text>
          <TextInput value={title} onChangeText={setTitle} style={styles.title} placeholder="Название приёма" placeholderTextColor={colors.muted} />
          {items.length === 0 ? <Text style={styles.muted}>Добавь продукты с граммами — так подсчёт будет точным.</Text> : null}
          {items.map((it, i) => (
            <View key={i} style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.name}>{it.name}{it.estimated ? ' · ≈ оценка' : ''}</Text>
                <Text style={styles.muted}>{it.kcal} ккал · {it.protein} г белка</Text>
              </View>
              <TextInput
                value={it.g ? String(it.g) : ''}
                onChangeText={(t) => setGrams(i, Number(t.replace(',', '.').replace(/[^0-9.]/g, '')) || 0)}
                keyboardType="decimal-pad"
                placeholder="г"
                placeholderTextColor={colors.muted}
                style={styles.grams}
              />
              <Text style={styles.muted}>г</Text>
              <Pressable onPress={() => setItems((l) => l.filter((_, k) => k !== i))} hitSlop={8}>
                <Icon name="close" size={18} color={colors.muted} />
              </Pressable>
            </View>
          ))}
          <Text style={styles.total}>Итого: {formatNum(totals.kcal)} ккал · {formatNum(totals.protein)} г белка</Text>
        </Card>

        <Card style={styles.card}>
          <Button title="+ Продукт (граммы)" variant="secondary" small onPress={() => setPicker(true)} />
          <Button title="+ Порция из заготовки" variant="secondary" small onPress={addBatchPortion} />
          <Text style={styles.label}>ВРУЧНУЮ (если продукта нет в списке)</Text>
          <TextInput value={manual.name} onChangeText={(name) => setManual((m) => ({ ...m, name }))} placeholder="Название" placeholderTextColor={colors.muted} style={styles.input} />
          <View style={styles.inline}>
            <TextInput value={manual.g} onChangeText={(g) => setManual((m) => ({ ...m, g }))} placeholder="граммы" keyboardType="decimal-pad" placeholderTextColor={colors.muted} style={[styles.input, styles.flex]} />
            <TextInput value={manual.kcal} onChangeText={(kcal) => setManual((m) => ({ ...m, kcal }))} placeholder="ккал" keyboardType="decimal-pad" placeholderTextColor={colors.muted} style={[styles.input, styles.flex]} />
            <TextInput value={manual.protein} onChangeText={(protein) => setManual((m) => ({ ...m, protein }))} placeholder="белок" keyboardType="decimal-pad" placeholderTextColor={colors.muted} style={[styles.input, styles.flex]} />
          </View>
          <Text style={styles.muted}>Без граммов строка помечается как оценка (≈).</Text>
          <Button title="Добавить строку" variant="secondary" small onPress={addManual} />
        </Card>

        <Button title="Сохранить" onPress={save} />

        {facts.length > 0 ? (
          <Card style={styles.card}>
            <Text style={styles.label}>ЗАПИСАНО ЗА ДЕНЬ</Text>
            {facts.map((f) => (
              <View key={f.id} style={styles.row}>
                <View style={styles.flex}>
                  <Text style={styles.name}>{f.title}</Text>
                  <Text style={styles.muted}>{formatNum(f.kcal)} ккал · {formatNum(f.protein)} г белка · {f.items.length} поз.</Text>
                </View>
                <Pressable
                  onPress={() => Alert.alert('Удалить запись?', f.title, [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: () => update((d) => removeFact(d, f.id)) }])}
                  hitSlop={8}
                >
                  <Icon name="trash-can-outline" size={20} color={colors.muted} />
                </Pressable>
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>
      <ProductPicker visible={picker} onClose={() => setPicker(false)} onPick={(id) => setItems((l) => [...l, itemFromProduct(data.food, id, 100)])} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap },
  card: { gap: 10 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 0.5, marginTop: 4 },
  total: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 4 },
  grams: { width: 64, height: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.border, color: colors.text, textAlign: 'center', fontSize: 16 },
  input: { height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12, fontSize: 16 },
  inline: { flexDirection: 'row', gap: 8 },
});
