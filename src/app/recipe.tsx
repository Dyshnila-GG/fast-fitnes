import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { Icon } from '../components/Icon';
import { Button } from '../components/ui';
import type { DishId } from '../data/food';
import { dishOf, recipeOf, setRecipe } from '../logic/food';
import { useStore } from '../store/AppStore';
import { colors, radius } from '../theme';
import { dishName } from '../i18n/content';
import { useT } from '../i18n/useT';

// Рецепт блюда (SPEC_v3_2 §5.3): свой текст хранится по блюду и виден во всех приёмах и днях.
export default function RecipeScreen() {
  const t = useT();
  const { dish } = useLocalSearchParams<{ dish: DishId }>();
  const { data, update } = useStore();
  const [draft, setDraft] = useState<string | null>(null); // null — просмотр
  const d = dish ? dishOf(data.food, dish) : undefined;
  if (!dish || !d) return null;
  const recipe = recipeOf(data.food, dish);

  const save = () => {
    update((d) => setRecipe(d, dish, draft));
    setDraft(null);
  };
  const restore = () =>
    Alert.alert(t('recipe.restoreTitle'), t('recipe.restoreText'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('recipe.restoreConfirm'), style: 'destructive', onPress: () => update((d) => setRecipe(d, dish, null)) },
    ]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: dishName(d) }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {draft == null ? (
          <>
            <View style={styles.tag}>
              <Icon name={recipe.custom ? 'pencil-outline' : 'book-open-variant-outline'} size={16} color={colors.muted} />
              <Text style={styles.tagText}>{t(recipe.custom || !d.steps ? 'recipe.own' : 'recipe.standard')}</Text>
            </View>
            <Text style={[styles.text, !recipe.text && styles.hint]} selectable>
              {recipe.text || t('recipe.none')}
            </Text>
            <Button title={t(recipe.text ? 'common.change' : 'recipe.add')} onPress={() => setDraft(recipeOf(data.food, dish, false).text)} />
            {recipe.custom && d.steps && <Button title={t('recipe.restore')} variant="danger" onPress={restore} />}
          </>
        ) : (
          <>
            <Text style={styles.hint}>{t('recipe.hint')}</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              multiline
              autoFocus
              textAlignVertical="top"
              placeholder={t('recipe.placeholder')}
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <View style={styles.row}>
              <Button title={t('common.cancel')} variant="secondary" onPress={() => setDraft(null)} style={styles.flex} />
              <Button title={t('common.save')} onPress={save} style={styles.flex} />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  text: { fontSize: 20, lineHeight: 31, color: colors.text },
  hint: { fontSize: 14, color: colors.muted },
  input: {
    minHeight: 280,
    borderRadius: radius,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    fontSize: 18,
    lineHeight: 26,
    color: colors.text,
  },
  row: { flexDirection: 'row', gap: 10 },
});
