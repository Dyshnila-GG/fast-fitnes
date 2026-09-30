import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme';

export const TILE_GAP = 12;

// Плитка «Главной»: ½ ширины (в ряду из двух) или вся ширина.
export function Tile({
  children,
  onPress,
  onLongPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.tile, pressed && onPress && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

// Ряд из двух плиток по ½.
export function TileRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  tile: { flex: 1, backgroundColor: colors.card, borderRadius: 28, padding: 16, gap: 6 },
  pressed: { opacity: 0.75 },
  row: { flexDirection: 'row', gap: TILE_GAP },
});
