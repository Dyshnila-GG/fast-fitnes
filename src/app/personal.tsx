import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { NumInput } from '../components/form';
import { Button, Card } from '../components/ui';
import { parseNum } from '../logic/metrics';
import { useStore } from '../store/AppStore';
import { gap } from '../theme';

export default function PersonalScreen() {
  const { data, update } = useStore();
  const p = data.profile;
  const [age, setAge] = useState(String(p.age));
  const [ft, setFt] = useState(String(Math.floor(p.heightIn / 12)));
  const [inch, setInch] = useState(String(Math.round((p.heightIn % 12) * 10) / 10));
  const [start, setStart] = useState(String(p.startWeight));

  const save = () => {
    const a = parseNum(age);
    const f = parseNum(ft);
    const i = parseNum(inch) ?? 0;
    const w = parseNum(start);
    if (a == null || a <= 0 || f == null || f <= 0 || i < 0 || i >= 12 || w == null || w <= 0) {
      return Alert.alert('Проверьте значения', 'Возраст, рост (фут и дюймы 0–11) и стартовый вес должны быть числами.');
    }
    update((d) => ({ ...d, profile: { age: a, heightIn: f * 12 + i, startWeight: w } }));
    Alert.alert('Профиль сохранён');
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <NumInput label="Возраст" value={age} onChangeText={setAge} keyboardType="number-pad" />
          <View style={styles.row}>
            <NumInput label="Рост, фут" value={ft} onChangeText={setFt} keyboardType="number-pad" />
            <NumInput label="дюймы" value={inch} onChangeText={setInch} />
          </View>
          <NumInput label="Стартовый вес, lb" value={start} onChangeText={setStart} />
          <Button title="Сохранить" onPress={save} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap },
  card: { gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
});
