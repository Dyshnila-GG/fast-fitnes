import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { confirmDeleteDish } from '../components/food/confirmDeleteDish';
import { DishImage } from '../components/food/DishImage';
import { choosePhoto, removePhotoFile } from '../components/food/dishPhoto';
import { ProductPicker } from '../components/food/ProductPicker';
import { Icon } from '../components/Icon';
import { Text, TextInput } from '../components/Text';
import { Button, Card } from '../components/ui';
import { type DishItem } from '../data/food';
import { FOOD_IMAGES } from '../data/foodImages';
import { deleteDish, productOf, recipeOf, saveDish, setPhoto, setRecipe, standardRecipe } from '../logic/food';
import { newId } from '../logic/id';
import { parseNum } from '../logic/metrics';
import { inputNum } from '../i18n';
import { useStore } from '../store/AppStore';
import { colors, gap, radius } from '../theme';
import { dishName, pieceUnit, productName } from '../i18n/content';
import { useT } from '../i18n/useT';

type Row = { key: string; product?: string; g: string; count: string };

const toRow = (i: DishItem): Row => ({ key: newId(), product: i.product, g: inputNum(i.g), count: inputNum(i.count) });
const emptyRow = (): Row => ({ key: newId(), g: '', count: '' });
const num = inputNum;

// Форма блюда (SPEC_v3_3 §C2): новое — без id, «Изменить» — с id. Та же форма для стандартных и своих блюд.
export default function DishEditScreen() {
  const t = useT();
  const params = useLocalSearchParams<{ id?: string; from?: string }>();
  const { data, update } = useStore();
  const prev = params.id ? data.food.dishes[params.id] : undefined;
  const dishId = useMemo(() => prev?.id ?? `d_${newId()}`, [prev?.id]);

  const [name, setName] = useState(prev ? dishName(prev) : '');
  const [rows, setRows] = useState<Row[]>(() => (prev?.items.length ? prev.items.map(toRow) : [emptyRow()]));
  const [recipe, setRecipeText] = useState(() => (prev ? recipeOf(data.food, prev.id, false).text : ''));
  const [kcal, setKcal] = useState(num(prev?.kcal));
  const [protein, setProtein] = useState(num(prev?.protein));
  const [salad, setSalad] = useState(!!prev?.salad);
  const [photo, setPhotoUri] = useState<string | null | undefined>(undefined); // undefined — без изменений
  const [picking, setPicking] = useState<string | null>(null); // key строки, для которой выбирается продукт

  const currentPhoto = photo === undefined ? data.food.photos[dishId] : photo;
  const setRow = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const pickPhoto = () => choosePhoto(name || t('dish.new'), (uri) => setPhotoUri(uri));

  const save = () => {
    const title = name.trim();
    if (!title) return Alert.alert(t('dishForm.needName'));
    const k = parseNum(kcal);
    const p = parseNum(protein);
    if (k == null || k < 0 || p == null || p < 0) return Alert.alert(t('dishForm.needKcal'), t('dishForm.needKcalText'));
    const filled = rows.filter((r) => r.product || r.g.trim() || r.count.trim());
    const items: DishItem[] = [];
    for (const r of filled) {
      const g = parseNum(r.g);
      const count = r.count.trim() ? parseNum(r.count) : undefined;
      if (!r.product) return Alert.alert(t('dishForm.pickProduct'), t('dishForm.pickProductText'));
      if (g == null || g <= 0) return Alert.alert(t('dishForm.needGrams'), t('dishForm.needGramsText', { name: productName(r.product, productOf(data.food, r.product)) }));
      if (count !== undefined && (count == null || count <= 0)) return Alert.alert(t('dishForm.countPositive'));
      items.push({ product: r.product, g, count: count ?? undefined });
    }
    // Название стандартного блюда не меняли — сохраняем исходное (перевод — по словарю).
    const input = { name: prev?.std && title === dishName(prev) ? prev.name : title, items, kcal: k, protein: p, salad };
    const oldPhoto = data.food.photos[dishId];
    update((d) => {
      let next = saveDish(d, dishId, input).data;
      // Рецепт: совпадает со стандартным — свой не нужен.
      const text = recipe.trim();
      next = setRecipe(next, dishId, text && text !== standardRecipe(next.food, dishId) ? text : null);
      if (photo !== undefined) next = setPhoto(next, dishId, photo);
      return next;
    });
    if (photo !== undefined && oldPhoto && oldPhoto !== photo) removePhotoFile(oldPhoto);
    router.back();
  };

  const remove = () =>
    confirmDeleteDish(data.food, dishId, () => {
      const old = data.food.photos[dishId];
      // Из экрана блюда — назад в «Меню» (экран удалённого блюда не нужен).
      if (params.from === 'dish') router.dismiss(2);
      else router.back();
      update((d) => deleteDish(d, dishId));
      removePhotoFile(old);
    });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: t(prev ? 'dishForm.editTitle' : 'dish.new') }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={pickPhoto} accessibilityRole="button" accessibilityLabel={t('dishForm.photo')}>
          {currentPhoto || FOOD_IMAGES[dishId as keyof typeof FOOD_IMAGES] ? (
            <DishImage key={currentPhoto ?? dishId} dish={dishId} photo={currentPhoto ?? null} style={styles.photo} iconSize={48} />
          ) : (
            <View style={[styles.photo, styles.photoEmpty]}>
              <Icon name="camera-plus-outline" size={36} color={colors.muted} />
              <Text style={styles.muted}>{t('dishForm.photoOptional')}</Text>
            </View>
          )}
        </Pressable>
        {currentPhoto ? <Button title={t('dishForm.removePhoto')} variant="secondary" small onPress={() => setPhotoUri(null)} /> : null}

        <Field label={t('report.title')}>
          <TextInput value={name} onChangeText={setName} placeholder={t('dishForm.namePlaceholder')} placeholderTextColor={colors.muted} style={styles.input} />
        </Field>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t('dish.ingredients')}</Text>
          {rows.map((r) => {
            const product = r.product ? productOf(data.food, r.product) : undefined;
            return (
              <View key={r.key} style={styles.itemRow}>
                <Pressable onPress={() => setPicking(r.key)} style={({ pressed }) => [styles.product, pressed && styles.pressed]}>
                  <Text style={[styles.productText, !product && styles.mutedText]} numberOfLines={2}>
                    {r.product ? productName(r.product, product) : t('dishForm.pickProduct')}
                  </Text>
                  <Icon name="chevron-down" size={18} color={colors.muted} />
                </Pressable>
                <View style={styles.amounts}>
                  <View style={styles.amount}>
                    <TextInput
                      value={r.g}
                      onChangeText={(g) => setRow(r.key, { g })}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                      style={styles.amountInput}
                    />
                    <Text style={styles.unit}>{t('unit.g')}</Text>
                  </View>
                  {product?.piece ? (
                    <View style={styles.amount}>
                      <TextInput
                        value={r.count}
                        onChangeText={(count) => setRow(r.key, { count })}
                        keyboardType="decimal-pad"
                        placeholder="—"
                        placeholderTextColor={colors.muted}
                        style={styles.amountInput}
                      />
                      <Text style={styles.unit}>{pieceUnit(product.piece.unit)}</Text>
                    </View>
                  ) : null}
                  <Pressable
                    onPress={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : [emptyRow()]))}
                    hitSlop={8}
                    accessibilityLabel={t('dishForm.removeProduct')}
                    style={styles.remove}
                  >
                    <Icon name="close" size={16} color={colors.muted} />
                  </Pressable>
                </View>
              </View>
            );
          })}
          <Button title={t('dishForm.addProduct')} variant="secondary" small onPress={() => setRows((rs) => [...rs, emptyRow()])} />
          <Text style={styles.hint}>{t('dishForm.gramsHint')}</Text>
        </Card>

        <Field label={t('recipe.placeholder')}>
          <TextInput
            value={recipe}
            onChangeText={setRecipeText}
            multiline
            textAlignVertical="top"
            placeholder={t('dish.howTo')}
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.multiline]}
          />
        </Field>

        <View style={styles.pair}>
          <Field label={t('dishForm.kcal')}>
            <TextInput value={kcal} onChangeText={setKcal} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.muted} style={styles.input} />
          </Field>
          <Field label={t('dishForm.protein')}>
            <TextInput value={protein} onChangeText={setProtein} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.muted} style={styles.input} />
          </Field>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <Text style={styles.switchTitle}>{t('dishForm.salad')}</Text>
            <Text style={styles.muted}>{t('dishForm.saladHint')}</Text>
          </View>
          <Switch
            value={salad}
            onValueChange={setSalad}
            trackColor={{ false: colors.button, true: colors.primary }}
            thumbColor={salad ? colors.onPrimary : colors.muted}
            ios_backgroundColor={colors.button}
          />
        </View>

        <Button title={t('common.save')} onPress={save} />
        {prev ? <Button title={t('dish.delete')} variant="danger" onPress={remove} /> : null}
      </ScrollView>
      <ProductPicker
        visible={picking != null}
        onClose={() => setPicking(null)}
        onPick={(product) => picking && setRow(picking, { product, count: '' })}
      />
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap, paddingBottom: 48 },
  photo: { height: 200 },
  photoEmpty: {
    borderRadius: radius,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  field: { flex: 1, gap: 6 },
  label: { fontSize: 13, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  input: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 17,
    color: colors.text,
  },
  multiline: { minHeight: 140, paddingTop: 12, lineHeight: 24 },
  pair: { flexDirection: 'row', gap },
  card: { gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  itemRow: { gap: 8, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  product: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productText: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  mutedText: { color: colors.muted, fontWeight: '500' },
  amounts: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amount: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountInput: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text },
  unit: { fontSize: 15, color: colors.muted },
  remove: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 13, color: colors.muted },
  muted: { fontSize: 14, color: colors.muted },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  pressed: { opacity: 0.7 },
});
