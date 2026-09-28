import { StyleSheet, Text, View } from 'react-native';
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
  onPause: () => void;
  onFinish: () => void;
};

export function Header({ session, current, total, onPause, onFinish }: Props) {
  const now = useNow();
  const paused = !!session.pausedAt;
  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <Text style={[styles.timer, paused && styles.timerPaused]}>{formatDuration(elapsedMs(session, now))}</Text>
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
      <Text style={styles.progress}>
        {paused ? 'На паузе · ' : ''}Упражнение {current} из {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 10, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  timer: { fontSize: 48, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  timerPaused: { color: colors.muted },
  pauseBox: { alignItems: 'flex-end' },
  pauseLabel: { fontSize: 13, color: colors.muted },
  pauseValue: { fontSize: 20, fontWeight: '600', color: colors.muted, fontVariant: ['tabular-nums'] },
  pauseActive: { color: colors.warning },
  flex: { flex: 1 },
  progress: { fontSize: 15, color: colors.muted, fontWeight: '500' },
});
