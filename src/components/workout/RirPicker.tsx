import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import { colors } from '../../theme';
import type { SetLog } from '../../types';

const VALUES: Array<0|1|2|3|4>=[4,3,2,1,0];

export function RirPicker({value,onChange}:{value?:SetLog['rir'];onChange:(v:SetLog['rir'])=>void}) {
  return <View style={styles.block}>
    <Text style={styles.label}>СКОЛЬКО ЧИСТЫХ ПОВТОРОВ ЕЩЁ МОГ?</Text>
    <View style={styles.row}>
      {VALUES.map(v=><Pressable key={v} onPress={()=>onChange(v)} style={[styles.pill,value===v&&styles.active]}>
        <Text style={[styles.text,value===v&&styles.activeText]}>{v===4?'4+':v}</Text>
      </Pressable>)}
    </View>
    <Text style={styles.hint}>RIR 2 = ещё примерно 2 повтора с чистой техникой.</Text>
  </View>;
}
const styles=StyleSheet.create({
 block:{gap:7},label:{fontSize:11,fontWeight:'700',letterSpacing:.4,color:colors.muted},
 row:{flexDirection:'row',gap:7},pill:{flex:1,minHeight:38,borderRadius:10,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center',backgroundColor:colors.bg},
 active:{backgroundColor:colors.text,borderColor:colors.text},text:{fontSize:15,fontWeight:'800',color:colors.text},activeText:{color:colors.bg},hint:{fontSize:12,color:colors.muted}
});
