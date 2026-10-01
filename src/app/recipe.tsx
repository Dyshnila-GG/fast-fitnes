import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { Icon } from '../components/Icon';
import { Button } from '../components/ui';
import { DISHES, type DishId } from '../data/food';
import { recipeOf, setRecipe } from '../logic/food';
import { useStore } from '../store/AppStore';
import { colors, radius } from '../theme';

// Рецепт блюда (SPEC_v3_2 §5.3): свой текст хранится по блюду и виден во всех приёмах и днях.
export default function RecipeScreen() {
  const { dish } = useLocalSearchParams<{ dish: DishId }>();
  const { data, update } = useStore();
  const [draft, setDraft] = useState<string | null>(null); // null — просмотр
  if (!dish || !(dish in DISHES)) return null;
  const recipe = recipeOf(data.food, dish);

  const save = () => {
    update((d) => setRecipe(d, dish, draft));
    setDraft(null);
  };
  const restore = () =>
    Alert.alert('Вернуть стандартный рецепт?', 'Ваш текст будет удалён.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Вернуть', style: 'destructive', onPress: () => update((d) => setRecipe(d, dish, null)) },
    ]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: DISHES[dish].name }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {draft == null ? (
          <>
            <View style={styles.tag}>
              <Icon name={recipe.custom ? 'pencil-outline' : 'book-open-variant-outline'} size={16} color={colors.muted} />
              <Text style={styles.tagText}>{recipe.custom ? 'Свой рецепт' : 'Стандартный рецепт'}</Text>
            </View>
            <Text style={styles.text} selectable>
              {recipe.text}
            </Text>
            <Button title="Изменить" onPress={() => setDraft(recipe.text)} />
            {recipe.custom && <Button title="Вернуть стандартный" variant="danger" onPress={restore} />}
          </>
        ) : (
          <>
            <Text style={styles.hint}>Продукты, количества, процесс — свободным текстом.</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              multiline
              autoFocus
              textAlignVertical="top"
              placeholder="Рецепт"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <View style={styles.row}>
              <Button title="Отмена" variant="secondary" onPress={() => setDraft(null)} style={styles.flex} />
              <Button title="Сохранить" onPress={save} style={styles.flex} />
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
