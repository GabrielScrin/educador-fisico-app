import Constants from 'expo-constants';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { MaterialSymbol } from '@/components/material-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function Ajustes() {
  const theme = useTheme();
  const versao = Constants.expoConfig?.version ?? '—';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="label" themeColor="textMuted">
            Educador Físico
          </ThemedText>
          <ThemedText type="title" style={styles.headerTitulo}>
            Ajustes
          </ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Secao titulo="Dados e privacidade">
            <Linha
              icone="phone_iphone"
              titulo="Armazenamento local"
              subtitulo="Todos os dados ficam neste aparelho (SQLite), sem sincronização em nuvem."
            />
            <Linha
              icone="lock"
              titulo="Sem login"
              subtitulo="O app ainda não identifica o educador — pensado pra um uso individual, num único aparelho."
            />
          </Secao>

          <Secao titulo="Referência clínica">
            <Pressable
              onPress={() => router.push('/escalas')}
              style={({ pressed }) => [
                styles.linhaClicavel,
                { backgroundColor: pressed ? theme.backgroundSelected : 'transparent' },
              ]}
            >
              <View style={[styles.icone, { backgroundColor: theme.backgroundSelected }]}>
                <MaterialSymbol name="menu_book" size={18} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold">Escalas de referência</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Consultar Borg CR10, OMNI-RES e NPRS a qualquer momento
                </ThemedText>
              </View>
              <MaterialSymbol name="chevron_right" size={20} color={theme.textMuted} />
            </Pressable>
            <View style={[styles.fonteCard, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Conteúdo clínico das escalas cedido por Rafael de Souza Iyama (Educação Física,
                CREF 010255), com base em ACSM&apos;s Guidelines for Exercise Testing and
                Prescription (2020), Robertson et al. — escala OMNI-RES (2003), Zourdos et al. —
                escala RIR (2016) e literatura padrão de NPRS.
              </ThemedText>
            </View>
          </Secao>

          <Secao titulo="Sobre">
            <Linha icone="info" titulo="Versão" subtitulo={versao} />
          </Secao>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.secao}>
      <ThemedText type="label" themeColor="textMuted" style={styles.secaoTitulo}>
        {titulo}
      </ThemedText>
      <View style={[styles.secaoCorpo, { backgroundColor: theme.backgroundElement }]}>{children}</View>
    </View>
  );
}

function Linha({ icone, titulo, subtitulo }: { icone: string; titulo: string; subtitulo: string }) {
  const theme = useTheme();
  return (
    <View style={styles.linha}>
      <View style={[styles.icone, { backgroundColor: theme.backgroundSelected }]}>
        <MaterialSymbol name={icone} size={18} color={theme.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText type="smallBold">{titulo}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {subtitulo}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.three, paddingTop: Spacing.one },
  headerTitulo: { fontSize: 26, lineHeight: 32, marginTop: 2 },
  scroll: { padding: Spacing.three, gap: Spacing.four },
  secao: { gap: Spacing.one },
  secaoTitulo: { paddingHorizontal: Spacing.one },
  secaoCorpo: { borderRadius: Radius.lg, overflow: 'hidden' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  linhaClicavel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  icone: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  fonteCard: { padding: Spacing.three, paddingTop: 0 },
});
