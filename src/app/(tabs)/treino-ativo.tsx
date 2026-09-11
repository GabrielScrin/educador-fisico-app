import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { AvatarInitials } from '@/components/avatar-initials';
import { MaterialSymbol } from '@/components/material-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ESCALAS, faixaDoValor, type TipoEscala } from '@/constants/scales';
import { Radius, Spacing } from '@/constants/theme';
import { listarSessoesEmAndamento, type SessaoEmAndamento } from '@/db/queries';
import { formatarDuracao, useElapsedSeconds } from '@/hooks/use-elapsed-timer';
import { useTheme } from '@/hooks/use-theme';

export default function TreinoAtivo() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [sessoes, setSessoes] = useState<SessaoEmAndamento[]>([]);

  useFocusEffect(
    useCallback(() => {
      listarSessoesEmAndamento(db).then(setSessoes);
    }, [db]),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerEyebrow}>
            <View style={[styles.pontoPulso, { backgroundColor: theme.accent }]} />
            <ThemedText type="label" themeColor="textMuted">
              {sessoes.length} {sessoes.length === 1 ? 'sessão' : 'sessões'} agora
            </ThemedText>
          </View>
          <ThemedText type="title" style={styles.headerTitulo}>
            Treino ativo
          </ThemedText>
        </View>

        <FlatList
          data={sessoes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <MaterialSymbol name="ecg_heart" size={32} color={theme.textMuted} />
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                Nenhuma sessão em andamento agora.{'\n'}Inicie uma pelo perfil do cliente.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <SessaoCard
              sessao={item}
              onPress={() => router.push({ pathname: '/sessao/[id]', params: { id: String(item.id) } })}
            />
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function rotuloUltimaLeitura(item: SessaoEmAndamento) {
  if (item.ultimo_tipo === null || item.ultimo_valor === null) return 'Nenhum registro ainda';
  if (item.ultimo_tipo === 'fc') return `FC ${Math.round(item.ultimo_valor)} bpm`;
  const escala = ESCALAS[item.ultimo_tipo as TipoEscala];
  return `${escala.titulo.split(' ')[0]} ${item.ultimo_valor} — ${faixaDoValor(escala, item.ultimo_valor).rotulo}`;
}

function SessaoCard({ sessao, onPress }: { sessao: SessaoEmAndamento; onPress: () => void }) {
  const theme = useTheme();
  const decorridos = useElapsedSeconds(sessao.iniciada_em);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
      ]}
    >
      <View style={styles.cardTopo}>
        <AvatarInitials nome={sessao.cliente_nome} size={44} />
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {sessao.cliente_nome}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {rotuloUltimaLeitura(sessao)}
          </ThemedText>
        </View>
        <View style={[styles.timerPill, { backgroundColor: theme.backgroundSelected }]}>
          <MaterialSymbol name="timer" size={13} color={theme.accent} />
          <ThemedText type="smallBold" themeColor="accent">
            {formatarDuracao(decorridos)}
          </ThemedText>
        </View>
      </View>
      <View style={styles.cardRodape}>
        <ThemedText type="label" themeColor="textMuted">
          {sessao.total_leituras} {sessao.total_leituras === 1 ? 'registro' : 'registros'}
        </ThemedText>
        <View style={styles.continuar}>
          <ThemedText type="label" themeColor="accent">
            Continuar
          </ThemedText>
          <MaterialSymbol name="chevron_right" size={16} color={theme.accent} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.three, paddingTop: Spacing.one },
  headerEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pontoPulso: { width: 6, height: 6, borderRadius: 3 },
  headerTitulo: { fontSize: 26, lineHeight: 32, marginTop: 2 },
  lista: { padding: Spacing.three, gap: Spacing.two, flexGrow: 1 },
  vazio: { paddingTop: Spacing.six, alignItems: 'center', gap: Spacing.two },
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two },
  cardTopo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  cardRodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  continuar: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
