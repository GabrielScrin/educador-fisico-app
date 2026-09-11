import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { MaterialSymbol } from '@/components/material-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { ESCALAS, faixaDoValor, type TipoEscala } from '@/constants/scales';
import { useTheme } from '@/hooks/use-theme';

const ABAS: { tipo: TipoEscala; rotulo: string; icone: string }[] = [
  { tipo: 'omni', rotulo: 'OMNI-RES', icone: 'fitness_center' },
  { tipo: 'borg', rotulo: 'Borg CR10', icone: 'directions_run' },
  { tipo: 'dor', rotulo: 'Dor NPRS', icone: 'healing' },
];

// Consulta de referência das três escalas clínicas — sem seleção/registro, é só pro educador
// (ou pro cliente, olhando junto) conferir o que cada nota significa a qualquer momento.
export default function EscalasDeReferencia() {
  const theme = useTheme();
  const [aba, setAba] = useState<TipoEscala>('omni');
  const escala = ESCALAS[aba];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBotao}>
            <MaterialSymbol name="arrow_back" size={22} color={theme.textSecondary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <ThemedText type="label" themeColor="textMuted">
              Protocolo clínico
            </ThemedText>
            <ThemedText type="subtitle">Escalas de referência</ThemedText>
          </View>
        </View>

        <View style={styles.abas}>
          {ABAS.map((item) => {
            const ativa = item.tipo === aba;
            return (
              <Pressable
                key={item.tipo}
                onPress={() => setAba(item.tipo)}
                style={[
                  styles.aba,
                  { backgroundColor: ativa ? theme.backgroundSelected : 'transparent' },
                ]}
              >
                <MaterialSymbol
                  name={item.icone}
                  size={18}
                  color={ativa ? theme.accent : theme.textMuted}
                />
                <ThemedText
                  type="smallBold"
                  themeColor={ativa ? 'accent' : 'textMuted'}
                  numberOfLines={1}
                >
                  {item.rotulo}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="subtitle">{escala.titulo}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {escala.subtitulo}
            </ThemedText>
          </View>

          {escala.valores
            .slice()
            .reverse()
            .map((item) => {
              const faixa = faixaDoValor(escala, item.valor);
              return (
                <View
                  key={item.valor}
                  style={[styles.linha, { backgroundColor: theme.backgroundElement }]}
                >
                  <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText type="metricMd" style={{ color: faixa.cor, fontSize: 24, lineHeight: 28 }}>
                      {item.valor}
                    </ThemedText>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.linhaTopo}>
                      <ThemedText type="smallBold">{item.descritor}</ThemedText>
                      <View style={[styles.chip, { backgroundColor: theme.backgroundSelected }]}>
                        <ThemedText type="label" style={{ color: faixa.cor }}>
                          {faixa.rotulo}
                        </ThemedText>
                      </View>
                    </View>
                    {item.detalhe ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.detalhe}
                      </ThemedText>
                    ) : null}
                  </View>
                </View>
              );
            })}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBotao: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  abas: { flexDirection: 'row', gap: Spacing.one, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  aba: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: Radius.md,
  },
  scroll: { padding: Spacing.three, gap: Spacing.two, paddingBottom: Spacing.six },
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: 4, marginBottom: Spacing.one },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderRadius: Radius.lg, padding: Spacing.two, minHeight: 76 },
  badge: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.xs },
});
