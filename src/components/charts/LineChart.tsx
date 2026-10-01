import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import type { Point } from '../../logic/metrics';
import { colors } from '../../theme';

type Props = {
  points: Point[]; // по возрастанию x
  unit: string; // «lb», «повт», «сек»
  formatDate: (date: string) => string;
  height?: number;
};

const PAD = { top: 12, right: 12, bottom: 22, left: 40 };
const DOTS_MAX = 30; // больше точек — рисуем только выбранную

// Простой линейный график: одна серия, тап/проведение пальцем выбирает ближайшую дату.
export function LineChart({ points, unit, formatDate, height = 180 }: Props) {
  const [width, setWidth] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  if (points.length === 0) {
    return <Text style={styles.empty}>Пока нет данных для графика.</Text>;
  }

  const index = picked != null && picked < points.length ? picked : points.length - 1;
  const current = points[index];

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  let y0 = Math.min(...ys);
  let y1 = Math.max(...ys);
  if (y0 === y1) {
    y0 -= 1;
    y1 += 1;
  }
  const padY = (y1 - y0) * 0.1;
  y0 -= padY;
  y1 += padY;

  const plotW = Math.max(1, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const sx = (x: number) => PAD.left + (x1 === x0 ? plotW / 2 : ((x - x0) / (x1 - x0)) * plotW);
  const sy = (y: number) => PAD.top + (1 - (y - y0) / (y1 - y0)) * plotH;

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  const ticks = [Math.min(...ys), (Math.min(...ys) + Math.max(...ys)) / 2, Math.max(...ys)];
  const uniqTicks = ticks.filter((t, i) => ticks.findIndex((u) => Math.abs(u - t) < 1e-9) === i);

  const pick = (locationX: number) => {
    let best = 0;
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(sx(points[i].x) - locationX) < Math.abs(sx(points[best].x) - locationX)) best = i;
    }
    setPicked(best);
  };

  return (
    <View style={styles.box}>
      <Text style={styles.readout}>
        <Text style={styles.value}>
          {fmt(current.y)} {unit}
        </Text>
        <Text style={styles.date}> · {formatDate(current.date)}</Text>
      </Text>
      <View
        style={{ height }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => pick(e.nativeEvent.locationX)}
        onResponderMove={(e) => pick(e.nativeEvent.locationX)}
      >
        {width > 0 && (
          <Svg width={width} height={height}>
            {uniqTicks.map((t) => (
              <Line key={`g${t}`} x1={PAD.left} x2={width - PAD.right} y1={sy(t)} y2={sy(t)} stroke={colors.border} strokeWidth={1} />
            ))}
            {uniqTicks.map((t) => (
              <SvgText key={`l${t}`} x={PAD.left - 6} y={sy(t) + 4} fill={colors.muted} fontSize={11} textAnchor="end">
                {fmt(t)}
              </SvgText>
            ))}
            <SvgText x={PAD.left} y={height - 6} fill={colors.muted} fontSize={11} textAnchor="start">
              {formatDate(points[0].date)}
            </SvgText>
            {points.length > 1 && (
              <SvgText x={width - PAD.right} y={height - 6} fill={colors.muted} fontSize={11} textAnchor="end">
                {formatDate(points[points.length - 1].date)}
              </SvgText>
            )}
            <Line
              x1={sx(current.x)}
              x2={sx(current.x)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke={colors.muted}
              strokeWidth={1}
            />
            {points.length > 1 && (
              <Path d={path} stroke={colors.text} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            )}
            {points.length <= DOTS_MAX &&
              points.map((p, i) => (
                <Circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4} fill={colors.text} stroke={colors.card} strokeWidth={2} />
              ))}
            <Circle cx={sx(current.x)} cy={sy(current.y)} r={6} fill={colors.text} stroke={colors.card} strokeWidth={2} />
          </Svg>
        )}
      </View>
    </View>
  );
}

const fmt = (n: number) => String(Math.round(n * 10) / 10);

const styles = StyleSheet.create({
  box: { gap: 6 },
  readout: { fontVariant: ['tabular-nums'] },
  value: { fontSize: 22, fontWeight: '800', color: colors.text },
  date: { fontSize: 14, color: colors.muted },
  empty: { fontSize: 15, color: colors.muted },
});
