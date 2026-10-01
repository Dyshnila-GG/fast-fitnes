import { ScrollView, StyleSheet } from 'react-native';
import { StrengthList } from '../components/workout/StrengthList';

// «Силовые»: Вт / Чт / Сб — длина, предпросмотр, «Начать».
export default function StrengthScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <StrengthList />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
});
