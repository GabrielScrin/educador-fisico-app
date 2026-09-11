import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'subtitle'
    | 'small'
    | 'smallBold'
    | 'label'
    | 'metric'
    | 'metricMd'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'subtitle' && styles.subtitle,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'label' && styles.label,
        type === 'metric' && styles.metric,
        type === 'metricMd' && styles.metricMd,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 24 },
  title: { fontFamily: Fonts.bold, fontSize: 32, lineHeight: 38, letterSpacing: -0.4 },
  subtitle: { fontFamily: Fonts.semiBold, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  small: { fontFamily: Fonts.regular, fontSize: 12, lineHeight: 16 },
  smallBold: { fontFamily: Fonts.semiBold, fontSize: 15, lineHeight: 20 },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  metric: {
    fontFamily: Fonts.bold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  metricMd: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
});
