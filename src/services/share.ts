import { t } from '../i18n';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import type { Report } from '../logic/report';

// Отчёт → файл .md во временной папке → системное меню «Поделиться» (сохранить, Telegram и т.д.).
export async function shareReport(report: Report): Promise<void> {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert(t('share.unavailable'));
      return;
    }
    const file = new File(Paths.cache, report.fileName);
    if (file.exists) file.delete();
    file.create();
    file.write(report.markdown);
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/markdown',
      UTI: 'net.daringfireball.markdown',
      dialogTitle: t('share.reportTitle'),
    });
  } catch {
    Alert.alert(t('share.reportFailed'));
  }
}
