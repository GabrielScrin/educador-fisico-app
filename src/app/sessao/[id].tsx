import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { AvatarInitials } from '@/components/avatar-initials';
import { MaterialSymbol } from '@/components/material-symbol';
import { ScalePicker } from '@/components/scale-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { ESCALAS, faixaDoValor, type TipoEscala } from '@/constants/scales';
import { TrendChart } from '@/components/trend-chart';
import {
  atualizarLeitura,
  atualizarNotaSessao,
  buscarCliente,
  buscarSessao,
  excluirLeitura,
  listarLeituras,
  registrarLeitura,
  type Cliente,
  type Leitura,
  type Sessao,
} from '@/db/queries';
import { formatarDuracao, useCountUpTimer, useElapsedSeconds } from '@/hooks/use-elapsed-timer';
import { useMonitorFrequenciaCardiaca } from '@/hooks/use-heart-rate-monitor';
import { useTheme } from '@/hooks/use-theme';
import { transcreverAudio } from '@/lib/transcricao';

const ICONE_TIPO: Record<Leitura['tipo'], string> = {
  borg: 'directions_run',
  omni: 'fitness_center',
  dor: 'healing',
  fc: 'monitor_heart',
};

const NOME_TIPO: Record<Leitura['tipo'], string> = {
  borg: 'Borg CR10',
  omni: 'OMNI-RES',
  dor: 'Dor / NPRS',
  fc: 'Frequência cardíaca',
};

function horario(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function SessaoAoVivo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessaoId = Number(id);
  const db = useSQLiteContext();
  const theme = useTheme();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [escalaAberta, setEscalaAberta] = useState<TipoEscala | null>(null);
  const [fcAberta, setFcAberta] = useState(false);
  const [fcValor, setFcValor] = useState('');
  const [notaAberta, setNotaAberta] = useState(false);
  const [nota, setNota] = useState('');
  const [leituraEditando, setLeituraEditando] = useState<Leitura | null>(null);
  const monitorFc = useMonitorFrequenciaCardiaca();
  const gravadorNota = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const estadoGravadorNota = useAudioRecorderState(gravadorNota);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const [erroTranscricao, setErroTranscricao] = useState<string | null>(null);

  const tempoTotal = useElapsedSeconds(sessao?.iniciada_em ?? null);
  const { segundos: intervalo, zerar: zerarIntervalo } = useCountUpTimer();

  useFocusEffect(
    useCallback(() => {
      buscarSessao(db, sessaoId).then((s) => {
        setSessao(s);
        setNota(s?.nota ?? '');
        if (s) buscarCliente(db, s.cliente_id).then(setCliente);
      });
      atualizarLeituras();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db, sessaoId]),
  );

  function atualizarLeituras() {
    listarLeituras(db, sessaoId).then(setLeituras);
  }


  async function registrar(tipo: TipoEscala, valor: number) {
    if (leituraEditando) {
      await atualizarLeitura(db, leituraEditando.id, valor);
    } else {
      await registrarLeitura(db, sessaoId, tipo, valor);
    }
    setEscalaAberta(null);
    setLeituraEditando(null);
    atualizarLeituras();
  }

  async function registrarFc() {
    const valor = Number(fcValor);
    if (!valor || valor <= 0) return;
    if (leituraEditando) {
      await atualizarLeitura(db, leituraEditando.id, valor);
    } else {
      await registrarLeitura(db, sessaoId, 'fc', valor);
    }
    setFcValor('');
    setFcAberta(false);
    setLeituraEditando(null);
    atualizarLeituras();
  }

  function abrirEdicaoLeitura(leitura: Leitura) {
    setLeituraEditando(leitura);
    if (leitura.tipo === 'fc') {
      setFcValor(String(Math.round(leitura.valor)));
      setFcAberta(true);
    } else {
      setEscalaAberta(leitura.tipo as TipoEscala);
    }
  }

  function confirmarExclusaoLeitura(leitura: Leitura) {
    Alert.alert('Excluir registro', 'Remove esse registro da sessão. Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await excluirLeitura(db, leitura.id);
          atualizarLeituras();
        },
      },
    ]);
  }

  async function salvarNota() {
    await atualizarNotaSessao(db, sessaoId, nota);
    setNotaAberta(false);
  }

  function fecharNota() {
    if (estadoGravadorNota.isRecording) gravadorNota.stop().catch(() => {});
    setErroTranscricao(null);
    setNotaAberta(false);
  }

  // Transcrição de voz na nota (Whisper via Edge Function, ver src/lib/transcricao.ts). Não
  // testado em device físico ainda — expo-audio exige módulo nativo, mesma build EAS pendente
  // do BLE (ver PASSAGEM_DE_PLANTAO.md).
  async function iniciarGravacaoNota() {
    setErroTranscricao(null);
    const permissao = await AudioModule.requestRecordingPermissionsAsync();
    if (!permissao.granted) {
      setErroTranscricao('Permissão de microfone negada.');
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await gravadorNota.prepareToRecordAsync();
    gravadorNota.record();
  }

  async function pararGravacaoNota() {
    await gravadorNota.stop();
    const uri = gravadorNota.uri;
    if (!uri) return;
    setTranscrevendo(true);
    try {
      const texto = await transcreverAudio(uri);
      if (texto) setNota((atual) => (atual.trim() ? `${atual.trim()}\n${texto}` : texto));
    } catch (e) {
      setErroTranscricao(e instanceof Error ? e.message : 'Falha ao transcrever o áudio.');
    } finally {
      setTranscrevendo(false);
    }
  }

  const leiturasRecentes = useMemo(() => leituras.slice().reverse(), [leituras]);

  const ultimoValor = useMemo(() => {
    const mapa: Partial<Record<Leitura['tipo'], number>> = {};
    for (const l of leituras) mapa[l.tipo] = l.valor; // já em ordem cronológica: sobrescreve com o mais recente
    return mapa;
  }, [leituras]);

  const mediaBorg = useMemo(() => media(leituras, 'borg'), [leituras]);
  const picoDor = useMemo(() => pico(leituras, 'dor'), [leituras]);
  const curvaEsforco = useMemo(
    () => leituras.filter((l) => l.tipo === 'borg' || l.tipo === 'omni').map((l) => l.valor),
    [leituras],
  );

  function irParaResumo() {
    router.push({ pathname: '/sessao/[id]/resumo', params: { id: String(sessaoId) } });
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBotaoVoltar}>
            <MaterialSymbol name="arrow_back" size={22} color={theme.textSecondary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <View style={styles.headerTopo}>
              <View style={[styles.pontoPulso, { backgroundColor: theme.accent }]} />
              <ThemedText type="label" themeColor="accent" numberOfLines={1} style={styles.headerLabel}>
                Sessão em andamento
              </ThemedText>
              <ThemedText type="smallBold" style={styles.headerTimer} numberOfLines={1}>
                {formatarDuracao(tempoTotal)}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {cliente?.nome ?? '—'}
            </ThemedText>
          </View>
          <Pressable
            onPress={irParaResumo}
            style={[styles.headerBotaoFinalizar, { backgroundColor: theme.danger }]}
          >
            <MaterialSymbol name="check_circle" size={16} color={theme.text} />
            <ThemedText type="smallBold">Finalizar</ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* HUD do cliente */}
          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.hudTopo}>
              <View style={styles.hudCliente}>
                <AvatarInitials nome={cliente?.nome ?? '?'} size={48} />
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle" numberOfLines={1}>
                    {cliente?.nome ?? 'Cliente'}
                  </ThemedText>
                  {cliente?.contato ? (
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {cliente.contato}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
              <View style={styles.hudTimers}>
                <View style={[styles.timerPill, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="label" themeColor="textMuted">
                    Tempo total
                  </ThemedText>
                  <ThemedText type="smallBold">{formatarDuracao(tempoTotal)}</ThemedText>
                </View>
                <View
                  style={[
                    styles.timerPill,
                    styles.timerPillIntervalo,
                    { backgroundColor: theme.backgroundSelected, borderColor: theme.secondary },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText type="label" themeColor="secondary">
                      Intervalo
                    </ThemedText>
                    <ThemedText type="smallBold" themeColor="secondary">
                      {formatarDuracao(intervalo)}
                    </ThemedText>
                  </View>
                  <Pressable onPress={zerarIntervalo} hitSlop={8}>
                    <MaterialSymbol name="restart_alt" size={18} color={theme.secondary} />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Micro telemetria */}
            <View style={styles.microGrid}>
              <MicroTelemetria
                icone="favorite"
                cor={theme.danger}
                rotulo="FC atual"
                valor={ultimoValor.fc ? `${Math.round(ultimoValor.fc)}` : '—'}
                unidade="BPM"
              />
              <MicroTelemetria
                icone="speed"
                cor={theme.accent}
                rotulo="Média Borg"
                valor={mediaBorg !== null ? mediaBorg.toFixed(1) : '—'}
                unidade="CR10"
              />
              <MicroTelemetria
                icone="warning"
                cor={theme.warning}
                rotulo="Pico dor"
                valor={picoDor !== null ? picoDor.toFixed(1) : '—'}
                unidade="NPRS"
              />
            </View>
          </View>

          {/* Curva de esforço */}
          {curvaEsforco.length > 1 ? (
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.linhaTitulo}>
                <MaterialSymbol name="show_chart" size={18} color={theme.secondary} />
                <ThemedText type="smallBold" style={{ flex: 1 }}>
                  Curva de esforço da sessão
                </ThemedText>
                <ThemedText type="label" themeColor="textSecondary">
                  Pico {Math.max(...curvaEsforco)}
                </ThemedText>
              </View>
              <TrendChart valores={curvaEsforco} cor={theme.secondary} />
            </View>
          ) : null}

          {/* Registros da sessão */}
          <View style={styles.secao}>
            <View style={styles.linhaTitulo}>
              <MaterialSymbol name="history" size={18} color={theme.textMuted} />
              <ThemedText type="label" themeColor="textSecondary" style={{ flex: 1 }}>
                Registros da sessão
              </ThemedText>
              <ThemedText type="small" themeColor="textMuted">
                {leituras.length} leituras
              </ThemedText>
            </View>
            {leiturasRecentes.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Nenhum registro ainda. Toque num cartão abaixo.
              </ThemedText>
            ) : (
              <View style={{ gap: Spacing.two }}>
                {leiturasRecentes.map((leitura) => {
                  const cor = corLeitura(leitura, theme);
                  return (
                    <Pressable
                      key={leitura.id}
                      onPress={() => abrirEdicaoLeitura(leitura)}
                      style={[styles.itemRegistro, { backgroundColor: theme.backgroundElement }]}
                    >
                      <View
                        style={[styles.iconeRegistro, { backgroundColor: theme.backgroundSelected }]}
                      >
                        <MaterialSymbol name={ICONE_TIPO[leitura.tipo]} size={18} color={cor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold">{NOME_TIPO[leitura.tipo]}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {rotuloLeitura(leitura)}
                        </ThemedText>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <ThemedText type="metricMd" style={{ color: cor, fontSize: 18, lineHeight: 22 }}>
                          {leitura.tipo === 'fc' ? Math.round(leitura.valor) : leitura.valor}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textMuted">
                          {horario(leitura.registrada_em)}
                        </ThemedText>
                      </View>
                      <Pressable
                        onPress={() => confirmarExclusaoLeitura(leitura)}
                        hitSlop={10}
                        style={styles.botaoExcluirRegistro}
                      >
                        <MaterialSymbol name="delete_outline" size={16} color={theme.textMuted} />
                      </Pressable>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Registro instantâneo 2x2 */}
          <View style={styles.secao}>
            <View style={styles.linhaTitulo}>
              <MaterialSymbol name="touch_app" size={18} color={theme.accent} />
              <ThemedText type="smallBold" style={{ flex: 1 }}>
                Registro instantâneo
              </ThemedText>
            </View>
            <View style={styles.grade2x2}>
              <TileEscala
                titulo="Borg CR10"
                subtitulo="Esforço aeróbio"
                cor={theme.accent}
                icone="directions_run"
                valor={ultimoValor.borg}
                onPress={() => setEscalaAberta('borg')}
              />
              <TileEscala
                titulo="OMNI-RES"
                subtitulo="Esforço de força"
                cor={theme.secondary}
                icone="fitness_center"
                valor={ultimoValor.omni}
                onPress={() => setEscalaAberta('omni')}
              />
              <TileEscala
                titulo="Dor (NPRS)"
                subtitulo="Autorrelato 0–10"
                cor={theme.warning}
                icone="healing"
                valor={ultimoValor.dor}
                onPress={() => setEscalaAberta('dor')}
              />
              <TileEscala
                titulo="Frequência"
                subtitulo="Registrar bpm"
                cor={theme.danger}
                icone="favorite"
                valor={ultimoValor.fc}
                unidade="BPM"
                onPress={() => setFcAberta(true)}
              />
            </View>
          </View>
        </ScrollView>

        {/* Barra inferior */}
        <View style={[styles.barraInferior, { borderTopColor: theme.border }]}>
          <Pressable
            onPress={zerarIntervalo}
            style={[styles.botaoBarra, styles.botaoBarraLargo, { backgroundColor: theme.backgroundElement }]}
          >
            <MaterialSymbol name="timer" size={20} color={theme.secondary} />
            <View>
              <ThemedText type="label" themeColor="textMuted">
                Descanso
              </ThemedText>
              <ThemedText type="smallBold">Zerar intervalo</ThemedText>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setNotaAberta(true)}
            style={[styles.botaoBarra, styles.botaoBarraIcone, { backgroundColor: theme.backgroundElement }]}
          >
            <MaterialSymbol name="edit_note" size={22} color={theme.textSecondary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScalePicker
        visivel={escalaAberta !== null}
        escala={escalaAberta ? ESCALAS[escalaAberta] : null}
        onFechar={() => {
          setEscalaAberta(null);
          setLeituraEditando(null);
        }}
        onSelecionar={(valor) => escalaAberta && registrar(escalaAberta, valor)}
      />

      {/* Modal FC */}
      <Modal
        visible={fcAberta}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setFcAberta(false);
          setLeituraEditando(null);
        }}
      >
        <View style={styles.modalFundo}>
          <ThemedView style={[styles.modalCaixa, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="subtitle">
              {leituraEditando ? 'Editar frequência cardíaca' : 'Frequência cardíaca'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Digite o bpm {leituraEditando ? 'corrigido' : 'atual'}
              {!leituraEditando && Platform.OS !== 'web'
                ? ', ou conecte um monitor Bluetooth abaixo.'
                : '.'}
            </ThemedText>

            {!leituraEditando && Platform.OS !== 'web' && (
              <View style={[styles.blocoBluetooth, { backgroundColor: theme.backgroundSelected }]}>
                {monitorFc.estado === 'desconectado' && (
                  <Pressable onPress={monitorFc.iniciarScan} style={styles.itemDispositivo}>
                    <MaterialSymbol name="bluetooth_searching" size={16} color={theme.accent} />
                    <ThemedText type="small" style={{ color: theme.accent, flex: 1 }}>
                      Conectar monitor Bluetooth
                    </ThemedText>
                  </Pressable>
                )}

                {monitorFc.estado === 'procurando' && (
                  <>
                    <View style={styles.itemDispositivo}>
                      <MaterialSymbol name="bluetooth_searching" size={16} color={theme.textSecondary} />
                      <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
                        Procurando monitores próximos...
                      </ThemedText>
                      <Pressable onPress={monitorFc.pararScan}>
                        <ThemedText type="small" themeColor="textMuted">
                          Cancelar
                        </ThemedText>
                      </Pressable>
                    </View>
                    {monitorFc.dispositivos.map((dispositivo) => (
                      <Pressable
                        key={dispositivo.id}
                        onPress={() => monitorFc.conectar(dispositivo)}
                        style={styles.itemDispositivo}
                      >
                        <MaterialSymbol name="bluetooth" size={16} color={theme.accent} />
                        <ThemedText type="small" style={{ flex: 1 }}>
                          {dispositivo.name ?? dispositivo.id}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </>
                )}

                {monitorFc.estado === 'conectando' && (
                  <View style={styles.itemDispositivo}>
                    <MaterialSymbol name="bluetooth_searching" size={16} color={theme.textSecondary} />
                    <ThemedText type="small" themeColor="textSecondary">
                      Conectando...
                    </ThemedText>
                  </View>
                )}

                {monitorFc.estado === 'conectado' && (
                  <>
                    <Pressable
                      onPress={() => monitorFc.bpm != null && setFcValor(String(monitorFc.bpm))}
                      disabled={monitorFc.bpm == null}
                      style={styles.itemDispositivo}
                    >
                      <MaterialSymbol name="bluetooth_connected" size={16} color={theme.danger} />
                      <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
                        {monitorFc.bpm != null
                          ? `Monitor conectado — toque para usar ${monitorFc.bpm} bpm`
                          : 'Monitor conectado — aguardando leitura...'}
                      </ThemedText>
                    </Pressable>
                    <Pressable onPress={monitorFc.desconectar} style={styles.itemDispositivo}>
                      <ThemedText type="small" style={{ color: theme.danger }}>
                        Desconectar
                      </ThemedText>
                    </Pressable>
                  </>
                )}

                {monitorFc.estado === 'erro' && (
                  <View style={styles.itemDispositivo}>
                    <MaterialSymbol name="bluetooth_disabled" size={16} color={theme.danger} />
                    <ThemedText type="small" style={{ color: theme.danger, flex: 1 }}>
                      {monitorFc.erro ?? 'Falha no Bluetooth.'}
                    </ThemedText>
                    <Pressable onPress={monitorFc.iniciarScan}>
                      <ThemedText type="small" style={{ color: theme.accent }}>
                        Tentar de novo
                      </ThemedText>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            <TextInput
              value={fcValor}
              onChangeText={setFcValor}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={theme.textMuted}
              autoFocus
              style={[styles.fcInput, { backgroundColor: theme.backgroundSelected, color: theme.text }]}
            />
            <View style={styles.modalBotoes}>
              <Pressable
                onPress={() => {
                  setFcAberta(false);
                  setLeituraEditando(null);
                }}
                style={styles.modalBotaoCancelar}
              >
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Cancelar
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={registrarFc}
                style={[styles.modalBotaoSalvar, { backgroundColor: theme.accent }]}
              >
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  Salvar
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>

      {/* Modal Nota */}
      <Modal visible={notaAberta} animationType="fade" transparent onRequestClose={fecharNota}>
        <View style={styles.modalFundo}>
          <ThemedView style={[styles.modalCaixa, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="subtitle">Nota da sessão</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Ex.: reduziu carga no agachamento por dor no joelho.
            </ThemedText>

            <Pressable
              onPress={estadoGravadorNota.isRecording ? pararGravacaoNota : iniciarGravacaoNota}
              disabled={transcrevendo}
              style={[
                styles.botaoGravarNota,
                {
                  backgroundColor: estadoGravadorNota.isRecording
                    ? theme.danger
                    : theme.backgroundSelected,
                },
              ]}
            >
              {transcrevendo ? (
                <ActivityIndicator size="small" color={theme.accent} />
              ) : (
                <MaterialSymbol
                  name={estadoGravadorNota.isRecording ? 'stop_circle' : 'mic'}
                  size={18}
                  color={estadoGravadorNota.isRecording ? theme.text : theme.accent}
                />
              )}
              <ThemedText
                type="small"
                style={{ color: estadoGravadorNota.isRecording ? theme.text : theme.accent }}
              >
                {transcrevendo
                  ? 'Transcrevendo...'
                  : estadoGravadorNota.isRecording
                    ? 'Toque para parar e transcrever'
                    : 'Gravar nota por voz'}
              </ThemedText>
            </Pressable>
            {erroTranscricao && (
              <ThemedText type="small" style={{ color: theme.danger }}>
                {erroTranscricao}
              </ThemedText>
            )}

            <TextInput
              value={nota}
              onChangeText={setNota}
              placeholder="Escreva aqui a observação clínica..."
              placeholderTextColor={theme.textMuted}
              multiline
              autoFocus
              style={[styles.notaInput, { backgroundColor: theme.backgroundSelected, color: theme.text }]}
            />
            <View style={styles.modalBotoes}>
              <Pressable onPress={fecharNota} style={styles.modalBotaoCancelar}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Cancelar
                </ThemedText>
              </Pressable>
              <Pressable onPress={salvarNota} style={[styles.modalBotaoSalvar, { backgroundColor: theme.accent }]}>
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

function media(leituras: Leitura[], tipo: Leitura['tipo']) {
  const valores = leituras.filter((l) => l.tipo === tipo).map((l) => l.valor);
  if (valores.length === 0) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

function pico(leituras: Leitura[], tipo: Leitura['tipo']) {
  const valores = leituras.filter((l) => l.tipo === tipo).map((l) => l.valor);
  if (valores.length === 0) return null;
  return Math.max(...valores);
}

function rotuloLeitura(leitura: Leitura) {
  if (leitura.tipo === 'fc') return `${Math.round(leitura.valor)} bpm`;
  const escala = ESCALAS[leitura.tipo as TipoEscala];
  return `${leitura.valor} — ${faixaDoValor(escala, leitura.valor).rotulo}`;
}

function corLeitura(leitura: Leitura, theme: ReturnType<typeof useTheme>) {
  if (leitura.tipo === 'fc') return theme.danger;
  const escala = ESCALAS[leitura.tipo as TipoEscala];
  return faixaDoValor(escala, leitura.valor).cor;
}

function MicroTelemetria({
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
  unidade: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.microCard, { backgroundColor: theme.backgroundSelected }]}>
      <View style={styles.microTopo}>
        <MaterialSymbol name={icone} size={13} color={cor} />
        <ThemedText type="label" themeColor="textMuted">
          {rotulo}
        </ThemedText>
      </View>
      <View style={styles.microValor}>
        <ThemedText type="metricMd" style={{ fontSize: 20, lineHeight: 24 }}>
          {valor}
        </ThemedText>
        <ThemedText type="small" themeColor="textMuted">
          {unidade}
        </ThemedText>
      </View>
    </View>
  );
}

function TileEscala({
  titulo,
  subtitulo,
  cor,
  icone,
  valor,
  unidade = '/10',
  onPress,
}: {
  titulo: string;
  subtitulo: string;
  cor: string;
  icone: string;
  valor?: number;
  unidade?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const segmentos = 10;
  const preenchidos = valor !== undefined ? Math.round((Math.min(valor, 10) / 10) * segmentos) : 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
      ]}
    >
      <View style={styles.tileTopo}>
        <MaterialSymbol name={icone} size={20} color={cor} />
      </View>
      <ThemedText type="small" themeColor="textMuted">
        {titulo}
      </ThemedText>
      <View style={styles.tileValorLinha}>
        <ThemedText type="metric" style={{ color: cor, fontSize: 30, lineHeight: 34 }}>
          {valor !== undefined ? valor : '—'}
        </ThemedText>
        <ThemedText type="small" themeColor="textMuted">
          {unidade}
        </ThemedText>
      </View>
      <View style={styles.tileBarras}>
        {Array.from({ length: unidade === '/10' ? segmentos : 0 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.tileBarra,
              { backgroundColor: i < preenchidos ? cor : theme.backgroundSelected },
            ]}
          />
        ))}
      </View>
    </Pressable>
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
  headerBotaoVoltar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTopo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  pontoPulso: { width: 6, height: 6, borderRadius: 3 },
  headerLabel: { flexShrink: 1 },
  headerTimer: { marginLeft: 'auto', flexShrink: 0, fontVariant: ['tabular-nums'] },
  headerBotaoFinalizar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
    height: 36,
    borderRadius: Radius.sm,
  },
  scroll: { padding: Spacing.three, gap: Spacing.three, flexGrow: 1 },
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two },
  hudTopo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  hudCliente: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1, minWidth: 140 },
  hudTimers: { flexDirection: 'row', gap: Spacing.one, flexBasis: '100%' },
  timerPill: {
    flex: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    alignItems: 'center',
  },
  timerPillIntervalo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
  },
  microGrid: { flexDirection: 'row', gap: Spacing.one, marginTop: Spacing.one },
  microCard: { flex: 1, borderRadius: Radius.sm, padding: Spacing.two, gap: 2 },
  microTopo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  microValor: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  secao: { gap: Spacing.two },
  itemRegistro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    padding: Spacing.two,
  },
  iconeRegistro: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  botaoExcluirRegistro: { paddingLeft: Spacing.two, alignSelf: 'stretch', justifyContent: 'center' },
  grade2x2: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 112,
    borderRadius: Radius.lg,
    padding: Spacing.two,
    gap: 4,
  },
  tileTopo: { flexDirection: 'row', justifyContent: 'flex-end' },
  tileValorLinha: { flexDirection: 'row', alignItems: 'baseline', gap: 4, justifyContent: 'space-between' },
  tileBarras: { flexDirection: 'row', gap: 2, marginTop: 4 },
  tileBarra: { flex: 1, height: 5, borderRadius: 2 },
  barraInferior: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  botaoBarra: {
    minHeight: 58,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoBarraLargo: { flex: 1, flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.three },
  botaoBarraIcone: { width: 58 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(11,15,18,0.75)', justifyContent: 'center', padding: Spacing.four },
  modalCaixa: { borderRadius: Radius.lg, padding: Spacing.four, gap: Spacing.three },
  fcInput: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 32,
    textAlign: 'center',
  },
  blocoBluetooth: { borderRadius: Radius.md, gap: 1, overflow: 'hidden' },
  botaoGravarNota: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    padding: Spacing.two,
  },
  itemDispositivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
  },
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
