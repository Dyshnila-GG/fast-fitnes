import { ScrollView, StyleSheet } from 'react-native';
import { StrengthList } from '../../components/workout/StrengthList';

// Current goal is hypertrophy: the training tab opens strength work directly.
// Historical run data is preserved in storage/imports but is not part of the active training UX.
export default function WorkoutsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <StrengthList />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
});
