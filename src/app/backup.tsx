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

// «primary:Documents/Backup» → «Documents/Backup»
const folderLabel = (uri: string) => decodeURIComponent(uri).split(':').pop() || uri;

// «Бэкап» (SPEC_v3_3 §B3): папка на телефоне, автобэкап раз в неделю, восстановление из файла.
export default function BackupScreen() {
  const { data, update } = useStore();
  const { backup } = data;

  const choose = async () => {
    const dirUri = await pickBackupDir();
    if (!dirUri) return;
    update((d) => withBackup(d, { dirUri, error: undefined }));
    if (runBackup({ ...data, backup: { dirUri } }, update)) Alert.alert('Папка выбрана', 'Первый бэкап сохранён.');
  };

  const now = () => {
    if (runBackup(data, update)) Alert.alert('Бэкап сохранён');
    else Alert.alert('Не удалось сохранить бэкап', 'Папка недоступна. Выберите папку заново.');
  };

  const restore = async () => {
    try {
      const text = await readBackupFile();
      if (text != null) confirmImport(text, data, update);
    } catch {
      Alert.alert('Не удалось прочитать файл');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {backupSupported ? (
        <Card style={styles.card}>
          <Text style={styles.label}>Папка на телефоне</Text>
          <View style={styles.folder}>
            <Icon name="folder-outline" size={24} color={backup.dirUri ? colors.text : colors.muted} />
            <Text style={[styles.folderText, !backup.dirUri && styles.mutedText]} numberOfLines={2}>
              {backup.dirUri ? folderLabel(backup.dirUri) : 'Не выбрана'}
            </Text>
          </View>
          {backup.error ? (
            <View style={styles.warning}>
              <Icon name="alert-circle-outline" size={20} color={colors.danger} />
              <Text style={styles.warningText}>{backup.error}</Text>
            </View>
          ) : null}
          <Button title={backup.dirUri ? 'Сменить папку' : 'Выбрать папку'} variant="secondary" onPress={choose} />
          <View style={styles.divider} />
          <Text style={styles.label}>Последний бэкап</Text>
          <Text style={styles.big}>
            {backup.lastAt ? `${formatDate(backup.lastAt)}, ${formatTime(backup.lastAt)}` : 'Ещё не было'}
          </Text>
          <Button title="Сделать бэкап сейчас" onPress={now} disabled={!backup.dirUri} />
          <Text style={styles.hint}>
            Автоматически раз в {BACKUP_EVERY_DAYS} дней при открытии приложения — файл TOCHKA-Fitness-backup_ГГГГ-ММ-ДД.json. Хранятся
            последние {BACKUP_KEEP}, старые удаляются.
          </Text>
        </Card>
      ) : (
        <Card>
          <Text style={styles.hint}>Автобэкап в папку доступен только на Android. Восстановить данные из файла можно и здесь.</Text>
        </Card>
      )}
      <Card style={styles.card}>
        <Text style={styles.title}>Восстановить из файла</Text>
        <Text style={styles.hint}>Выберите файл бэкапа. Перед заменой данных будет подтверждение.</Text>
        <Button title="Выбрать файл" variant="secondary" onPress={restore} />
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
