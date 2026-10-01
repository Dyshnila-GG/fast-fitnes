import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { TILE_GAP } from '../../components/home/Tile';
import { Icon, type IconName } from '../../components/Icon';
import { Text } from '../../components/Text';
import type { Key } from '../../i18n';
import { useT } from '../../i18n/useT';
import { colors } from '../../theme';

const KINDS: { title: Key; icon: IconName; href: Href }[] = [
  { title: 'nav.strength', icon: 'dumbbell', href: '/strength' },
  { title: 'nav.run_start', icon: 'run', href: '/run-start' },
];

const TILE_HEIGHT = 160;

// «Тренировки» (SPEC_v3_3 §A5): две плитки по ½ ширины в стиле «Главной»; списки — на следующем уровне.
export default function WorkoutsScreen() {
  const t = useT();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.row}>
        {KINDS.map((k) => (
          <Pressable
            key={k.title}
            onPress={() => router.push(k.href)}
            accessibilityRole="button"
            accessibilityLabel={t(k.title)}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
          >
            <View style={styles.top}>
              <View style={styles.badge}>
                <Icon name={k.icon} size={28} />
              </View>
              <Icon name="chevron-right" size={24} color={colors.muted} />
            </View>
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {t(k.title)}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  row: { flexDirection: 'row', gap: TILE_GAP },
  tile: {
    flex: 1,
    height: TILE_HEIGHT,
    borderRadius: 28,
    padding: 16,
    justifyContent: 'space-between',
    backgroundColor: colors.card,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.button,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
});
