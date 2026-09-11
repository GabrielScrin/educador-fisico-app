import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { AvatarInitials } from '@/components/avatar-initials';
import { MaterialSymbol } from '@/components/material-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { faixaDoValor, ESCALAS } from '@/constants/scales';
import { criarSessao, listarClientesComResumo, type ClienteComResumo } from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';

type Filtro = 'todos' | 'hoje' | 'dor';

function ehHoje(iso: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  const agora = new Date();
  return (
    d.getFullYear() === agora.getFullYear() &&
    d.getMonth() === agora.getMonth() &&
    d.getDate() === agora.getDate()
  );
}

export default function ListaClientes() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [clientes, setClientes] = useState<ClienteComResumo[]>([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [criando, setCriando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      listarClientesComResumo(db, busca).then(setClientes);
    }, [db, busca]),
  );

  const clientesFiltrados = useMemo(() => {
    if (filtro === 'hoje') return clientes.filter((c) => ehHoje(c.ultima_sessao_em));
    if (filtro === 'dor') return clientes.filter((c) => (c.ultima_media_dor ?? 0) >= 4);
    return clientes;
  }, [clientes, filtro]);

  const totalHoje = useMemo(() => clientes.filter((c) => ehHoje(c.ultima_sessao_em)).length, [clientes]);
  const totalDor = useMemo(() => clientes.filter((c) => (c.ultima_media_dor ?? 0) >= 4).length, [clientes]);

  async function iniciarSessaoImediata(clienteId: number) {
    if (criando) return;
    setCriando(true);
    const sessaoId = await criarSessao(db, clienteId);
    setCriando(false);
    router.push({ pathname: '/sessao/[id]', params: { id: String(sessaoId) } });
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View>
            <View style={styles.headerEyebrow}>
              <View style={[styles.pontoPulso, { backgroundColor: theme.accent }]} />
              <ThemedText type="label" themeColor="textMuted">
                Local · sem sincronização
              </ThemedText>
            </View>
            <ThemedText type="title" style={styles.headerTitulo}>
              Clientes
            </ThemedText>
          </View>
          <Pressable
            onPress={() => router.push('/escalas')}
            hitSlop={10}
            style={[styles.headerAcao, { backgroundColor: theme.backgroundElement }]}
          >
            <MaterialSymbol name="menu_book" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.buscaLinha}>
          <View style={[styles.buscaWrap, { backgroundColor: theme.backgroundElement }]}>
            <MaterialSymbol name="search" size={20} color={theme.textMuted} />
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar cliente por nome..."
              placeholderTextColor={theme.textMuted}
              style={[styles.buscaInput, { color: theme.text }]}
            />
          </View>
          <Link href="/cliente/novo" asChild>
            <Pressable style={[styles.botaoNovo, { backgroundColor: theme.accent }]}>
              <MaterialSymbol name="person_add" size={20} color={theme.onAccent} />
            </Pressable>
          </Link>
        </View>

        <View style={styles.chips}>
          <Chip label={`Todos (${clientes.length})`} ativo={filtro === 'todos'} onPress={() => setFiltro('todos')} />
          <Chip label={`Hoje (${totalHoje})`} ativo={filtro === 'hoje'} onPress={() => setFiltro('hoje')} />
          <Chip
            label={`Alerta de dor (${totalDor})`}
            ativo={filtro === 'dor'}
            icone="warning"
            cor={theme.warning}
            onPress={() => setFiltro('dor')}
          />
        </View>

        <FlatList
          data={clientesFiltrados}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <ThemedText type="small" themeColor="textSecondary">
                {clientes.length === 0
                  ? 'Nenhum cliente ainda. Toque em "+" para começar.'
                  : 'Nenhum cliente nesse filtro.'}
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <ClienteCard
              cliente={item}
              onAbrir={() => router.push({ pathname: '/cliente/[id]', params: { id: String(item.id) } })}
              onIniciar={() => iniciarSessaoImediata(item.id)}
              desabilitado={criando}
            />
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function Chip({
  label,
  ativo,
  onPress,
  icone,
  cor,
}: {
  label: string;
  ativo: boolean;
  onPress: () => void;
  icone?: string;
  cor?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: ativo ? theme.backgroundSelected : theme.surfaceContainer },
      ]}
    >
      {icone ? <MaterialSymbol name={icone} size={13} color={ativo ? cor : theme.textMuted} /> : null}
      <ThemedText type="label" style={{ color: ativo ? (cor ?? theme.accent) : theme.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function ClienteCard({
  cliente,
  onAbrir,
  onIniciar,
  desabilitado,
}: {
  cliente: ClienteComResumo;
  onAbrir: () => void;
  onIniciar: () => void;
  desabilitado: boolean;
}) {
  const theme = useTheme();
  const temAlerta = (cliente.ultima_media_dor ?? 0) >= 4;

  return (
    <Pressable
      onPress={onAbrir}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
      ]}
    >
      <View style={styles.cardTopo}>
        <View style={styles.cardIdentidade}>
          <AvatarInitials nome={cliente.nome} size={48} />
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitle" numberOfLines={1}>
              {cliente.nome}
            </ThemedText>
            {cliente.contato ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {cliente.contato}
              </ThemedText>
            ) : (
              <ThemedText type="small" themeColor="textMuted">
                {cliente.ultima_sessao_em ? 'Sem contato salvo' : 'Nenhuma sessão ainda'}
              </ThemedText>
            )}
          </View>
        </View>
        <MaterialSymbol name="chevron_right" size={20} color={theme.textMuted} />
      </View>

      {cliente.ultima_sessao_em ? (
        <View style={[styles.telemetria, { backgroundColor: theme.surfaceContainer }]}>
          <View style={styles.telemetriaTopo}>
            <ThemedText type="label" themeColor="textMuted">
              Última sessão
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatarData(cliente.ultima_sessao_em)}
            </ThemedText>
          </View>
          <View style={styles.telemetriaGrade}>
            <TelemetriaMini
              rotulo="Borg"
              valor={cliente.ultima_media_borg}
              cor={theme.secondary}
            />
            <TelemetriaMini
              rotulo="Dor"
              valor={cliente.ultima_media_dor}
              cor={temAlerta ? theme.warning : theme.accent}
              destaque={temAlerta}
            />
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={onIniciar}
        disabled={desabilitado}
        style={[styles.botaoIniciar, { backgroundColor: theme.accent, opacity: desabilitado ? 0.6 : 1 }]}
      >
        <MaterialSymbol name="fitness_center" size={20} color={theme.onAccent} />
        <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
          Iniciar sessão
        </ThemedText>
      </Pressable>
    </Pressable>
  );
}

function TelemetriaMini({ rotulo, valor, cor, destaque }: { rotulo: string; valor: number | null; cor: string; destaque?: boolean }) {
  const theme = useTheme();
  const faixa = valor !== null ? faixaDoValor(ESCALAS.dor, valor) : null;
  return (
    <View style={[styles.telemetriaMini, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="label" themeColor="textMuted">
        {rotulo}
      </ThemedText>
      <ThemedText type="smallBold" style={{ color: destaque ? theme.warning : cor }}>
        {valor !== null ? valor.toFixed(1) : '—'}
        {destaque && faixa ? ` · ${faixa.rotulo}` : ''}
      </ThemedText>
    </View>
  );
}

function formatarData(iso: string) {
  const d = new Date(iso);
  const hoje = ehHoje(iso);
  if (hoje) return `Hoje, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
  },
  headerEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pontoPulso: { width: 6, height: 6, borderRadius: 3 },
  headerTitulo: { fontSize: 26, lineHeight: 32, marginTop: 2 },
  headerAcao: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  buscaLinha: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  buscaWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    height: 52,
  },
  buscaInput: { flex: 1, fontSize: 16 },
  botaoNovo: { width: 52, height: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', gap: Spacing.one, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
  },
  lista: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.three, flexGrow: 1 },
  vazio: { paddingTop: Spacing.six, alignItems: 'center' },
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two },
  cardTopo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cardIdentidade: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  telemetria: { borderRadius: Radius.md, padding: Spacing.two, gap: Spacing.one },
  telemetriaTopo: { flexDirection: 'row', justifyContent: 'space-between' },
  telemetriaGrade: { flexDirection: 'row', gap: Spacing.two },
  telemetriaMini: { flex: 1, borderRadius: Radius.sm, paddingVertical: 6, paddingHorizontal: Spacing.two, gap: 2 },
  botaoIniciar: {
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
