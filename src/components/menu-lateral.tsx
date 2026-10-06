import { Pressable, StyleSheet, View } from 'react-native';
import { router, usePathname, type Href } from 'expo-router';

import { MaterialSymbol } from '@/components/material-symbol';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Menu fixo do desktop (web). Fica ao lado de todas as telas logadas, inclusive as de detalhe
// (prontuário, sessão), então o educador sempre tem as áreas principais à mão.
const LARGURA_MENU = 232;

const ITENS: { rota: Href; rotulo: string; icone: string; ativo: (caminho: string) => boolean }[] = [
  { rota: '/', rotulo: 'Clientes', icone: 'group', ativo: (c) => c === '/' || c.startsWith('/cliente') },
  {
    rota: '/treino-ativo',
    rotulo: 'Treino ativo',
    icone: 'ecg_heart',
    ativo: (c) => c.startsWith('/treino-ativo') || c.startsWith('/sessao'),
  },
  { rota: '/evolucao', rotulo: 'Evolução', icone: 'monitoring', ativo: (c) => c.startsWith('/evolucao') },
  { rota: '/ajustes', rotulo: 'Ajustes', icone: 'settings', ativo: (c) => c.startsWith('/ajustes') },
];

export function MenuLateral() {
  const theme = useTheme();
  const caminho = usePathname();

  return (
    <View style={[styles.menu, { backgroundColor: theme.backgroundElement, borderRightColor: theme.border }]}>
      <View style={styles.marca}>
        <View style={[styles.marcaPonto, { backgroundColor: theme.accent }]} />
        <ThemedText type="smallBold">Educador Físico</ThemedText>
      </View>
      {ITENS.map((item) => {
        const focado = item.ativo(caminho);
        return (
          <Pressable
            key={item.rotulo}
            accessibilityRole="link"
            accessibilityState={{ selected: focado }}
            onPress={() => router.navigate(item.rota)}
            style={({ hovered }) => [
              styles.item,
              focado && { backgroundColor: theme.backgroundSelected },
              !focado && hovered && { backgroundColor: theme.backgroundSelected },
            ]}
          >
            <MaterialSymbol name={item.icone} color={focado ? theme.accent : theme.textSecondary} size={22} />
            <ThemedText type="smallBold" style={{ color: focado ? theme.text : theme.textSecondary }}>
              {item.rotulo}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    width: LARGURA_MENU,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    gap: Spacing.one,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.three,
  },
  marcaPonto: { width: 10, height: 10, borderRadius: 5 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.md,
  },
});
