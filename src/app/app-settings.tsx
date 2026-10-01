import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { LANG_NAMES, LANGS, type Key } from '../i18n';
import { useT } from '../i18n/useT';
import { useStore } from '../store/AppStore';
import { colors, gap, radius } from '../theme';
import type { Settings, Units } from '../types';

const UNITS: { id: Units; hint: Key }[] = [
  { id: 'imperial', hint: 'settings.imperialHint' },
  { id: 'metric', hint: 'settings.metricHint' },
];

// «Настройки приложения» (SPEC_v3_3 §D1): язык и единицы — применяются сразу, без перезапуска.
export default function AppSettingsScreen() {
  const t = useT();
  const { data, update } = useStore();
  const { settings } = data;
  const set = (patch: Partial<Settings>) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.section}>{t('settings.language')}</Text>
      <View style={styles.group}>
        {LANGS.map((lang, i) => (
          <Option key={lang} title={LANG_NAMES[lang]} active={settings.lang === lang} first={i === 0} onPress={() => set({ lang })} />
        ))}
      </View>

      <Text style={styles.section}>{t('settings.unitsTitle')}</Text>
      <View style={styles.group}>
        {UNITS.map((u, i) => (
          <Option
            key={u.id}
            title={t(`settings.units.${u.id}`)}
            hint={t(u.hint)}
            active={settings.units === u.id}
            first={i === 0}
            onPress={() => set({ units: u.id })}
          />
        ))}
      </View>
      <Text style={styles.note}>{t('settings.note')}</Text>
    </ScrollView>
  );
}

function Option({ title, hint, active, first, onPress }: { title: string; hint?: string; active: boolean; first: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.option, !first && styles.border, pressed && styles.pressed]}
    >
      <View style={styles.flex}>
        <Text style={[styles.title, !active && styles.inactive]}>{title}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <View style={[styles.radio, active && styles.radioOn]}>{active && <Icon name="check" size={16} color={colors.onPrimary} />}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap, paddingBottom: 40 },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 8, marginLeft: 4 },
  group: { borderRadius: radius, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: 18, paddingVertical: 12 },
  border: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { opacity: 0.7 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  inactive: { color: colors.muted },
  hint: { fontSize: 13, color: colors.muted, marginTop: 2 },
  radio: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.highlight, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  note: { fontSize: 13, color: colors.muted, lineHeight: 19, marginHorizontal: 4 },
});
