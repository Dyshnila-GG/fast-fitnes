import { createContext, useContext, type Ref } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { colors } from '../theme';

// Manrope (SPEC_v3_3 §A3): у своего шрифта на Android fontWeight не выбирает начертание,
// поэтому вес переводится в отдельное семейство. Обычный текст — 500, серые подписи — 400.
export const FONT = {
  400: 'Manrope_400Regular',
  500: 'Manrope_500Medium',
  600: 'Manrope_600SemiBold',
  700: 'Manrope_700Bold',
  800: 'Manrope_800ExtraBold',
} as const;

export function fontFamily(weight: TextStyle['fontWeight'], color?: unknown): string {
  switch (String(weight ?? '')) {
    case '100':
    case '200':
    case '300':
    case '400':
    case 'normal':
      return FONT[400];
    case '600':
      return FONT[600];
    case '700':
    case 'bold':
      return FONT[700];
    case '800':
    case '900':
      return FONT[800];
    case '500':
      return FONT[500];
    default:
      return color === colors.muted ? FONT[400] : FONT[500];
  }
}

// Вложенный текст без своего веса наследует шрифт родителя.
const Nested = createContext(false);

function fontStyle(style: TextProps['style'], nested: boolean) {
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return style;
  if (nested && flat.fontWeight == null) return style;
  const { fontWeight: _weight, ...rest } = flat;
  return [{ fontFamily: fontFamily(flat.fontWeight, flat.color) }, rest];
}

export function Text({ style, ...props }: TextProps & { ref?: Ref<RNText> }) {
  const nested = useContext(Nested);
  const text = <RNText {...props} style={fontStyle(style, nested)} />;
  return nested ? text : <Nested.Provider value>{text}</Nested.Provider>;
}

export function TextInput({ style, ...props }: TextInputProps & { ref?: Ref<RNTextInput> }) {
  return <RNTextInput {...props} style={fontStyle(style, false)} />;
}
