import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { startRun } from '../logic/run';
import { useStore } from '../store/AppStore';
import { colors } from '../theme';

// «Пробежка» (SPEC_v3_3 §A5): одна большая кнопка «Начать пробежку», без счётчика недели.
export default function RunStartScreen() {
  const { update } = useStore();
  return (
    <View style={styles.content}>
      <Pressable
        onPress={() => update((d) => startRun(d))}
        accessibilityRole="button"
        style={({ pressed }) => [styles.start, pressed && styles.pressed]}
      >
        <Icon name="run" size={56} color={colors.onPrimary} />
        <Text style={styles.text}>Начать пробежку</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16, justifyContent: 'center' },
  start: {
    minHeight: 220,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: colors.primary,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  text: { fontSize: 28, fontWeight: '800', color: colors.onPrimary, letterSpacing: -0.5 },
});
