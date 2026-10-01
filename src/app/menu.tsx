import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { DishImage } from '../components/food/DishImage';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { Button } from '../components/ui';
import { formatNum, restoreStandardMenu } from '../logic/food';
import { useStore } from '../store/AppStore';
import { colors, gap, radius } from '../theme';
import { getLang } from '../i18n';
import { dishName } from '../i18n/content';
import { useT } from '../i18n/useT';

// «Меню» (SPEC_v3_3 §C2): библиотека блюд — стандартные и свои.
export default function MenuScreen() {
  const t = useT();
  const { data, update } = useStore();
  const dishes = Object.values(data.food.dishes).sort((a, b) => dishName(a).localeCompare(dishName(b), getLang()));

  const restore = () =>
    Alert.alert(
      t('menu.restoreTitle'),
      t('menu.restoreText'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.restore'), style: 'destructive', onPress: () => update(restoreStandardMenu) },
      ],
    );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable
        onPress={() => router.push('/dish-edit')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.add, pressed && styles.pressed]}
      >
        <Icon name="plus" size={22} color={colors.onPrimary} />
        <Text style={styles.addText}>{t('menu.add')}</Text>
      </Pressable>
      {dishes.length === 0 && <Text style={styles.muted}>{t('menu.empty')}</Text>}
      {dishes.map((d) => (
        <Pressable
          key={d.id}
          onPress={() => router.push({ pathname: '/dish', params: { id: d.id } })}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <DishImage key={d.id} dish={d.id} style={styles.thumb} iconSize={24} />
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={2}>
              {dishName(d)}
            </Text>
            <Text style={styles.muted}>
              {t('food.kcalProtein', { kcal: formatNum(d.kcal), protein: d.protein })}
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color={colors.muted} />
        </Pressable>
      ))}
      <Button title={t('menu.restoreTitleShort')} variant="secondary" onPress={restore} style={styles.restore} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap, paddingBottom: 40 },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  addText: { fontSize: 17, fontWeight: '700', color: colors.onPrimary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  pressed: { opacity: 0.7 },
  thumb: { width: 64, height: 64, borderRadius: 14 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted, marginTop: 2 },
  restore: { marginTop: 8 },
});
