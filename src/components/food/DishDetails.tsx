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
import { dishName, dishNote } from '../../i18n/content';
import { useT } from '../../i18n/useT';

// Карточка блюда: фото (тап — своё фото), название с «Изменить», ккал и белок, подсказка, ингредиенты, рецепт.
export function DishDetails({ id, from }: { id: DishId; from?: 'dish' }) {
  const t = useT();
  const { data, update } = useStore();
  const dish = dishOf(data.food, id);
  if (!dish) return null;
  const recipe = recipeOf(data.food, id);
  const own = data.food.photos[id];

  const photo = () =>
    choosePhoto(dishName(dish), (uri) => {
      update((d) => setPhoto(d, id, uri));
      removePhotoFile(own);
    });
  const resetPhoto = () => {
    update((d) => setPhoto(d, id, null));
    removePhotoFile(own);
  };

  return (
    <Card style={styles.card}>
      <Pressable onPress={photo} accessibilityRole="button" accessibilityLabel={t('photo.title')}>
        <DishImage key={id} dish={id} style={styles.image} iconSize={64} />
        <Text style={styles.photoHint}>{t('photo.hint')}</Text>
      </Pressable>
      {own && <Button title={t('photo.reset')} variant="secondary" small onPress={resetPhoto} />}
      <View style={styles.row}>
        <Text style={[styles.name, styles.flex]}>{dishName(dish)}</Text>
        <Pressable
          onPress={() => router.push({ pathname: '/dish-edit', params: from ? { id, from } : { id } })}
          accessibilityRole="button"
          hitSlop={6}
          style={({ pressed }) => [styles.edit, pressed && styles.pressed]}
        >
          <Icon name="pencil-outline" size={16} />
          <Text style={styles.editText}>{t('common.change')}</Text>
        </Pressable>
      </View>
      <Text style={styles.muted}>
        ~{t('food.kcalProtein', { kcal: formatNum(dish.kcal), protein: dish.protein })}
      </Text>
      {dish.note && (
        <View style={styles.noteRow}>
          <Icon name="alert-outline" size={18} />
          <Text style={styles.note}>{dishNote(dish)}</Text>
        </View>
      )}
      <Text style={styles.section}>{t('dish.ingredients')}</Text>
      {dish.items.length > 0 || dish.ingredients ? <Ingredients dish={id} /> : <Text style={styles.muted}>{t('dish.noIngredients')}</Text>}
      <View style={styles.row}>
        <Text style={[styles.section, styles.flex]}>{t('dish.howTo')}</Text>
        {recipe.custom && dish.steps && <Text style={styles.ownTag}>{t('recipe.own')}</Text>}
      </View>
      <Text style={[styles.step, !recipe.text && styles.muted]}>{recipe.text || t('recipe.none')}</Text>
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
