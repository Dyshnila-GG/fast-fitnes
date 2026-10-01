import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { Icon } from '../Icon';
import { Text } from '../Text';

// Кнопка «Назад» в шапке: стрелка и подпись (на Android у системной шапки подписи нет).
export function BackButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Назад"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="chevron-left" size={28} />
      <Text style={styles.text}>Назад</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', height: 44, paddingRight: 12, marginLeft: -6 },
  text: { fontSize: 17, fontWeight: '600', color: colors.text },
  pressed: { opacity: 0.6 },
});
