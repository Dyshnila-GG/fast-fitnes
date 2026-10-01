import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { confirmDeleteDish } from '../components/food/confirmDeleteDish';
import { DishDetails } from '../components/food/DishDetails';
import { removePhotoFile } from '../components/food/dishPhoto';
import { Button } from '../components/ui';
import { deleteDish, dishOf } from '../logic/food';
import { useStore } from '../store/AppStore';
import { gap } from '../theme';
import { dishName } from '../i18n/content';
import { useT } from '../i18n/useT';

// Экран блюда из «Меню»: как в приёме, плюс «Удалить».
export default function DishScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, update } = useStore();
  const dish = id ? dishOf(data.food, id) : undefined;
  if (!id || !dish) return null;

  const remove = () =>
    confirmDeleteDish(data.food, id, () => {
      const photo = data.food.photos[id];
      router.back();
      update((d) => deleteDish(d, id));
      removePhotoFile(photo);
    });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: dishName(dish) }} />
      <DishDetails id={id} from="dish" />
      <Button title={t('dish.delete')} variant="danger" onPress={remove} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap, paddingBottom: 40 },
});
