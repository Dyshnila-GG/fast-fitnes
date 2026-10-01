import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { fromMinutes, toMinutes } from '../logic/time';
import { colors } from '../theme';

const toDate = (time: string) => {
  const d = new Date();
  d.setHours(0, toMinutes(time), 0, 0);
  return d;
};
const fromDate = (d: Date) => fromMinutes(d.getHours() * 60 + d.getMinutes());

// Выбор времени «HH:MM»: Android — системный диалог, iOS — компактный пикер.
export function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (time: string) => void }) {
  const open = () =>
    DateTimePickerAndroid.open({
      value: toDate(value),
      mode: 'time',
      is24Hour: true,
      onValueChange: (_, date) => onChange(fromDate(date)),
    });

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={toDate(value)}
          mode="time"
          display="compact"
          locale="ru-RU"
          themeVariant="dark"
          onValueChange={(_, date) => onChange(fromDate(date))}
        />
      ) : (
        <Pressable onPress={open} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.value}>{value}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  label: { fontSize: 16, color: colors.text },
  button: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.button },
  pressed: { opacity: 0.7 },
  value: { fontSize: 20, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
});
