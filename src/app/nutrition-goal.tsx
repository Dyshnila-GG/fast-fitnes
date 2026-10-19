import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../components/Text';
import { NumInput } from '../components/form';
import { Button, Card, Segmented } from '../components/ui';
import { formatNum } from '../logic/food';
import { dayKey } from '../logic/metrics';
import { KCAL_PER_LB, NUTRITION_MODES, nutritionTarget, setNutrition } from '../logic/v4';
import { formatWeight } from '../logic/format';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import type { NutritionMode } from '../types';

// Цель питания (handoff §19). Fast Gain — не «жиреть без контроля»: если талия и пресс на месте,
// а сила растёт, формула сама набор не тормозит. Тормоз — сигнал «Замечаю лишний жир».
export default function NutritionGoalScreen() {
  const { data, update } = useStore();
  const target = nutritionTarget(data, dayKey());
  const [protein, setProtein] = useState(String(data.v4.nutrition.proteinG));
  const [kcal, setKcal] = useState(data.v4.nutrition.kcalOverride ? String(data.v4.nutrition.kcalOverride) : '');

  const save = () => {
    const p = Number(protein.replace(',', '.'));
    const k = Number(kcal.replace(',', '.'));
    update((d) =>
      setNutrition(d, {
        proteinG: Number.isFinite(p) && p > 0 ? Math.round(p) : d.v4.nutrition.proteinG,
        kcalOverride: Number.isFinite(k) && k > 0 ? Math.round(k) : undefined,
      }),
    );
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.big}>{formatNum(target.kcal)} ккал · {target.protein} г белка</Text>
          <Text style={styles.muted}>
            Поддержка ≈ {formatNum(target.maintenance)} ккал (тренд веса {formatWeight(target.weightLb)} × {KCAL_PER_LB} — оценка при высокой активности).
          </Text>
          <Segmented<NutritionMode>
            options={NUTRITION_MODES.map((m) => ({ value: m.value, label: m.label }))}
            value={data.v4.nutrition.mode}
            onChange={(mode) => update((d) => setNutrition(d, { mode }))}
          />
          <Text style={styles.muted}>Maintain — без профицита · Lean Gain — +250 ккал · Fast Gain — +500 ккал.</Text>
        </Card>

        {target.excessFat && target.mode === 'fast_gain' ? (
          <Card style={styles.warn}>
            <Text style={styles.warnTitle}>Ты отметил лишний жир за последние 2 недели</Text>
            <Text style={styles.muted}>Предлагаю Lean Gain: набор продолжается, но медленнее.</Text>
            <Button title="Перейти на Lean Gain" onPress={() => update((d) => setNutrition(d, { mode: 'lean_gain' }))} />
          </Card>
        ) : null}

        <Card style={styles.card}>
          <NumInput label="Белок в день, г" value={protein} onChangeText={setProtein} placeholder="150" />
          <NumInput label="Калории вручную (пусто — по формуле)" value={kcal} onChangeText={setKcal} placeholder={String(target.maintenance)} />
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
  big: { fontSize: 24, fontWeight: '800', color: colors.text },
  muted: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  warn: { gap: 10, borderColor: '#FF9F0A' },
  warnTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
});
