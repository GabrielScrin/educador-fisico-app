import { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { AvatarInitials } from '@/components/avatar-initials';
import { MaterialSymbol } from '@/components/material-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TrendChart } from '@/components/trend-chart';
import { Radius, Spacing } from '@/constants/theme';
import {
  atualizarNotaSessao,
  buscarCliente,
  buscarResumoGeralCliente,
  criarSessao,
  excluirLeitura,
  excluirSessao,
  listarLeituras,
  listarSessoesPorCliente,
  type Cliente,
  type Leitura,
  type ResumoGeralCliente,
  type ResumoSessao,
} from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';

function formatarData(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' · ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}

function media(valor: number | null) {
  return valor === null ? '—' : valor.toFixed(1);
}

export default function PerfilCliente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clienteId = Number(id);
  const db = useSQLiteContext();
  const theme = useTheme();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [sessoes, setSessoes] = useState<ResumoSessao[]>([]);
  const [resumoGeral, setResumoGeral] = useState<ResumoGeralCliente | null>(null);
  const [criando, setCriando] = useState(false);
  const [sessaoAberta, setSessaoAberta] = useState<number | null>(null);
  const [leiturasPorSessao, setLeiturasPorSessao] = useState<Record<number, Leitura[]>>({});
  const [sessaoEditandoNota, setSessaoEditandoNota] = useState<ResumoSessao | null>(null);
  const [notaEdicao, setNotaEdicao] = useState('');

  const recarregarSessoes = useCallback(() => {
    listarSessoesPorCliente(db, clienteId).then(setSessoes);
    buscarResumoGeralCliente(db, clienteId).then(setResumoGeral);
  }, [db, clienteId]);

  useFocusEffect(
    useCallback(() => {
      buscarCliente(db, clienteId).then(setCliente);
      recarregarSessoes();
    }, [db, clienteId, recarregarSessoes]),
  );

  const tendenciaOmni = useMemo(() => {
    return sessoes
      .slice()
      .reverse()
      .filter((s) => s.media_omni !== null)
      .slice(-8)
      .map((s) => s.media_omni as number);
  }, [sessoes]);

  async function iniciarSessao() {
    if (criando) return;
    setCriando(true);
    const sessaoId = await criarSessao(db, clienteId);
    router.push({ pathname: '/sessao/[id]', params: { id: String(sessaoId) } });
    setCriando(false);
  }

  async function alternarSessao(sessaoId: number) {
    if (sessaoAberta === sessaoId) {
      setSessaoAberta(null);
      return;
    }
    setSessaoAberta(sessaoId);
    if (!leiturasPorSessao[sessaoId]) {
      const leituras = await listarLeituras(db, sessaoId);
      setLeiturasPorSessao((atual) => ({ ...atual, [sessaoId]: leituras }));
    }
  }

  function abrirEdicaoNota(sessao: ResumoSessao) {
    setSessaoEditandoNota(sessao);
    setNotaEdicao(sessao.nota ?? '');
  }

  async function salvarNotaEditada() {
    if (!sessaoEditandoNota) return;
    await atualizarNotaSessao(db, sessaoEditandoNota.id, notaEdicao);
    setSessaoEditandoNota(null);
    recarregarSessoes();
  }

  function confirmarExclusaoSessao(sessao: ResumoSessao) {
    Alert.alert(
      'Excluir sessão',
      `Isso apaga a sessão de ${formatarData(sessao.iniciada_em)} e todas as leituras registradas nela. Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await excluirSessao(db, sessao.id);
            if (sessaoAberta === sessao.id) setSessaoAberta(null);
            recarregarSessoes();
          },
        },
      ],
    );
  }

  function abrirOpcoesSessao(sessao: ResumoSessao) {
    Alert.alert(formatarData(sessao.iniciada_em), undefined, [
      { text: 'Editar nota', onPress: () => abrirEdicaoNota(sessao) },
      { text: 'Excluir sessão', style: 'destructive', onPress: () => confirmarExclusaoSessao(sessao) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function confirmarExclusaoLeitura(sessaoId: number, leitura: Leitura) {
    Alert.alert('Excluir leitura', 'Remove esse registro da sessão. Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await excluirLeitura(db, leitura.id);
          const leituras = await listarLeituras(db, sessaoId);
          setLeiturasPorSessao((atual) => ({ ...atual, [sessaoId]: leituras }));
          recarregarSessoes();
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBotao}>
            <MaterialSymbol name="arrow_back" size={22} color={theme.textSecondary} />
          </Pressable>
          <ThemedText type="subtitle" numberOfLines={1} style={{ flex: 1 }}>
            {cliente?.nome ?? 'Cliente'}
          </ThemedText>
          <Pressable
            onPress={() => router.push({ pathname: '/cliente/[id]/editar', params: { id: String(clienteId) } })}
            hitSlop={12}
            style={[styles.headerAcao, { backgroundColor: theme.backgroundElement }]}
          >
            <MaterialSymbol name="edit" size={18} color={theme.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/escalas')}
            hitSlop={12}
            style={[styles.headerAcao, { backgroundColor: theme.backgroundElement }]}
          >
            <MaterialSymbol name="menu_book" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Cabeçalho do cliente */}
          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.identidade}>
              <AvatarInitials nome={cliente?.nome ?? '?'} size={56} />
              <View style={{ flex: 1 }}>
                <ThemedText type="subtitle" numberOfLines={1}>
                  {cliente?.nome ?? '—'}
                </ThemedText>
                {cliente?.contato ? (
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {cliente.contato}
                  </ThemedText>
                ) : null}
                <ThemedText type="small" themeColor="textMuted">
                  {resumoGeral?.total_sessoes ?? 0} sessões registradas
                </ThemedText>
              </View>
            </View>
            <Pressable
              onPress={iniciarSessao}
              disabled={criando}
              style={[styles.botaoIniciar, { backgroundColor: theme.accent, opacity: criando ? 0.6 : 1 }]}
            >
              <MaterialSymbol name="play_arrow" size={20} color={theme.onAccent} />
              <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                Iniciar nova sessão
              </ThemedText>
            </Pressable>
          </View>

          {/* Resumo geral */}
          <View style={styles.bento}>
            <ResumoCard
              icone="speed"
              cor={theme.secondary}
              rotulo="Carga média OMNI"
              valor={media(resumoGeral?.media_omni ?? null)}
            />
            <ResumoCard
              icone="healing"
              cor={theme.warning}
              rotulo="Pico de dor"
              valor={media(resumoGeral?.pico_dor ?? null)}
            />
            <ResumoCard
              icone="timer"
              cor={theme.accent}
              rotulo="Duração média"
              valor={
                resumoGeral?.tempo_medio_min != null ? `${Math.round(resumoGeral.tempo_medio_min)}` : '—'
              }
              unidade="min"
            />
          </View>

          {/* Tendência */}
          {tendenciaOmni.length > 1 ? (
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.linhaTitulo}>
                <View>
                  <ThemedText type="label" themeColor="textMuted">
                    Monitoramento longitudinal
                  </ThemedText>
                  <ThemedText type="subtitle">Evolução do esforço (OMNI)</ThemedText>
                </View>
              </View>
              <TrendChart valores={tendenciaOmni} cor={theme.secondary} />
            </View>
          ) : null}

          {/* Caderneta de sessões */}
          <View style={styles.secao}>
            <View style={styles.linhaTitulo}>
              <ThemedText type="subtitle" style={{ flex: 1 }}>
                Caderneta de sessões
              </ThemedText>
              <ThemedText type="label" themeColor="textMuted">
                Ordem cronológica
              </ThemedText>
            </View>

            {sessoes.length === 0 ? (
              <View style={styles.vazio}>
                <ThemedText type="small" themeColor="textSecondary">
                  Nenhuma sessão registrada ainda.
                </ThemedText>
              </View>
            ) : (
              sessoes.map((sessao) => (
                <SessaoItem
                  key={sessao.id}
                  sessao={sessao}
                  aberta={sessaoAberta === sessao.id}
                  leituras={leiturasPorSessao[sessao.id] ?? []}
                  onPress={() => alternarSessao(sessao.id)}
                  onOpcoes={() => abrirOpcoesSessao(sessao)}
                  onExcluirLeitura={(leitura) => confirmarExclusaoLeitura(sessao.id, leitura)}
                />
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Modal editar nota da sessão */}
      <Modal
        visible={sessaoEditandoNota !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setSessaoEditandoNota(null)}
      >
        <View style={styles.modalFundo}>
          <ThemedView style={[styles.modalCaixa, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="subtitle">Nota da sessão</ThemedText>
            <TextInput
              value={notaEdicao}
              onChangeText={setNotaEdicao}
              placeholder="Escreva aqui a observação clínica..."
              placeholderTextColor={theme.textMuted}
              multiline
              autoFocus
              style={[styles.notaInput, { backgroundColor: theme.backgroundSelected, color: theme.text }]}
            />
            <View style={styles.modalBotoes}>
              <Pressable onPress={() => setSessaoEditandoNota(null)} style={styles.modalBotaoCancelar}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Cancelar
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={salvarNotaEditada}
                style={[styles.modalBotaoSalvar, { backgroundColor: theme.accent }]}
              >
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  Salvar nota
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

function ResumoCard({
  icone,
  cor,
  rotulo,
  valor,
  unidade,
}: {
  icone: string;
  cor: string;
  rotulo: string;
  valor: string;
  unidade?: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.resumoCard, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.resumoTopo}>
        <MaterialSymbol name={icone} size={16} color={cor} />
      </View>
      <ThemedText type="label" themeColor="textMuted">
        {rotulo}
      </ThemedText>
      <View style={styles.resumoValorLinha}>
        <ThemedText type="metricMd" style={{ fontSize: 22, lineHeight: 26 }}>
          {valor}
        </ThemedText>
        {unidade ? (
          <ThemedText type="small" themeColor="textMuted">
            {unidade}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

function SessaoItem({
  sessao,
  aberta,
  leituras,
  onPress,
  onOpcoes,
  onExcluirLeitura,
}: {
  sessao: ResumoSessao;
  aberta: boolean;
  leituras: Leitura[];
  onPress: () => void;
  onOpcoes: () => void;
  onExcluirLeitura: (leitura: Leitura) => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.sessaoCard, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.sessaoTopo}>
        <View style={styles.sessaoTopoEsq}>
          <ThemedText type="smallBold">{formatarData(sessao.iniciada_em)}</ThemedText>
          {!sessao.finalizada_em ? (
            <ThemedText type="label" themeColor="accent">
              Em andamento
            </ThemedText>
          ) : null}
        </View>
        <Pressable onPress={onOpcoes} hitSlop={10} style={styles.sessaoBotaoOpcoes}>
          <MaterialSymbol name="more_vert" size={20} color={theme.textMuted} />
        </Pressable>
        <MaterialSymbol
          name="expand_more"
          size={20}
          color={theme.textMuted}
          style={{ transform: [{ rotate: aberta ? '180deg' : '0deg' }] }}
        />
      </View>

      <View style={[styles.sessaoMetricas, { backgroundColor: theme.backgroundSelected }]}>
        <Metrica label="Borg" valor={media(sessao.media_borg)} />
        <Metrica label="OMNI" valor={media(sessao.media_omni)} />
        <Metrica label="Dor" valor={media(sessao.media_dor)} />
        <Metrica label="FC" valor={sessao.media_fc ? `${Math.round(sessao.media_fc)} bpm` : '—'} />
      </View>

      {sessao.nota ? (
        <ThemedText type="small" themeColor="textSecondary">
          {sessao.nota}
        </ThemedText>
      ) : null}

      {aberta ? (
        <View style={[styles.sessaoDetalhe, { borderTopColor: theme.border }]}>
          <ThemedText type="label" themeColor="textMuted">
            Leituras cronológicas
          </ThemedText>
          {leituras.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Sem leituras registradas.
            </ThemedText>
          ) : (
            leituras.map((l) => (
              <View key={l.id} style={styles.leituraLinha}>
                <ThemedText type="small" themeColor="textSecondary">
                  {new Date(l.registrada_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  {l.tipo.toUpperCase()}
                </ThemedText>
                <View style={styles.leituraLinhaDir}>
                  <ThemedText type="small" themeColor="text">
                    {l.tipo === 'fc' ? `${Math.round(l.valor)} bpm` : l.valor}
                  </ThemedText>
                  <Pressable onPress={() => onExcluirLeitura(l)} hitSlop={10}>
                    <MaterialSymbol name="delete_outline" size={16} color={theme.textMuted} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      ) : null}
    </Pressable>
  );
}

function Metrica({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.metrica}>
      <ThemedText type="label" themeColor="textMuted">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{valor}</ThemedText>
    </View>
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
  headerAcao: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing.three, gap: Spacing.three },
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.three },
  identidade: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  botaoIniciar: {
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bento: { flexDirection: 'row', gap: Spacing.two },
  resumoCard: { flex: 1, borderRadius: Radius.lg, padding: Spacing.two, gap: 2 },
  resumoTopo: { flexDirection: 'row', justifyContent: 'flex-end' },
  resumoValorLinha: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center' },
  secao: { gap: Spacing.two },
  vazio: { paddingVertical: Spacing.four, alignItems: 'center' },
  sessaoCard: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two },
  sessaoTopo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  sessaoTopoEsq: { flex: 1, gap: 2 },
  sessaoBotaoOpcoes: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  sessaoMetricas: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, borderRadius: Radius.md, padding: Spacing.two },
  metrica: { gap: 2 },
  sessaoDetalhe: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.two, gap: Spacing.one },
  leituraLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leituraLinhaDir: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  modalFundo: { flex: 1, backgroundColor: 'rgba(11,15,18,0.75)', justifyContent: 'center', padding: Spacing.four },
  modalCaixa: { borderRadius: Radius.lg, padding: Spacing.four, gap: Spacing.three },
  notaInput: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    fontSize: 16,
    minHeight: 96,
    textAlignVertical: 'top',
  },
  modalBotoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.three },
  modalBotaoCancelar: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
  modalBotaoSalvar: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.four, borderRadius: Radius.md },
});
