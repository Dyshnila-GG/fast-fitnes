import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/ui';
import { colors } from '../../theme';

export default function MetricsScreen() {
  return (
    <View style={styles.screen}>
      <Card>
        <Text style={styles.text}>Вес тела, замеры, история и прогресс появятся на этапе 5.</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  text: { fontSize: 16, color: colors.muted },
});
