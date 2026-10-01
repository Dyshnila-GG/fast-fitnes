import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import type { DishId } from '../../data/food';
import { dishOf, formatNum, recipeOf, setPhoto } from '../../logic/food';
import { useStore } from '../../store/AppStore';
import { colors } from '../../theme';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { Button, Card } from '../ui';
import { DishImage } from './DishImage';
import { choosePhoto, removePhotoFile } from './dishPhoto';
import { Ingredients } from './MealCard';

// Карточка блюда: фото (тап — своё фото), название с «Изменить», ккал и белок, подсказка, ингредиенты, рецепт.
export function DishDetails({ id, from }: { id: DishId; from?: 'dish' }) {
  const { data, update } = useStore();
  const dish = dishOf(data.food, id);
  if (!dish) return null;
  const recipe = recipeOf(data.food, id);
  const own = data.food.photos[id];

  const photo = () =>
    choosePhoto(dish.name, (uri) => {
      update((d) => setPhoto(d, id, uri));
      removePhotoFile(own);
    });
  const resetPhoto = () => {
    update((d) => setPhoto(d, id, null));
    removePhotoFile(own);
  };

  return (
    <Card style={styles.card}>
      <Pressable onPress={photo} accessibilityRole="button" accessibilityLabel="Своё фото">
        <DishImage key={id} dish={id} style={styles.image} iconSize={64} />
        <Text style={styles.photoHint}>Нажмите на картинку — «Своё фото»</Text>
      </Pressable>
      {own && <Button title="Вернуть стандартную картинку" variant="secondary" small onPress={resetPhoto} />}
      <View style={styles.row}>
        <Text style={[styles.name, styles.flex]}>{dish.name}</Text>
        <Pressable
          onPress={() => router.push({ pathname: '/dish-edit', params: from ? { id, from } : { id } })}
          accessibilityRole="button"
          hitSlop={6}
          style={({ pressed }) => [styles.edit, pressed && styles.pressed]}
        >
          <Icon name="pencil-outline" size={16} />
          <Text style={styles.editText}>Изменить</Text>
        </Pressable>
      </View>
      <Text style={styles.muted}>
        ~{formatNum(dish.kcal)} ккал · {dish.protein} г белка
      </Text>
      {dish.note && (
        <View style={styles.noteRow}>
          <Icon name="alert-outline" size={18} />
          <Text style={styles.note}>{dish.note}</Text>
        </View>
      )}
      <Text style={styles.section}>Ингредиенты</Text>
      {dish.items.length > 0 || dish.ingredients ? <Ingredients dish={id} /> : <Text style={styles.muted}>Не указаны</Text>}
      <View style={styles.row}>
        <Text style={[styles.section, styles.flex]}>Как готовить</Text>
        {recipe.custom && dish.steps && <Text style={styles.ownTag}>Свой рецепт</Text>}
      </View>
      <Text style={[styles.step, !recipe.text && styles.muted]}>{recipe.text || 'Рецепт не указан'}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  image: { height: 240 },
  photoHint: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  muted: { fontSize: 15, color: colors.muted },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  note: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 6 },
  step: { fontSize: 15, lineHeight: 22, color: colors.text },
  ownTag: { fontSize: 13, fontWeight: '600', color: colors.muted },
  edit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.button,
  },
  editText: { fontSize: 13, fontWeight: '600', color: colors.text },
  pressed: { opacity: 0.7 },
});
