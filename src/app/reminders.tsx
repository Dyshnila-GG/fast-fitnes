import { Alert, Linking, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Icon, type IconName } from '../components/Icon';
import { Text } from '../components/Text';
import { TimeField } from '../components/TimeField';
import { Card } from '../components/ui';
import { GYM_TIME, setReminder, WAKE_TIME } from '../logic/reminders';
import { requestNotifications } from '../services/notifications';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import { PROGRAM } from '../data/program';
import { t as tr, weekdayShort } from '../i18n';
import { templateName } from '../i18n/content';
import { useT } from '../i18n/useT';

type Key = 'sleep' | 'workout';

// Тексты — на текущем языке; пример тренировки — по первой тренировке программы.
const items = (): { key: Key; title: string; icon: IconName; text: string; when: string }[] => [
  {
    key: 'sleep',
    title: tr('reminder.sleep.title'),
    icon: 'weather-night',
    text: tr('reminders.quote', { text: tr('reminder.sleep.body', { wake: WAKE_TIME }) }),
    when: tr('reminders.daily'),
  },
  {
    key: 'workout',
    title: tr('reminder.workout.title'),
    icon: 'dumbbell',
    text: tr('reminders.workoutExample', { text: tr('reminder.workout.body', { name: templateName(PROGRAM[0]), gym: GYM_TIME }) }),
    when: PROGRAM.map((p) => weekdayShort(p.weekday)).join(', '),
  },
];

// «Напоминания» (SPEC_v3_3 §B4): переключатель и время у каждого.
export default function RemindersScreen() {
  const t = useT();
  const { data, update } = useStore();

  const toggle = async (key: Key, on: boolean) => {
    if (on && !(await requestNotifications())) {
      Alert.alert(t('reminders.offTitle'), t('reminders.offText'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.settings'), onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    update((d) => setReminder(d, key, { on }));
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {items().map((item) => {
        const r = data.reminders[item.key];
        return (
          <Card key={item.key} style={styles.card}>
            <View style={styles.head}>
              <View style={styles.badge}>
                <Icon name={item.icon} size={22} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.muted}>{item.when}</Text>
              </View>
              <Switch
                value={r.on}
                onValueChange={(on) => toggle(item.key, on)}
                trackColor={{ false: colors.button, true: colors.primary }}
                thumbColor={r.on ? colors.onPrimary : colors.muted}
                ios_backgroundColor={colors.button}
              />
            </View>
            <View style={[styles.time, !r.on && styles.off]} pointerEvents={r.on ? 'auto' : 'none'}>
              <TimeField label={t('report.time')} value={r.time} onChange={(time) => update((d) => setReminder(d, item.key, { time }))} />
            </View>
            <Text style={styles.muted}>{item.text}</Text>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap, paddingBottom: 40 },
  card: { gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.button },
  flex: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  time: { paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  off: { opacity: 0.4 },
});
