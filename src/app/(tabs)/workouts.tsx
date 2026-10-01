import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, type IconName } from '../../components/Icon';
import { Text } from '../../components/Text';
import { colors, gap } from '../../theme';

const KINDS: { title: string; icon: IconName; href: Href }[] = [
  { title: 'Силовые', icon: 'dumbbell', href: '/strength' },
  { title: 'Пробежка', icon: 'run', href: '/run-start' },
];

// «Тренировки» (SPEC_v3_3 §A5): только две большие плитки; списки — на следующем уровне.
export default function WorkoutsScreen() {
  return (
    <View style={styles.content}>
      {KINDS.map((k) => (
        <Pressable
          key={k.title}
          onPress={() => router.push(k.href)}
          accessibilityRole="button"
          accessibilityLabel={k.title}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <View style={styles.badge}>
            <Icon name={k.icon} size={40} />
          </View>
          <View style={styles.bottom}>
            <Text style={styles.title}>{k.title}</Text>
            <Icon name="arrow-right" size={28} color={colors.muted} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16, gap },
  tile: {
    flex: 1,
    maxHeight: 280,
    borderRadius: 32,
    padding: 24,
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.button,
  },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  title: { fontSize: 40, fontWeight: '800', color: colors.text, letterSpacing: -1 },
});
