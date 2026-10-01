import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import type { Report } from '../logic/report';

// Отчёт → файл .md во временной папке → системное меню «Поделиться» (сохранить, Telegram и т.д.).
export async function shareReport(report: Report): Promise<void> {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('«Поделиться» недоступно на этом устройстве');
      return;
    }
    const file = new File(Paths.cache, report.fileName);
    if (file.exists) file.delete();
    file.create();
    file.write(report.markdown);
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/markdown',
      UTI: 'net.daringfireball.markdown',
      dialogTitle: 'Отчёт по тренировке',
    });
  } catch {
    Alert.alert('Не удалось создать отчёт');
  }
}
