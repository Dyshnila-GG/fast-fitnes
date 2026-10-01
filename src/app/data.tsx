import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { Button, Card } from '../components/ui';
import { exportData, finishedSessions, parseImport } from '../logic/metrics';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import type { AppData } from '../types';

const describe = (d: AppData) =>
  `тренировок: ${finishedSessions(d.sessions).length}, записей веса: ${d.bodyWeight.length}, замеров: ${d.measurements.length}, ` +
  `дней с отметками еды: ${Object.keys(d.food.eaten).length}, ночей сна: ${Object.keys(d.sleep).length}, пробежек: ${Object.keys(d.runs).length}`;

export default function DataScreen() {
  const { data, update } = useStore();
  const [text, setText] = useState('');

  const share = () => {
    Share.share({ message: exportData(data), title: 'TOCHKA Fitness — резервная копия' }).catch(() =>
      Alert.alert('Не удалось открыть «Поделиться»'),
    );
  };

  const importData = () => {
    const res = parseImport(text);
    if (!res.ok) return Alert.alert('Импорт невозможен', res.error);
    Alert.alert('Заменить все данные?', `Сейчас: ${describe(data)}.\nВ копии: ${describe(res.data)}.`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Заменить',
        style: 'destructive',
        onPress: () => {
          update(() => res.data);
          setText('');
          Alert.alert('Данные импортированы');
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.title}>Экспорт</Text>
          <Text style={styles.muted}>Все данные одним JSON: {describe(data)}. Сохраните его, например, в заметки или отправьте себе.</Text>
          <Button title="Поделиться" onPress={share} />
        </Card>
        <Card style={styles.card}>
          <Text style={styles.title}>Импорт</Text>
          <Text style={styles.muted}>Вставьте JSON из экспорта. Текущие данные будут заменены.</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Вставьте JSON"
            placeholderTextColor={colors.muted}
            multiline
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.input}
          />
          <Button title="Импортировать" variant="secondary" onPress={importData} disabled={text.trim() === ''} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap },
  card: { gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  input: {
    minHeight: 120,
    maxHeight: 240,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    fontSize: 13,
    color: colors.text,
    textAlignVertical: 'top',
  },
});
