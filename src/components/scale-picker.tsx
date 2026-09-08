import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { faixaDoValor, type ConfigEscala } from '@/constants/scales';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visivel: boolean;
  escala: ConfigEscala | null;
  onFechar: () => void;
  onSelecionar: (valor: number) => void;
};

// Tela cheia, números grandes, uma linha por valor — pensada pra ficar de pé, celular na mão,
// educador e cliente lendo juntos durante o treino (não é um formulário pra preencher sentado).
export function ScalePicker({ visivel, escala, onFechar, onSelecionar }: Props) {
  const theme = useTheme();

  if (!escala) return null;

  return (
    <Modal visible={visivel} animationType="slide" presentationStyle="fullScreen" onRequestClose={onFechar}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle">{escala.titulo}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {escala.subtitulo}
              </ThemedText>
            </View>
            <Pressable onPress={onFechar} hitSlop={12} style={styles.fechar}>
              <ThemedText type="smallBold">Fechar</ThemedText>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.lista} showsVerticalScrollIndicator={false}>
            {escala.valores
              .slice()
              .reverse()
              .map((item) => {
                const faixa = faixaDoValor(escala, item.valor);
                return (
                  <Pressable
                    key={item.valor}
                    onPress={() => onSelecionar(item.valor)}
                    style={({ pressed }) => [
                      styles.linha,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderLeftColor: faixa.cor,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <ThemedText style={[styles.numero, { color: faixa.cor }]}>{item.valor}</ThemedText>
                    <View style={styles.linhaTexto}>
                      <ThemedText type="smallBold">{item.descritor}</ThemedText>
                      {item.detalhe ? (
                        <ThemedText type="small" themeColor="textSecondary">
                          {item.detalhe}
                        </ThemedText>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.three,
  },
  fechar: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
  lista: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.two,
    borderLeftWidth: 6,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
    minHeight: 76,
  },
  numero: {
    fontFamily: Fonts.serif,
    fontSize: 44,
    fontWeight: '700',
    minWidth: 64,
    textAlign: 'center',
  },
  linhaTexto: { flex: 1, gap: 2 },
});
