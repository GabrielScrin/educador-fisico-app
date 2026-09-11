import * as Haptics from 'expo-haptics';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaterialSymbol } from '@/components/material-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { faixaDoValor, type ConfigEscala } from '@/constants/scales';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visivel: boolean;
  escala: ConfigEscala | null;
  onFechar: () => void;
  onSelecionar: (valor: number) => void;
};

const ICONE_ESCALA: Record<ConfigEscala['tipo'], string> = {
  borg: 'directions_run',
  omni: 'fitness_center',
  dor: 'healing',
};

function vibrarSeSuportado() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

// Tela cheia, números grandes, uma linha por valor — pensada pra ficar de pé, celular na mão,
// educador e cliente lendo juntos durante o treino. Toque na linha já registra o valor: um
// passo a menos que o protótipo original (que pedia toque + confirmar), pensado pra essa
// mesma janela curta de uso que o resto do app respeita.
export function ScalePicker({ visivel, escala, onFechar, onSelecionar }: Props) {
  const theme = useTheme();

  if (!escala) return null;

  return (
    <Modal visible={visivel} animationType="slide" presentationStyle="fullScreen" onRequestClose={onFechar}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: theme.backgroundElement }]}>
              <MaterialSymbol name={ICONE_ESCALA[escala.tipo]} size={20} color={theme.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="label" themeColor="secondary">
                Escala clínica
              </ThemedText>
              <ThemedText type="subtitle">{escala.titulo}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {escala.subtitulo}
              </ThemedText>
            </View>
            <Pressable
              onPress={onFechar}
              hitSlop={12}
              style={[styles.fechar, { backgroundColor: theme.backgroundElement }]}
            >
              <MaterialSymbol name="close" size={20} color={theme.text} />
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
                    onPress={() => {
                      vibrarSeSuportado();
                      onSelecionar(item.valor);
                    }}
                    style={({ pressed }) => [
                      styles.linha,
                      {
                        backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
                      },
                    ]}
                  >
                    <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
                      <ThemedText type="metricMd" style={{ color: faixa.cor }}>
                        {item.valor}
                      </ThemedText>
                    </View>
                    <View style={styles.linhaTexto}>
                      <View style={styles.linhaTopo}>
                        <ThemedText type="smallBold">{item.descritor}</ThemedText>
                        {item.detalhe ? (
                          <View style={[styles.chip, { backgroundColor: theme.backgroundSelected }]}>
                            <ThemedText type="label" style={{ color: faixa.cor }}>
                              {faixa.rotulo}
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>
                      {item.detalhe ? (
                        <ThemedText type="small" themeColor="textSecondary">
                          {item.detalhe}
                        </ThemedText>
                      ) : null}
                    </View>
                    <MaterialSymbol name="chevron_right" size={20} color={theme.textMuted} />
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fechar: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.two,
    gap: Spacing.three,
    minHeight: 76,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  linhaTexto: { flex: 1, gap: 2 },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.xs },
});
