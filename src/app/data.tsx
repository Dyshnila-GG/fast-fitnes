import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { Button, Card } from '../components/ui';
import { exportData } from '../logic/metrics';
import { confirmImport, describeData } from '../components/data/confirmImport';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';

export default function DataScreen() {
  const { data, update } = useStore();
  const [text, setText] = useState('');

  const share = () => {
    Share.share({ message: exportData(data), title: 'TOCHKA Fitness — резервная копия' }).catch(() =>
      Alert.alert('Не удалось открыть «Поделиться»'),
    );
  };

  const importData = () => confirmImport(text, data, update, () => setText(''));

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.title}>Экспорт</Text>
          <Text style={styles.muted}>Все данные одним JSON: {describeData(data)}. Сохраните его, например, в заметки или отправьте себе.</Text>
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
