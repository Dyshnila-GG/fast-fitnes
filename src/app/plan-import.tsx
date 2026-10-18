import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { installPlanPack } from '../logic/planInstall';
import { parsePlanPack, type TochkaPlanPack } from '../planPack';
import { useStore } from '../store/AppStore';
import { colors } from '../theme';

export default function PlanImportScreen() {
  const { data, update } = useStore();
  const [candidate, setCandidate] = useState<TochkaPlanPack | null>(null);
  const [error, setError] = useState<string>();

  const pick = async () => {
    setError(undefined);
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
    if (result.canceled) return;
    try {
      const raw = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const parsed = parsePlanPack(JSON.parse(raw));
      if (!parsed.ok) throw new Error(parsed.error);
      setCandidate(parsed.pack);
    } catch (e) {
      setCandidate(null);
      setError(e instanceof Error ? e.message : 'Не удалось прочитать файл');
    }
  };

  const install = () => {
    if (!candidate) return;
    update((d) => installPlanPack(d, candidate));
    setCandidate(null);
  };

  const installed = data.installedPlan?.pack;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Plan Pack</Text>
      <Text style={styles.muted}>Тренировки, питание и настройки можно загрузить одним .tochka файлом. История и личные результаты не заменяются.</Text>
      {installed ? (
        <View style={styles.card}>
          <Text style={styles.label}>УСТАНОВЛЕН</Text>
          <Text style={styles.name}>{installed.title}</Text>
          <Text style={styles.muted}>v{installed.version}{installed.author ? ` · ${installed.author}` : ''}</Text>
        </View>
      ) : null}
      <Pressable style={styles.button} onPress={pick}><Text style={styles.buttonText}>Выбрать .tochka файл</Text></Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {candidate ? (
        <View style={styles.card}>
          <Text style={styles.label}>ГОТОВ К ИМПОРТУ</Text>
          <Text style={styles.name}>{candidate.title}</Text>
          {candidate.description ? <Text style={styles.muted}>{candidate.description}</Text> : null}
          <Text style={styles.muted}>
            {candidate.training?.workouts.length ?? 0} тренировок · {candidate.nutrition?.recipes?.length ?? 0} рецептов
          </Text>
          <Pressable style={styles.primary} onPress={install}><Text style={styles.primaryText}>Импортировать и настроить</Text></Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles=StyleSheet.create({
  content:{padding:16,gap:16},
  title:{fontSize:30,fontWeight:'800',color:colors.text},
  muted:{color:colors.muted,lineHeight:21},
  card:{backgroundColor:colors.card,borderColor:colors.border,borderWidth:1,borderRadius:24,padding:18,gap:8},
  label:{fontSize:12,color:colors.muted,fontWeight:'700'},
  name:{fontSize:20,fontWeight:'700',color:colors.text},
  button:{backgroundColor:colors.card,borderColor:colors.border,borderWidth:1,borderRadius:18,padding:16},
  buttonText:{color:colors.text,fontWeight:'700',textAlign:'center'},
  primary:{backgroundColor:colors.text,borderRadius:18,padding:16,marginTop:8},
  primaryText:{color:colors.bg,fontWeight:'800',textAlign:'center'},
  error:{color:'#FF453A'}
});
