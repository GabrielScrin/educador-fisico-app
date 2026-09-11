import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function AvatarInitials({ nome, size = 48 }: { nome: string; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: Radius.pill,
          backgroundColor: theme.backgroundSelected,
        },
      ]}
    >
      <ThemedText
        type="smallBold"
        themeColor="secondary"
        style={{ fontSize: size * 0.36, lineHeight: size * 0.4 }}
      >
        {iniciais(nome)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
