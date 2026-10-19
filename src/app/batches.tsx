import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { ProductPicker } from '../components/food/ProductPicker';
import { Button, Card } from '../components/ui';
import { Icon } from '../components/Icon';
import { formatDay } from '../logic/format';
import { formatNum } from '../logic/food';
import { dayKey } from '../logic/metrics';
import { addBatch, itemFromProduct, makeBatch, manualItem, per100Of, removeBatch, sumItems } from '../logic/v4';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import type { FoodFactItem } from '../types';

const num = (t: string) => Number(t.replace(',', '.').replace(/[^0-9.]/g, '')) || 0;

// Заготовки (handoff §17): сырые ингредиенты в граммах + вес готового блюда.
// Вода при готовке меняет массу, но не калории — порция считается как доля от сырых продуктов.
export default function BatchesScreen() {
  const { data, update } = useStore();
  const [title, setTitle] = useState('');
  const [inputs, setInputs] = useState<FoodFactItem[]>([]);
  const [output, setOutput] = useState('');
  const [picker, setPicker] = useState(false);
  const [manual, setManual] = useState({ name: '', g: '', kcal: '', protein: '' });
  const totals = sumItems(inputs);
  const outputG = num(output);

  const setGrams = (i: number, g: number) =>
    setInputs((l) => l.map((it, k) => (k !== i ? it : it.product && per100Of(data.food, it.product) ? itemFromProduct(data.food, it.product, g) : { ...it, g })));

  const save = () => {
    if (!title.trim()) return Alert.alert('Назови заготовку');
    if (inputs.length === 0) return Alert.alert('Добавь сырые ингредиенты');
    if (outputG <= 0) return Alert.alert('Взвесь готовое блюдо', 'Укажи вес всего приготовленного в граммах.');
    update((d) => addBatch(d, makeBatch(dayKey(), title.trim(), inputs, outputG)));
    setTitle('');
    setInputs([]);
    setOutput('');
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.label}>НОВАЯ ЗАГОТОВКА</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Например: рис с яйцом" placeholderTextColor={colors.muted} style={styles.input} />
          <Text style={styles.muted}>Сырые продукты (до готовки):</Text>
          {inputs.map((it, i) => (
            <View key={i} style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.name}>{it.name}</Text>
                <Text style={styles.muted}>{it.kcal} ккал · {it.protein} г белка</Text>
              </View>
              <TextInput value={it.g ? String(it.g) : ''} onChangeText={(t) => setGrams(i, num(t))} keyboardType="decimal-pad" placeholder="г" placeholderTextColor={colors.muted} style={styles.grams} />
              <Pressable onPress={() => setInputs((l) => l.filter((_, k) => k !== i))} hitSlop={8}>
                <Icon name="close" size={18} color={colors.muted} />
              </Pressable>
            </View>
          ))}
          <Button title="+ Продукт" variant="secondary" small onPress={() => setPicker(true)} />
          <View style={styles.inline}>
            <TextInput value={manual.name} onChangeText={(name) => setManual((m) => ({ ...m, name }))} placeholder="своё" placeholderTextColor={colors.muted} style={[styles.input, styles.flex]} />
            <TextInput value={manual.g} onChangeText={(g) => setManual((m) => ({ ...m, g }))} placeholder="г" keyboardType="decimal-pad" placeholderTextColor={colors.muted} style={[styles.input, styles.small]} />
            <TextInput value={manual.kcal} onChangeText={(kcal) => setManual((m) => ({ ...m, kcal }))} placeholder="ккал" keyboardType="decimal-pad" placeholderTextColor={colors.muted} style={[styles.input, styles.small]} />
            <TextInput value={manual.protein} onChangeText={(protein) => setManual((m) => ({ ...m, protein }))} placeholder="белок" keyboardType="decimal-pad" placeholderTextColor={colors.muted} style={[styles.input, styles.small]} />
          </View>
          <Button
            title="+ Своя строка"
            variant="secondary"
            small
            onPress={() => {
              if (!manual.name.trim()) return;
              setInputs((l) => [...l, manualItem(manual.name.trim(), num(manual.g), num(manual.kcal), num(manual.protein))]);
              setManual({ name: '', g: '', kcal: '', protein: '' });
            }}
          />
          <Text style={styles.total}>Сырое: {formatNum(totals.kcal)} ккал · {formatNum(totals.protein)} г белка</Text>
          <TextInput value={output} onChangeText={setOutput} placeholder="Вес готового блюда, г" keyboardType="decimal-pad" placeholderTextColor={colors.muted} style={styles.input} />
          {outputG > 0 ? (
            <Text style={styles.muted}>
              В 100 г готового: {formatNum((totals.kcal * 100) / outputG)} ккал · {formatNum((totals.protein * 100) / outputG)} г белка
            </Text>
          ) : null}
          <Button title="Сохранить заготовку" onPress={save} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>ЗАГОТОВКИ</Text>
          {data.v4.batches.length === 0 ? <Text style={styles.muted}>Пока нет. Порцию из заготовки записывай в «Что съел».</Text> : null}
          {[...data.v4.batches].reverse().map((b) => (
            <View key={b.id} style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.name}>{b.title}</Text>
                <Text style={styles.muted}>
                  {formatDay(b.date)} · {formatNum(b.outputG)} г готового · {formatNum((b.kcal * 100) / Math.max(1, b.outputG))} ккал/100 г
                </Text>
              </View>
              <Pressable
                onPress={() => Alert.alert('Удалить заготовку?', b.title, [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: () => update((d) => removeBatch(d, b.id)) }])}
                hitSlop={8}
              >
                <Icon name="trash-can-outline" size={20} color={colors.muted} />
              </Pressable>
            </View>
          ))}
        </Card>
      </ScrollView>
      <ProductPicker visible={picker} onClose={() => setPicker(false)} onPick={(id) => setInputs((l) => [...l, itemFromProduct(data.food, id, 100)])} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap },
  card: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 0.5 },
  total: { fontSize: 16, fontWeight: '800', color: colors.text },
  grams: { width: 64, height: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.border, color: colors.text, textAlign: 'center', fontSize: 16 },
  input: { height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12, fontSize: 16 },
  small: { width: 64 },
  inline: { flexDirection: 'row', gap: 6 },
});
