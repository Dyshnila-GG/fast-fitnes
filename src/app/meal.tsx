import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ingredients, openRecipe } from '../components/food/MealCard';
import { DishImage } from '../components/food/DishImage';
import { Button, Card } from '../components/ui';
import { DISHES, type DishId } from '../data/food';
import { formatMealTime, formatNum, isEaten, mealsFor, recipeOf, setPhoto, toggleEaten } from '../logic/food';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import { Icon } from '../components/Icon';

// Копия выбранного фото в постоянную папку приложения (кэш пикера система может очистить).
async function savePhoto(dish: DishId, pickedUri: string): Promise<string> {
  const dir = new Directory(Paths.document, 'food-photos');
  if (!dir.exists) dir.create({ intermediates: true });
  const dest = new File(dir, `${dish}-${Date.now()}.jpg`);
  await new File(pickedUri).copy(dest);
  return dest.uri;
}

function removeFile(uri: string | undefined) {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {}
}

export default function MealScreen() {
  const { day, slot } = useLocalSearchParams<{ day: string; slot: string }>();
  const { data, update } = useStore();
  const meal = mealsFor(data.food, day).find((m) => m.slot === slot);
  if (!meal) return null;
  const eaten = isEaten(data.food, day, meal.slot);

  const pick = async (dish: DishId, source: 'camera' | 'library') => {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Нет доступа', source === 'camera' ? 'Разрешите доступ к камере в настройках.' : 'Разрешите доступ к фото в настройках.');
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', allowsEditing: true, aspect: [4, 3], quality: 0.7 };
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (res.canceled) return;
    try {
      const uri = await savePhoto(dish, res.assets[0].uri);
      const old = data.food.photos[dish];
      update((d) => setPhoto(d, dish, uri));
      removeFile(old);
    } catch {
      Alert.alert('Не удалось сохранить фото');
    }
  };

  const choosePhoto = (dish: DishId) =>
    Alert.alert('Своё фото', DISHES[dish].name, [
      { text: 'Сфотографировать', onPress: () => pick(dish, 'camera') },
      { text: 'Из галереи', onPress: () => pick(dish, 'library') },
      { text: 'Отмена', style: 'cancel' },
    ]);

  const resetPhoto = (dish: DishId) => {
    const old = data.food.photos[dish];
    update((d) => setPhoto(d, dish, null));
    removeFile(old);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: `${meal.title} · ${formatMealTime(meal.time)}` }} />
      {meal.dishes.map((id) => {
        const dish = DISHES[id];
        const recipe = recipeOf(data.food, id);
        return (
          <Card key={id} style={styles.card}>
            <Pressable onPress={() => choosePhoto(id)}>
              <DishImage dish={id} style={styles.image} iconSize={64} />
              <Text style={styles.photoHint}>Нажмите на картинку — «Своё фото»</Text>
            </Pressable>
            {data.food.photos[id] && (
              <Button title="Вернуть стандартную картинку" variant="secondary" small onPress={() => resetPhoto(id)} />
            )}
            <Text style={styles.name}>{dish.name}</Text>
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
            <Ingredients dish={id} />
            <View style={styles.sectionRow}>
              <Text style={[styles.section, styles.flex]}>Как готовить</Text>
              {recipe.custom && <Text style={styles.ownTag}>Свой рецепт</Text>}
            </View>
            <Text style={styles.step}>{recipe.text}</Text>
          </Card>
        );
      })}
      <View style={styles.footer}>
        <Text style={styles.kcal}>~{formatNum(meal.kcal)} ккал</Text>
        <Text style={styles.protein}>{meal.protein} г белка</Text>
      </View>
      <View style={styles.actions}>
        <Button
          title={eaten ? 'Съедено' : 'Съел'}
          variant={eaten ? 'secondary' : 'primary'}
          onPress={() => update((d) => toggleEaten(d, day, meal.slot))}
          style={styles.action}
        />
        <Button
          title="Заменить"
          variant="secondary"
          onPress={() => router.push({ pathname: '/food-swap', params: { day, slot: meal.slot } })}
          style={styles.action}
        />
        <Button title="Рецепт" variant="secondary" onPress={() => openRecipe(meal.dishes)} style={styles.action} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap, paddingBottom: 40 },
  card: { gap: 8 },
  image: { height: 240 },
  photoHint: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 6 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  muted: { fontSize: 15, color: colors.muted },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  note: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 6 },
  step: { fontSize: 15, lineHeight: 22, color: colors.text },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, paddingHorizontal: 6 },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  ownTag: { fontSize: 13, fontWeight: '600', color: colors.muted },
  footer: { flexDirection: 'row', alignItems: 'baseline', gap, paddingHorizontal: 4 },
  kcal: { fontSize: 28, fontWeight: '800', color: colors.text },
  protein: { fontSize: 16, fontWeight: '600', color: colors.muted },
});
