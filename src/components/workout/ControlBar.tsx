import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { useNow } from '../../hooks/useNow';
import { formatDuration } from '../../logic/format';
import { elapsedMs, pausedTotalMs } from '../../logic/session';
import { colors } from '../../theme';
import type { Session } from '../../types';
import { Button } from '../ui';

type Props = {
  session: Session;
  current: number;
  total: number;
  bottom: number; // высота системной полосы
  onPause: () => void;
  onFinish: () => void;
};

// Закреплённая панель внизу экрана тренировки (SPEC §3.1).
export function ControlBar({ session, current, total, bottom, onPause, onFinish }: Props) {
  const now = useNow();
  const paused = !!session.pausedAt;
  return (
    <View style={[styles.box, { paddingBottom: bottom + 12 }]}>
      <View style={styles.row}>
        <View>
          <Text style={[styles.timer, paused && styles.timerPaused]}>{formatDuration(elapsedMs(session, now))}</Text>
          <Text style={styles.progress}>
            {paused ? 'На паузе · ' : ''}Упражнение {current} из {total}
          </Text>
        </View>
        <View style={styles.pauseBox}>
          <Text style={styles.pauseLabel}>общая пауза</Text>
          <Text style={[styles.pauseValue, paused && styles.pauseActive]}>
            {formatDuration(pausedTotalMs(session, now))}
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <Button
          title={paused ? 'Продолжить' : 'Пауза'}
          variant={paused ? 'primary' : 'secondary'}
          onPress={onPause}
          style={styles.flex}
        />
        <Button title="Завершить" variant="danger" onPress={onFinish} style={styles.flex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  timer: { fontSize: 48, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  timerPaused: { color: colors.muted },
  pauseBox: { alignItems: 'flex-end' },
  pauseLabel: { fontSize: 13, color: colors.muted },
  pauseValue: { fontSize: 22, fontWeight: '700', color: colors.muted, fontVariant: ['tabular-nums'] },
  pauseActive: { color: colors.text },
  flex: { flex: 1 },
  progress: { fontSize: 14, color: colors.muted, fontWeight: '500' },
});
