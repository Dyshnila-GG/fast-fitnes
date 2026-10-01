import { File } from 'expo-file-system';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { DishId } from '../../data/food';
import { FOOD_IMAGES } from '../../data/foodImages';
import { useStore } from '../../store/AppStore';
import { colors, radius } from '../../theme';
import { Icon } from '../Icon';

const RETRIES = 2; // повторы при сбое сети, потом заглушка (как у GIF упражнений)
const RETRY_MS = 1500;

// Своё фото, если файл на месте (после импорта с другого телефона его может не быть).
function photoExists(uri: string): boolean {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

// Картинка блюда: своё фото → фото стандартного блюда по ссылке (кэш на телефоне) → тёмная заглушка с иконкой.
// При смене блюда вызывающий передаёт key={dish}, чтобы счётчик повторов сбрасывался.
// photo — показать этот файл вместо сохранённого, null — без своего фото (предпросмотр в форме блюда).
export function DishImage({
  dish,
  photo,
  style,
  iconSize = 40,
}: {
  dish?: DishId;
  photo?: string | null;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
}) {
  const { data } = useStore();
  const custom = photo === undefined ? (dish ? data.food.photos[dish] : undefined) : (photo ?? undefined);
  const uri = useMemo(() => {
    if (custom && photoExists(custom)) return custom;
    return (dish && (FOOD_IMAGES as Partial<Record<DishId, string>>)[dish]) || null;
  }, [custom, dish]);

  const [attempt, setAttempt] = useState(0);
  const [errored, setErrored] = useState(false);
  const failed = uri == null || (errored && attempt >= RETRIES);

  useEffect(() => {
    if (!errored || attempt >= RETRIES) return;
    const t = setTimeout(() => {
      setAttempt((a) => a + 1);
      setErrored(false);
    }, RETRY_MS);
    return () => clearTimeout(t);
  }, [errored, attempt]);

  return (
    <View style={[styles.box, style]}>
      {failed ? (
        <Icon name="silverware-fork-knife" size={iconSize} color={colors.muted} />
      ) : (
        <Image
          key={`${uri}#${attempt}`}
          source={{ uri }}
          cachePolicy="disk"
          contentFit="cover"
          transition={null}
          onError={() => setErrored(true)}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 180,
    borderRadius: radius,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
