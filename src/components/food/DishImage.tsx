import { File } from 'expo-file-system';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { DISH_IMAGES, DISHES, type DishId } from '../../data/food';
import { useStore } from '../../store/AppStore';
import { colors } from '../../theme';

// Своё фото, если файл на месте (после импорта с другого телефона его может не быть).
function photoExists(uri: string): boolean {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

// Картинка блюда: своё фото → фото из assets/food → заглушка (эмодзи на тёмном фоне).
export function DishImage({ dish, style, emojiSize = 72 }: { dish: DishId; style?: StyleProp<ViewStyle>; emojiSize?: number }) {
  const { data } = useStore();
  const custom = data.food.photos[dish];
  const source = useMemo(() => {
    if (custom && photoExists(custom)) return { uri: custom };
    return DISH_IMAGES[dish];
  }, [custom, dish]);

  return (
    <View style={[styles.box, style]}>
      {source != null ? (
        <Image source={source} contentFit="cover" transition={null} style={StyleSheet.absoluteFill} />
      ) : (
        <Text style={{ fontSize: emojiSize }}>{DISHES[dish].emoji}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 180,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
