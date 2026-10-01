import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text, TextInput } from '../Text';
import { colors } from '../../theme';
import { useT } from '../../i18n/useT';

// «Заметка» — необязательная, свёрнута до тапа.
export function NoteField({ value, onChange }: { value?: string; onChange: (text: string | undefined) => void }) {
  const t = useT();
  const [open, setOpen] = useState(!!value);
  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} hitSlop={6}>
        <Text style={styles.toggle}>+ {t('note.title')}</Text>
      </Pressable>
    );
  }
  return (
    <TextInput
      value={value ?? ''}
      onChangeText={(t) => onChange(t || undefined)}
      placeholder={t('note.title')}
      placeholderTextColor={colors.muted}
      multiline
      autoFocus={!value}
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  toggle: { fontSize: 15, color: colors.muted, fontWeight: '600', paddingVertical: 4 },
  input: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
});
