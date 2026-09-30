import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { DayPicker, NumInput } from '../components/form';
import { Button, Card } from '../components/ui';
import { addBodyWeight, dayKey, latestFirst, parseNum } from '../logic/metrics';
import { useStore } from '../store/AppStore';
import { gap } from '../theme';

// Модалка с «Главной»: ввод веса тела.
export default function WeightAddScreen() {
  const { data, update } = useStore();
  const [text, setText] = useState('');
  const [day, setDay] = useState(dayKey());
  const last = latestFirst(data.bodyWeight)[0];

  const save = () => {
    const value = parseNum(text);
    if (value == null || value <= 0) return Alert.alert('Введите вес в lb');
    update((d) => addBodyWeight(d, day, value));
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <NumInput
            label="Вес, lb"
            value={text}
            onChangeText={setText}
            placeholder={String(last?.value ?? data.profile.startWeight)}
            autoFocus
          />
          <DayPicker value={day} onChange={setDay} />
        </Card>
        <Button title="Сохранить" onPress={save} />
        <Button title="Вся история веса" variant="secondary" onPress={() => router.replace('/weight')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap },
  card: { gap: 12 },
});
