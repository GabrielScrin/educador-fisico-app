import * as Linking from 'expo-linking';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { MaterialSymbol } from '@/components/material-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TrendChart } from '@/components/trend-chart';
import { Radius, Spacing } from '@/constants/theme';
import {
  buscarCliente,
  buscarSessao,
  finalizarSessao,
  listarLeituras,
  type Cliente,
  type Leitura,
  type Sessao,
} from '@/db/queries';
import { formatarDuracao, useElapsedSeconds } from '@/hooks/use-elapsed-timer';
import { useTheme } from '@/hooks/use-theme';

function mediaOu(valores: number[]) {
  if (valores.length === 0) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

function picoOu(valores: number[]) {
  return valores.length === 0 ? null : Math.max(...valores);
}

export default function ResumoSessao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessaoId = Number(id);
  const db = useSQLiteContext();
  const theme = useTheme();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [nota, setNota] = useState('');
  const [salvando, setSalvando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      buscarSessao(db, sessaoId).then((s) => {
        setSessao(s);
        setNota(s?.nota ?? '');
        if (s) buscarCliente(db, s.cliente_id).then(setCliente);
      });
      listarLeituras(db, sessaoId).then(setLeituras);
    }, [db, sessaoId]),
  );

  const porTipo = useMemo(() => {
    const mapa: Record<Leitura['tipo'], number[]> = { borg: [], omni: [], dor: [], fc: [] };
    for (const l of leituras) mapa[l.tipo].push(l.valor);
    return mapa;
  }, [leituras]);

  const mediaOmni = mediaOu(porTipo.omni);
  const mediaBorg = mediaOu(porTipo.borg);
  const picoDor = picoOu(porTipo.dor);
  const mediaFc = mediaOu(porTipo.fc);
  const picoFc = picoOu(porTipo.fc);

  const duracaoAoVivo = useElapsedSeconds(sessao && !sessao.finalizada_em ? sessao.iniciada_em : null);
  const duracaoSegundos = useMemo(() => {
    if (!sessao) return 0;
    if (!sessao.finalizada_em) return duracaoAoVivo;
    const inicio = new Date(sessao.iniciada_em).getTime();
    const fim = new Date(sessao.finalizada_em).getTime();
    return Math.max(0, Math.floor((fim - inicio) / 1000));
  }, [sessao, duracaoAoVivo]);

  const curva = useMemo(
    () => leituras.filter((l) => l.tipo === 'borg' || l.tipo === 'omni').map((l) => l.valor),
    [leituras],
  );

  async function consolidar() {
    if (salvando) return;
    setSalvando(true);
    await finalizarSessao(db, sessaoId, nota);
    router.dismissTo({ pathname: '/cliente/[id]', params: { id: String(sessao?.cliente_id ?? '') } });
  }

  function compartilharWhatsapp() {
    if (!cliente) return;
    const linhas = [
      `Olá ${cliente.nome.split(' ')[0]}! Resumo da sessão de hoje:`,
      mediaBorg !== null ? `- Esforço médio (Borg): ${mediaBorg.toFixed(1)}` : null,
      mediaOmni !== null ? `- Esforço médio (OMNI-RES): ${mediaOmni.toFixed(1)}` : null,
      picoDor !== null ? `- Pico de dor (NPRS): ${picoDor.toFixed(1)}` : null,
      picoFc !== null ? `- FC pico: ${Math.round(picoFc)} bpm` : null,
      `- Duração: ${formatarDuracao(duracaoSegundos)}`,
      nota.trim() ? `- Observação: ${nota.trim()}` : null,
    ].filter(Boolean);
    const texto = encodeURIComponent(linhas.join('\n'));
    Linking.openURL(`https://api.whatsapp.com/send?text=${texto}`).catch(() =>
      Alert.alert('Não foi possível abrir o WhatsApp'),
    );
  }

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
            <ThemedText type="subtitle">Resumo da sessão</ThemedText>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.statusLinha}>
              <View style={[styles.iconeStatus, { backgroundColor: theme.backgroundSelected }]}>
                <MaterialSymbol name="check_circle" size={26} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="label" themeColor="accent">
                  Pronto para consolidar
                </ThemedText>
                <ThemedText type="subtitle">{cliente?.nome ?? 'Sessão'}</ThemedText>
              </View>
            </View>
            <View style={[styles.metaLinha, { backgroundColor: theme.backgroundSelected }]}>
              <MetaItem icone="schedule" texto={sessao ? horario(sessao.iniciada_em) : '—'} />
              <MetaItem icone="timer" texto={formatarDuracao(duracaoSegundos)} cor={theme.secondary} />
            </View>
          </View>

          <View style={styles.bento}>
            <View style={[styles.card, styles.bentoLargo, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.linhaTitulo}>
                <MaterialSymbol name="speed" size={18} color={theme.secondary} />
                <ThemedText type="label" themeColor="textSecondary" style={{ flex: 1 }}>
                  Esforço médio (OMNI-RES)
                </ThemedText>
              </View>
              <ThemedText type="metric">{mediaOmni !== null ? mediaOmni.toFixed(1) : '—'}</ThemedText>
              {mediaBorg !== null ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Borg médio: {mediaBorg.toFixed(1)}
                </ThemedText>
              ) : null}
            </View>

            <View style={[styles.card, styles.bentoMeio, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="label" themeColor="textSecondary">
                Índice NPRS (pico)
              </ThemedText>
              <ThemedText type="metricMd" style={{ color: picoDor && picoDor >= 4 ? theme.warning : theme.text }}>
                {picoDor !== null ? picoDor.toFixed(1) : '—'}
              </ThemedText>
            </View>

            <View style={[styles.card, styles.bentoMeio, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="label" themeColor="textSecondary">
                Freq. cardíaca
              </ThemedText>
              <ThemedText type="metricMd">{mediaFc !== null ? Math.round(mediaFc) : '—'}</ThemedText>
              {picoFc !== null ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Pico: {Math.round(picoFc)} bpm
                </ThemedText>
              ) : null}
            </View>
          </View>

          {curva.length > 1 ? (
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="label" themeColor="textSecondary">
                Progressão da sessão
              </ThemedText>
              <TrendChart valores={curva} cor={theme.accent} />
            </View>
          ) : null}

          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.linhaTitulo}>
              <MaterialSymbol name="edit_note" size={18} color={theme.accent} />
              <ThemedText type="subtitle" style={{ flex: 1 }}>
                Conduta do educador
              </ThemedText>
            </View>
            <TextInput
              value={nota}
              onChangeText={setNota}
              placeholder="Registre adaptações e observações clínicas..."
              placeholderTextColor={theme.textMuted}
              multiline
              style={[styles.textarea, { backgroundColor: theme.backgroundSelected, color: theme.text }]}
            />
          </View>
        </ScrollView>

        <View style={[styles.rodape, { borderTopColor: theme.border }]}>
          <Pressable
            onPress={consolidar}
            disabled={salvando}
            style={[styles.botaoPrimario, { backgroundColor: theme.accent, opacity: salvando ? 0.6 : 1 }]}
          >
            <MaterialSymbol name="task_alt" size={20} color={theme.onAccent} />
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              {salvando ? 'Consolidando...' : 'Salvar no histórico e consolidar'}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={compartilharWhatsapp}
            style={[styles.botaoSecundario, { backgroundColor: theme.backgroundElement }]}
          >
            <MaterialSymbol name="send" size={18} color={theme.accent} />
            <ThemedText type="smallBold">Compartilhar com o aluno via WhatsApp</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function horario(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function MetaItem({ icone, texto, cor }: { icone: string; texto: string; cor?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.metaItem}>
      <MaterialSymbol name={icone} size={16} color={cor ?? theme.textMuted} />
      <ThemedText type="small" themeColor="textSecondary">
        {texto}
      </ThemedText>
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
  scroll: { padding: Spacing.three, gap: Spacing.three },
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two },
  statusLinha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconeStatus: { width: 56, height: 56, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  metaLinha: { flexDirection: 'row', gap: Spacing.four, borderRadius: Radius.md, padding: Spacing.two },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bento: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  bentoLargo: { flexBasis: '100%' },
  bentoMeio: { flexBasis: '47%', flexGrow: 1 },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  textarea: { borderRadius: Radius.md, padding: Spacing.three, fontSize: 16, minHeight: 96, textAlignVertical: 'top' },
  rodape: { gap: Spacing.two, padding: Spacing.three, borderTopWidth: StyleSheet.hairlineWidth },
  botaoPrimario: {
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoSecundario: {
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
