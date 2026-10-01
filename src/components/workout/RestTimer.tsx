import { useAudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';
import { StyleSheet, Vibration, View } from 'react-native';
import { Text } from '../Text';
import { useNow } from '../../hooks/useNow';
import { formatDuration } from '../../logic/format';
import { colors, radius } from '../../theme';
import { Button } from '../ui';

const BEEP = require('../../../assets/beep.wav');
const LATE_MS = 10_000; // если опоздали сильнее (приложение было закрыто) — без сигнала

type Props = {
  endsAt: string;
  totalSec: number;
  onShift: (deltaSec: number) => void;
  onStop: () => void;
};

// Таймер отдыха поверх списка, над нижней панелью; по окончании — вибрация и звук.
export function RestTimer({ endsAt, totalSec, onShift, onStop }: Props) {
  const now = useNow(250);
  const player = useAudioPlayer(BEEP);
  const fired = useRef<string | null>(null);
  const left = new Date(endsAt).getTime() - now;

  useEffect(() => {
    if (left > 0 || fired.current === endsAt) return;
    fired.current = endsAt;
    if (-left < LATE_MS) {
      Vibration.vibrate([0, 500, 200, 500]);
      player.seekTo(0).then(() => player.play()).catch(() => {});
    }
    onStop();
  }, [left, endsAt, player, onStop]);

  const progress = totalSec > 0 ? Math.min(1, Math.max(0, left / (totalSec * 1000))) : 0;

  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <Text style={styles.label}>Отдых</Text>
        <Text style={styles.time}>{formatDuration(Math.max(0, left) + 999)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.bar, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.row}>
        <Button title="−15 с" variant="secondary" small onPress={() => onShift(-15)} style={styles.flex} />
        <Button title="+15 с" variant="secondary" small onPress={() => onShift(15)} style={styles.flex} />
        <Button title="Пропустить" small onPress={onStop} style={styles.flex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    gap: 10,
    padding: 14,
    borderRadius: radius,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.highlight,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { fontSize: 17, fontWeight: '600', color: colors.muted },
  time: { fontSize: 40, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  bar: { height: 6, backgroundColor: colors.text },
  flex: { flex: 1 },
});
