import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { NumInput } from '../components/form';
import { Button, Card } from '../components/ui';
import { useT } from '../i18n/useT';
import { parseNum } from '../logic/metrics';
import { inputNum } from '../i18n';
import { cmToIn, feetInches, heightCm, weightToLb, weightUnit, weightValue } from '../logic/units';
import { useSettings, useStore } from '../store/AppStore';
import { gap } from '../theme';

// Возраст, рост, стартовый вес. Рост: ft + in или cm; вес: lb или kg (хранение — дюймы и lb).
export default function PersonalScreen() {
  const t = useT();
  const { units } = useSettings();
  const metric = units === 'metric';
  const { data, update } = useStore();
  const p = data.profile;
  const fi = feetInches(p.heightIn);
  const [age, setAge] = useState(String(p.age));
  const [ft, setFt] = useState(String(fi.ft));
  const [inch, setInch] = useState(String(fi.inch));
  const [cm, setCm] = useState(inputNum(heightCm(p.heightIn)));
  const [start, setStart] = useState(inputNum(weightValue(p.startWeight)));

  const save = () => {
    const a = parseNum(age);
    const w = parseNum(start);
    let heightIn: number | undefined;
    if (metric) {
      const c = parseNum(cm);
      heightIn = c != null && c > 0 ? cmToIn(c) : undefined;
    } else {
      const f = parseNum(ft);
      const i = parseNum(inch) ?? 0;
      heightIn = f != null && f > 0 && i >= 0 && i < 12 ? f * 12 + i : undefined;
    }
    if (a == null || a <= 0 || heightIn == null || w == null || w <= 0) {
      return Alert.alert(t('personal.checkTitle'), t(metric ? 'personal.checkMetric' : 'personal.checkImperial'));
    }
    // Рост в см не меняли — храним прежние дюймы без потерь на округлении.
    const keepHeight = metric && parseNum(cm) === heightCm(p.heightIn);
    const keepWeight = parseNum(start) === weightValue(p.startWeight);
    update((d) => ({
      ...d,
      profile: { age: a, heightIn: keepHeight ? p.heightIn : heightIn!, startWeight: keepWeight ? p.startWeight : weightToLb(w) },
    }));
    Alert.alert(t('personal.saved'));
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <NumInput label={t('personal.age')} value={age} onChangeText={setAge} keyboardType="number-pad" />
          {metric ? (
            <NumInput label={t('personal.heightCm')} value={cm} onChangeText={setCm} keyboardType="number-pad" />
          ) : (
            <View style={styles.row}>
              <NumInput label={t('personal.heightFt')} value={ft} onChangeText={setFt} keyboardType="number-pad" />
              <NumInput label={t('personal.inches')} value={inch} onChangeText={setInch} />
            </View>
          )}
          <NumInput label={t('personal.startWeight', { u: weightUnit() })} value={start} onChangeText={setStart} />
          <Button title={t('common.save')} onPress={save} />
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
