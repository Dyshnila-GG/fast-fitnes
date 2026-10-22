import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '../Text';
import { colors } from '../../theme';
import { useT } from '../../i18n/useT';

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';
// 25% slower than the previous demo cadence so technique is readable between sets.
const FRAME_MS = 875;
const RETRIES = 2; // повторы при сбое сети, потом заглушка
const RETRY_MS = 1500;

// Два кадра из free-exercise-db (SPEC §6).
export const demoUrls = (gifId: string) => [`${BASE}/${gifId}/0.jpg`, `${BASE}/${gifId}/1.jpg`];

type Props = { gifId: string; mediaUrl?: string; playing?: boolean; square?: boolean; style?: StyleProp<ViewStyle> };

// Имитация GIF: чередование кадров. Оба кадра наложены друг на друга — смена без мерцания.
// При смене gifId вызывающий передаёт key={gifId}, чтобы состояние сбрасывалось.
export function ExerciseGif({ gifId, mediaUrl, playing = true, square, style }: Props) {
  if (mediaUrl) return <AnimatedDemo url={mediaUrl} fallbackGifId={gifId} playing={playing} square={square} style={style} />;
  return <FrameDemo gifId={gifId} playing={playing} style={style} />;
}

// Настоящая анимация (ExerciseDB, анатомия с подсветкой мышц). При сбое — два кадра free-exercise-db.
function AnimatedDemo({ url, fallbackGifId, playing, square, style }: { url: string; fallbackGifId: string; playing: boolean; square?: boolean; style?: StyleProp<ViewStyle> }) {
  const [attempt, setAttempt] = useState(0);
  const [errored, setErrored] = useState(false);
  useEffect(() => {
    if (!errored || attempt >= RETRIES) return;
    const t = setTimeout(() => {
      setAttempt((a) => a + 1);
      setErrored(false);
    }, RETRY_MS);
    return () => clearTimeout(t);
  }, [errored, attempt]);
  if (errored && attempt >= RETRIES) {
    return fallbackGifId ? <FrameDemo gifId={fallbackGifId} playing={playing} style={style} /> : <FrameDemo gifId="" playing={false} style={style} />;
  }
  return (
    <View style={[styles.box, square ? styles.square : styles.wide, style]}>
      <Image
        key={`${url}#${attempt}`}
        source={{ uri: url }}
        cachePolicy="disk"
        contentFit="contain"
        autoplay={playing}
        transition={null}
        onError={() => setErrored(true)}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function FrameDemo({ gifId, playing = true, style }: { gifId: string; playing?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useT();
  const [frame, setFrame] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [errored, setErrored] = useState(false);
  const failed = !gifId || (errored && attempt >= RETRIES);

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
        <Text style={styles.stub}>{t('exercise.noDemo')}</Text>
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
  wide: { aspectRatio: 4 / 3 },
  square: { aspectRatio: 1 },
});
