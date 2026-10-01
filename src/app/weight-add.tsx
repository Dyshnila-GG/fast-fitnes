import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { DayPicker, NumInput } from '../components/form';
import { Button, Card } from '../components/ui';
import { addBodyWeight, dayKey, latestFirst, parseNum } from '../logic/metrics';
import { useStore } from '../store/AppStore';
import { gap } from '../theme';
import { weightToLb, weightUnit, weightValue } from '../logic/units';
import { useT } from '../i18n/useT';

// Модалка с «Главной»: ввод веса тела.
export default function WeightAddScreen() {
  const t = useT();
  const { data, update } = useStore();
  const [text, setText] = useState('');
  const [day, setDay] = useState(dayKey());
  const last = latestFirst(data.bodyWeight)[0];

  const save = () => {
    const value = parseNum(text);
    if (value == null || value <= 0) return Alert.alert(t('weight.enter', { u: weightUnit() }));
    update((d) => addBodyWeight(d, day, weightToLb(value)));
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <NumInput
            label={t('weight.label', { u: weightUnit() })}
            value={text}
            onChangeText={setText}
            placeholder={String(weightValue(last?.value ?? data.profile.startWeight))}
            autoFocus
          />
          <DayPicker value={day} onChange={setDay} />
        </Card>
        <Button title={t('common.save')} onPress={save} />
        <Button title={t('weight.history')} variant="secondary" onPress={() => router.replace('/weight')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap },
  card: { gap: 12 },
});
