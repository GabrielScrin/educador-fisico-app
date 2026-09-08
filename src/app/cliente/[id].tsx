import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { buscarCliente, criarSessao, listarSessoesPorCliente, type Cliente, type ResumoSessao } from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';

function formatarData(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function media(valor: number | null) {
  return valor === null ? '—' : valor.toFixed(1);
}

export default function PerfilCliente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clienteId = Number(id);
  const db = useSQLiteContext();
  const theme = useTheme();
  const navigation = useNavigation();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [sessoes, setSessoes] = useState<ResumoSessao[]>([]);
  const [criando, setCriando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      buscarCliente(db, clienteId).then((c) => {
        setCliente(c);
        if (c) navigation.setOptions({ title: c.nome });
      });
      listarSessoesPorCliente(db, clienteId).then(setSessoes);
    }, [db, clienteId, navigation]),
  );

  async function iniciarSessao() {
    if (criando) return;
    setCriando(true);
    const sessaoId = await criarSessao(db, clienteId);
    router.push({ pathname: '/sessao/[id]', params: { id: String(sessaoId) } });
    setCriando(false);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {cliente?.contato ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.contato}>
            {cliente.contato}
          </ThemedText>
        ) : null}

        <FlatList
          data={sessoes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={
            sessoes.length > 0 ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.tituloHistorico}>
                Histórico de sessões
              </ThemedText>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.vazio}>
              <ThemedText type="small" themeColor="textSecondary">
                Nenhuma sessão registrada ainda.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.item, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">
                {formatarData(item.iniciada_em)}
                {!item.finalizada_em ? '  ·  em andamento' : ''}
              </ThemedText>
              <View style={styles.metricas}>
                <Metrica label="Borg" valor={media(item.media_borg)} />
                <Metrica label="Dor" valor={media(item.media_dor)} />
                <Metrica label="FC" valor={item.media_fc ? `${Math.round(item.media_fc)} bpm` : '—'} />
                <Metrica label="Registros" valor={String(item.total_leituras)} />
              </View>
              {item.nota ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {item.nota}
                </ThemedText>
              ) : null}
            </View>
          )}
        />

        <Pressable
          onPress={iniciarSessao}
          disabled={criando}
          style={[styles.botaoNovo, { backgroundColor: theme.accent, opacity: criando ? 0.6 : 1 }]}
        >
          <ThemedText type="smallBold" style={{ color: '#F4EFE8' }}>
            + Nova sessão
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

function Metrica({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.metrica}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{valor}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  contato: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  tituloHistorico: { paddingBottom: Spacing.one, textTransform: 'uppercase', letterSpacing: 0.5 },
  lista: { padding: Spacing.three, gap: Spacing.two, flexGrow: 1 },
  vazio: { paddingTop: Spacing.six, alignItems: 'center' },
  item: { borderRadius: Spacing.two, padding: Spacing.three, gap: Spacing.two },
  metricas: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.four },
  metrica: { gap: 2 },
  botaoNovo: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
});
