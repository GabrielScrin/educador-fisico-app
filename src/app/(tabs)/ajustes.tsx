import Constants from 'expo-constants';
import type { ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { MaterialSymbol } from '@/components/material-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useSync } from '@/hooks/use-sync';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function Ajustes() {
  const theme = useTheme();
  const versao = Constants.expoConfig?.version ?? '—';
  const { session } = useAuth();
  const { estado, ultimaSincronizacao, erro, conflitos, sincronizarAgora } = useSync();

  function sair() {
    Alert.alert('Sair da conta', 'Seus dados continuam salvos neste aparelho.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

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
          <Secao titulo="Conta">
            <Linha icone="account_circle" titulo="Logado como" subtitulo={session?.user.email ?? '—'} />
            <Pressable
              onPress={sair}
              style={({ pressed }) => [
                styles.linhaClicavel,
                { backgroundColor: pressed ? theme.backgroundSelected : 'transparent' },
              ]}
            >
              <View style={[styles.icone, { backgroundColor: theme.backgroundSelected }]}>
                <MaterialSymbol name="logout" size={18} color={theme.danger} />
              </View>
              <ThemedText type="smallBold" style={{ color: theme.danger }}>
                Sair
              </ThemedText>
            </Pressable>
          </Secao>

          <Secao titulo="Dados e privacidade">
            <Linha
              icone="phone_iphone"
              titulo="Armazenamento local"
              subtitulo="Todos os dados ficam neste aparelho (SQLite) — a nuvem é backup, não substitui isso."
            />
            <Pressable
              onPress={sincronizarAgora}
              disabled={estado === 'sincronizando'}
              style={({ pressed }) => [
                styles.linhaClicavel,
                { backgroundColor: pressed ? theme.backgroundSelected : 'transparent' },
              ]}
            >
              <View style={[styles.icone, { backgroundColor: theme.backgroundSelected }]}>
                <MaterialSymbol
                  name={estado === 'erro' ? 'cloud_off' : 'cloud_sync'}
                  size={18}
                  color={estado === 'erro' ? theme.danger : theme.accent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold">
                  {estado === 'sincronizando' ? 'Sincronizando...' : 'Sincronização'}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {textoStatusSync(estado, ultimaSincronizacao, erro)}
                </ThemedText>
              </View>
              {estado !== 'sincronizando' && (
                <ThemedText type="small" style={{ color: theme.accent }}>
                  Sincronizar
                </ThemedText>
              )}
            </Pressable>
            {conflitos > 0 && (
              <View style={[styles.avisoConflito, { backgroundColor: theme.backgroundSelected }]}>
                <MaterialSymbol name="warning" size={18} color={theme.danger} />
                <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
                  {conflitos === 1
                    ? '1 registro foi sobrescrito nesta sincronização — havia sido alterado em outro aparelho antes de chegar aqui.'
                    : `${conflitos} registros foram sobrescritos nesta sincronização — haviam sido alterados em outro aparelho antes de chegar aqui.`}
                </ThemedText>
              </View>
            )}
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

function textoStatusSync(
  estado: 'ocioso' | 'sincronizando' | 'erro',
  ultimaSincronizacao: Date | null,
  erro: string | null,
): string {
  if (estado === 'sincronizando') return 'Enviando e buscando dados da nuvem...';
  if (estado === 'erro') return erro ?? 'Falha ao sincronizar.';
  if (!ultimaSincronizacao) return 'Toque para sincronizar agora.';
  const hora = ultimaSincronizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `Sincronizado às ${hora}.`;
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
  avisoConflito: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
  },
});
