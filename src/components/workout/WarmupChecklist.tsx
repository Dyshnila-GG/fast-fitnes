import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WARMUP_ITEMS } from '../../logic/session';
import { colors } from '../../theme';
import type { Length } from '../../types';
import { Card } from '../ui';

type Props = { length: Length; done: string[]; onToggle: (id: string) => void };

export function WarmupChecklist({ length, done, onToggle }: Props) {
  const complete = WARMUP_ITEMS.every((i) => done.includes(i.id));
  return (
    <Card style={[styles.card, !complete && styles.pending]}>
      <Text style={styles.title}>Разминка</Text>
      {WARMUP_ITEMS.map((item) => {
        const checked = done.includes(item.id);
        return (
          <Pressable key={item.id} onPress={() => onToggle(item.id)} style={styles.item}>
            <View style={[styles.box, checked && styles.boxChecked]}>
              {checked && <Text style={styles.check}>✓</Text>}
            </View>
            <Text style={[styles.text, checked && styles.textDone]}>{item.text(length)}</Text>
          </Pressable>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  pending: { borderColor: colors.highlight },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  item: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  check: { color: colors.onPrimary, fontWeight: '800', fontSize: 16 },
  text: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 21 },
  textDone: { color: colors.muted },
});
