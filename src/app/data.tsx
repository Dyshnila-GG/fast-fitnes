import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../components/Text';
import { Button, Card } from '../components/ui';
import { confirmImport, describeData } from '../components/data/confirmImport';
import { exportDataFile, readBackupFile } from '../services/backup';
import { useStore } from '../store/AppStore';
import { colors, gap } from '../theme';

export default function DataScreen() {
  const { data, update } = useStore();

  const exportFile = async () => {
    try {
      await exportDataFile(data);
    } catch {
      Alert.alert('Не удалось создать файл', 'Попробуй ещё раз.');
    }
  };

  const importFile = async () => {
    try {
      const text = await readBackupFile();
      if (text) confirmImport(text, data, update);
    } catch {
      Alert.alert('Не удалось открыть файл', 'Выбери JSON-файл экспорта TOCHKA.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.title}>Экспорт данных</Text>
        <Text style={styles.muted}>{describeData(data)}</Text>
        <Text style={styles.muted}>Создаёт файл TOCHKA-export-….json. Сохрани его на устройство через системное меню.</Text>
        <Button title="Скачать файл экспорта" onPress={exportFile} />
      </Card>
      <Card style={styles.card}>
        <Text style={styles.title}>Импорт данных</Text>
        <Text style={styles.muted}>Выбери JSON-файл из старого приложения. По умолчанию история добавится к текущим данным — новые тренировки, вес и замеры не удалятся.</Text>
        <Button title="Выбрать файл и импортировать" variant="secondary" onPress={importFile} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap },
  card: { gap: 12 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  muted: { fontSize: 14, lineHeight: 20, color: colors.muted },
});
