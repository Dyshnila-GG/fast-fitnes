import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { colors } from '../../theme';
import type { TrainingDecision } from '../../logic/trainingEngine';
import type { Units } from '../../types';
import { weightUnit, weightValue } from '../../logic/units';

export function SetDecision({decision,units='imperial'}:{decision:TrainingDecision;units?:Units}) {
 const labels={HOLD:'Оставь вес',INCREASE:'Увеличь вес',DECREASE:'Снизь вес',REST_LONGER:'Отдохни дольше',STOP:'Останови упражнение'};
 const reasons={on_target:'Подход в целевом диапазоне.',too_easy:'Подход оказался слишком лёгким.',too_heavy:'Нагрузка слишком высокая.',short_rest:'Сначала увеличь отдых.',technique:'Вес не повышаем, пока техника не станет чистой.',other_muscle:'Вес тот же — сначала почувствуй целевую мышцу.',pain:'Боль — не продолжай это упражнение. Попробуй другой вариант или пропусти.',insufficient_data:'Заполни повторения и RIR.'};
 return <View style={styles.box}>
  <Text style={styles.title}>{labels[decision.type]}</Text>
  {decision.suggestedWeight!=null?<Text style={styles.value}>{weightValue(decision.suggestedWeight,units)} {weightUnit(units)}</Text>:null}
  {decision.suggestedRestSec!=null?<Text style={styles.value}>{decision.suggestedRestSec} сек</Text>:null}
  <Text style={styles.reason}>{reasons[decision.reason]}</Text>
 </View>;
}
const styles=StyleSheet.create({box:{padding:10,borderRadius:12,borderWidth:1,borderColor:colors.border,backgroundColor:colors.bg,gap:3},title:{fontSize:12,fontWeight:'800',color:colors.text},value:{fontSize:20,fontWeight:'800',color:colors.text},reason:{fontSize:12,color:colors.muted}});
