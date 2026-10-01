import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../../components/Icon';
import { RunPanel } from '../../components/workout/RunPanel';
import { StrengthList } from '../../components/workout/StrengthList';
import { colors, gap } from '../../theme';

type Kind = 'strength' | 'run';

const KINDS: { id: Kind; title: string; icon: IconName }[] = [
  { id: 'strength', title: 'Силовые', icon: 'dumbbell' },
  { id: 'run', title: 'Пробежка', icon: 'run' },
];

// «Тренировки» (SPEC_v3_2 §4): сверху выбор «Силовые / Пробежка».
export default function WorkoutsScreen() {
  const [kind, setKind] = useState<Kind>('strength');

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.tiles}>
        {KINDS.map((k) => {
          const active = k.id === kind;
          return (
            <Pressable
              key={k.id}
              onPress={() => setKind(k.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [styles.tile, active && styles.tileActive, pressed && styles.pressed]}
            >
              <Icon name={k.icon} size={30} color={active ? colors.onPrimary : colors.muted} />
              <Text style={[styles.tileText, active && styles.tileTextActive]}>{k.title}</Text>
            </Pressable>
          );
        })}
      </View>
      {kind === 'strength' ? <StrengthList /> : <RunPanel />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap },
  tiles: { flexDirection: 'row', gap },
  tile: {
    flex: 1,
    minHeight: 104,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.75 },
  tileText: { fontSize: 20, fontWeight: '700', color: colors.muted },
  tileTextActive: { color: colors.onPrimary },
});
