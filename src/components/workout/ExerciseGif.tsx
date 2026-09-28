import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme';

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';
const FRAME_MS = 700;
const RETRIES = 2; // повторы при сбое сети, потом заглушка
const RETRY_MS = 1500;

// Два кадра из free-exercise-db (SPEC §6).
export const demoUrls = (gifId: string) => [`${BASE}/${gifId}/0.jpg`, `${BASE}/${gifId}/1.jpg`];

type Props = { gifId: string; playing?: boolean; style?: StyleProp<ViewStyle> };

// Имитация GIF: чередование кадров. Оба кадра наложены друг на друга — смена без мерцания.
// При смене gifId вызывающий передаёт key={gifId}, чтобы состояние сбрасывалось.
export function ExerciseGif({ gifId, playing = true, style }: Props) {
  const [frame, setFrame] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [errored, setErrored] = useState(false);
  const failed = errored && attempt >= RETRIES;

  useEffect(() => {
    if (!errored || attempt >= RETRIES) return;
    const t = setTimeout(() => {
      setAttempt((a) => a + 1);
      setErrored(false);
    }, RETRY_MS);
    return () => clearTimeout(t);
  }, [errored, attempt]);

  useEffect(() => {
    if (!playing || failed) return;
    const t = setInterval(() => setFrame((f) => 1 - f), FRAME_MS);
    return () => clearInterval(t);
  }, [playing, failed]);

  return (
    <View style={[styles.box, style]}>
      {failed ? (
        <Text style={styles.stub}>демонстрация не подключена</Text>
      ) : (
        demoUrls(gifId).map((uri, i) => (
          <Image
            key={`${uri}#${attempt}`}
            source={{ uri }}
            cachePolicy="memory-disk"
            contentFit="contain"
            transition={null}
            onError={() => setErrored(true)}
            style={[StyleSheet.absoluteFill, { opacity: frame === i ? 1 : 0 }]}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    aspectRatio: 3 / 2,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF', // кадры базы на белом фоне
    alignItems: 'center',
    justifyContent: 'center',
  },
  stub: { color: colors.muted, fontSize: 15 },
});
