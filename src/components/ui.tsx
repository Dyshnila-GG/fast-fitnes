import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  small?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, variant = 'primary', small, disabled, style }: ButtonProps) {
  const bg = variant === 'primary' ? colors.primary : colors.button;
  const fg = variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, small && styles.buttonTextSmall, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.segment, active && styles.segmentActive]}>
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius, padding: 18, borderWidth: 1, borderColor: colors.border },
  button: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  buttonSmall: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12 },
  buttonText: { fontSize: 17, fontWeight: '600' },
  buttonTextSmall: { fontSize: 14 },
  segmented: { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: 14, padding: 3, borderWidth: 1, borderColor: colors.border },
  segment: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.button },
  segmentText: { fontSize: 14, color: colors.muted, fontWeight: '500' },
  segmentTextActive: { color: colors.text, fontWeight: '600' },
});
