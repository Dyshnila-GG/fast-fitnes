import { t } from '../../i18n';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

// Своё фото блюда: камера или галерея, копия — в постоянную папку приложения (кэш пикера система может очистить).

async function savePhoto(pickedUri: string): Promise<string> {
  const dir = new Directory(Paths.document, 'food-photos');
  if (!dir.exists) dir.create({ intermediates: true });
  const dest = new File(dir, `dish-${Date.now()}.jpg`);
  await new File(pickedUri).copy(dest);
  return dest.uri;
}

export function removePhotoFile(uri: string | undefined) {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {}
}

async function pick(source: 'camera' | 'library'): Promise<string | null> {
  const perm =
    source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(t('photo.noAccess'), t(source === 'camera' ? 'photo.allowCamera' : 'photo.allowLibrary'));
    return null;
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', allowsEditing: true, aspect: [4, 3], quality: 0.7 };
  const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (res.canceled) return null;
  try {
    return await savePhoto(res.assets[0].uri);
  } catch {
    Alert.alert(t('photo.saveFailed'));
    return null;
  }
}

// Меню «Сфотографировать / Из галереи»; onPicked — путь к сохранённому файлу.
export function choosePhoto(title: string, onPicked: (uri: string) => void) {
  const run = (source: 'camera' | 'library') => pick(source).then((uri) => uri && onPicked(uri));
  Alert.alert(t('photo.title'), title, [
    { text: t('photo.camera'), onPress: () => run('camera') },
    { text: t('photo.library'), onPress: () => run('library') },
    { text: t('common.cancel'), style: 'cancel' },
  ]);
}
