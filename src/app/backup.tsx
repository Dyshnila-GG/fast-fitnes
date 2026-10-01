import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { confirmImport } from '../components/data/confirmImport';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { Button, Card } from '../components/ui';
import { BACKUP_EVERY_DAYS, BACKUP_KEEP, withBackup } from '../logic/backup';
import { formatDate, formatTime } from '../logic/format';
import { backupSupported, pickBackupDir, readBackupFile, runBackup } from '../services/backup';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';
import { useT } from '../i18n/useT';
import { tp } from '../i18n';

// «primary:Documents/Backup» → «Documents/Backup»
const folderLabel = (uri: string) => decodeURIComponent(uri).split(':').pop() || uri;

// «Бэкап» (SPEC_v3_3 §B3): папка на телефоне, автобэкап раз в неделю, восстановление из файла.
export default function BackupScreen() {
  const t = useT();
  const { data, update } = useStore();
  const { backup } = data;

  const choose = async () => {
    const dirUri = await pickBackupDir();
    if (!dirUri) return;
    update((d) => withBackup(d, { dirUri, error: undefined }));
    if (runBackup({ ...data, backup: { dirUri } }, update)) Alert.alert(t('backup.picked'), t('backup.firstSaved'));
  };

  const now = () => {
    if (runBackup(data, update)) Alert.alert(t('backup.saved'));
    else Alert.alert(t('backup.failed'), t('backup.failedText'));
  };

  const restore = async () => {
    try {
      const text = await readBackupFile();
      if (text != null) confirmImport(text, data, update);
    } catch {
      Alert.alert(t('backup.readFailed'));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {backupSupported ? (
        <Card style={styles.card}>
          <Text style={styles.label}>{t('backup.folder')}</Text>
          <View style={styles.folder}>
            <Icon name="folder-outline" size={24} color={backup.dirUri ? colors.text : colors.muted} />
            <Text style={[styles.folderText, !backup.dirUri && styles.mutedText]} numberOfLines={2}>
              {backup.dirUri ? folderLabel(backup.dirUri) : t('backup.notPicked')}
            </Text>
          </View>
          {backup.error ? (
            <View style={styles.warning}>
              <Icon name="alert-circle-outline" size={20} color={colors.danger} />
              <Text style={styles.warningText}>{t('backup.dirError')}</Text>
            </View>
          ) : null}
          <Button title={t(backup.dirUri ? 'backup.changeFolder' : 'backup.pickFolder')} variant="secondary" onPress={choose} />
          <View style={styles.divider} />
          <Text style={styles.label}>{t('backup.last')}</Text>
          <Text style={styles.big}>
            {backup.lastAt ? `${formatDate(backup.lastAt)}, ${formatTime(backup.lastAt)}` : t('backup.never')}
          </Text>
          <Button title={t('backup.now')} onPress={now} disabled={!backup.dirUri} />
          <Text style={styles.hint}>
            {t('backup.hint', { days: tp('days', BACKUP_EVERY_DAYS), files: tp('count.files', BACKUP_KEEP) })}
          </Text>
        </Card>
      ) : (
        <Card>
          <Text style={styles.hint}>{t('backup.androidOnly')}</Text>
        </Card>
      )}
      <Card style={styles.card}>
        <Text style={styles.title}>{t('backup.restore')}</Text>
        <Text style={styles.hint}>{t('backup.restoreHint')}</Text>
        <Button title={t('backup.pickFile')} variant="secondary" onPress={restore} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap, paddingBottom: 40 },
  card: { gap: 12 },
  label: { fontSize: 13, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  folder: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  folderText: { flex: 1, fontSize: 17, fontWeight: '600', color: colors.text },
  mutedText: { color: colors.muted },
  big: { fontSize: 22, fontWeight: '800', color: colors.text },
  hint: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 4 },
  warning: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  warningText: { flex: 1, fontSize: 14, color: colors.danger, lineHeight: 20 },
});
