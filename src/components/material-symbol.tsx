import { Text, type TextProps } from 'react-native';

import { Fonts } from '@/constants/theme';

type Props = Omit<TextProps, 'children'> & {
  name: string;
  size?: number;
  color?: string;
};

// Ícones via ligadura da fonte Material Symbols (o nome do ícone, ex. "favorite", vira o
// glifo correspondente) — mesma técnica usada nos protótipos HTML do Stitch.
export function MaterialSymbol({ name, size = 24, color, style, ...rest }: Props) {
  return (
    <Text
      style={[{ fontFamily: Fonts.icon, fontSize: size, lineHeight: size, color }, style]}
      {...rest}
    >
      {name}
    </Text>
  );
}
