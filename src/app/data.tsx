import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet } from 'react-native';
import { Text, TextInput } from '../components/Text';
import { Button, Card } from '../components/ui';
import { exportData } from '../logic/metrics';
import { confirmImport, describeData } from '../components/data/confirmImport';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import { useT } from '../i18n/useT';

export default function DataScreen() {
  const t = useT();
  const { data, update } = useStore();
  const [text, setText] = useState('');

  const share = () => {
    Share.share({ message: exportData(data), title: t('data.shareTitle') }).catch(() =>
      Alert.alert(t('data.shareFailed')),
    );
  };

  const importData = () => confirmImport(text, data, update, () => setText(''));

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.title}>{t('data.export')}</Text>
          <Text style={styles.muted}>{t('data.exportText', { data: describeData(data) })}</Text>
          <Button title={t('data.share')} onPress={share} />
        </Card>
        <Card style={styles.card}>
          <Text style={styles.title}>{t('data.import')}</Text>
          <Text style={styles.muted}>{t('data.importText')}</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('data.paste')}
            placeholderTextColor={colors.muted}
            multiline
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.input}
          />
          <Button title={t('data.importButton')} variant="secondary" onPress={importData} disabled={text.trim() === ''} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap },
  card: { gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  input: {
    minHeight: 120,
    maxHeight: 240,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    fontSize: 13,
    color: colors.text,
    textAlignVertical: 'top',
  },
});
