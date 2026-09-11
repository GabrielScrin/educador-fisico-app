import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { AvatarInitials } from '@/components/avatar-initials';
import { MaterialSymbol } from '@/components/material-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import {
  buscarResumoGeralApp,
  listarClientesComResumo,
  type ClienteComResumo,
  type ResumoGeralApp,
} from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';

function inicioDaSemana() {
  const agora = new Date();
  const diaSemana = agora.getDay();
  const deslocamento = diaSemana === 0 ? 6 : diaSemana - 1; // semana começa na segunda
  const inicio = new Date(agora);
  inicio.setDate(agora.getDate() - deslocamento);
  inicio.setHours(0, 0, 0, 0);
  return inicio.toISOString();
}

function inicioDosUltimos30Dias() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

function media(valor: number | null) {
  return valor === null ? '—' : valor.toFixed(1);
}

export default function Evolucao() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [resumo, setResumo] = useState<ResumoGeralApp | null>(null);
  const [clientes, setClientes] = useState<ClienteComResumo[]>([]);

  useFocusEffect(
    useCallback(() => {
      buscarResumoGeralApp(db, inicioDaSemana(), inicioDosUltimos30Dias()).then(setResumo);
      listarClientesComResumo(db).then(setClientes);
    }, [db]),
  );

  const clientesOrdenados = useMemo(() => {
    return clientes
      .slice()
      .sort((a, b) => (b.ultima_sessao_em ?? '').localeCompare(a.ultima_sessao_em ?? ''));
  }, [clientes]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="label" themeColor="textMuted">
            Visão geral do consultório
          </ThemedText>
          <ThemedText type="title" style={styles.headerTitulo}>
            Evolução
          </ThemedText>
        </View>

        <View style={styles.stats}>
          <StatCard icone="event_available" cor={theme.accent} rotulo="Sessões na semana" valor={resumo?.sessoes_semana ?? 0} />
          <StatCard icone="groups" cor={theme.secondary} rotulo="Ativos (30 dias)" valor={resumo?.clientes_ativos_mes ?? 0} />
          <StatCard icone="warning" cor={theme.warning} rotulo="Alertas de dor" valor={resumo?.alertas_dor ?? 0} />
        </View>

        <FlatList
          data={clientesOrdenados}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={
            clientesOrdenados.length > 0 ? (
              <ThemedText type="label" themeColor="textMuted" style={styles.tituloLista}>
                Clientes por atividade recente
              </ThemedText>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.vazio}>
              <ThemedText type="small" themeColor="textSecondary">
                Nenhum cliente cadastrado ainda.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <ClienteLinha
              cliente={item}
              onPress={() => router.push({ pathname: '/cliente/[id]', params: { id: String(item.id) } })}
            />
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function StatCard({ icone, cor, rotulo, valor }: { icone: string; cor: string; rotulo: string; valor: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: theme.backgroundElement }]}>
      <MaterialSymbol name={icone} size={16} color={cor} />
      <ThemedText type="metricMd" style={{ fontSize: 22, lineHeight: 26 }}>
        {valor}
      </ThemedText>
      <ThemedText type="label" themeColor="textMuted">
        {rotulo}
      </ThemedText>
    </View>
  );
}

function ClienteLinha({ cliente, onPress }: { cliente: ClienteComResumo; onPress: () => void }) {
  const theme = useTheme();
  const temAlerta = (cliente.ultima_media_dor ?? 0) >= 4;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.linha,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
      ]}
    >
      <AvatarInitials nome={cliente.nome} size={40} />
      <View style={{ flex: 1 }}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {cliente.nome}
        </ThemedText>
        <ThemedText type="small" themeColor="textMuted" numberOfLines={1}>
          {cliente.ultima_sessao_em
            ? `Última sessão ${new Date(cliente.ultima_sessao_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
            : 'Sem sessões ainda'}
        </ThemedText>
      </View>
      {cliente.ultima_sessao_em ? (
        <View style={styles.linhaMetricas}>
          <MiniMetrica rotulo="OMNI" valor={media(cliente.ultima_media_omni)} cor={theme.secondary} />
          <MiniMetrica
            rotulo="Dor"
            valor={media(cliente.ultima_media_dor)}
            cor={temAlerta ? theme.warning : theme.accent}
          />
        </View>
      ) : null}
      <MaterialSymbol name="chevron_right" size={18} color={theme.textMuted} />
    </Pressable>
  );
}

function MiniMetrica({ rotulo, valor, cor }: { rotulo: string; valor: string; cor: string }) {
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <ThemedText type="label" themeColor="textMuted">
        {rotulo}
      </ThemedText>
      <ThemedText type="smallBold" style={{ color: cor }}>
        {valor}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.three, paddingTop: Spacing.one },
  headerTitulo: { fontSize: 26, lineHeight: 32, marginTop: 2 },
  stats: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  statCard: { flex: 1, borderRadius: Radius.lg, padding: Spacing.two, gap: 4 },
  lista: { padding: Spacing.three, gap: Spacing.two, flexGrow: 1 },
  tituloLista: { paddingBottom: Spacing.one },
  vazio: { paddingTop: Spacing.six, alignItems: 'center' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderRadius: Radius.lg, padding: Spacing.two },
  linhaMetricas: { flexDirection: 'row', gap: Spacing.three },
});
