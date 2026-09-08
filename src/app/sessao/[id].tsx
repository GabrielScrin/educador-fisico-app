import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ScalePicker } from '@/components/scale-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ESCALAS, faixaDoValor, type TipoEscala } from '@/constants/scales';
import {
  buscarCliente,
  buscarSessao,
  finalizarSessao,
  listarLeituras,
  registrarLeitura,
  type Cliente,
  type Leitura,
} from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';

const COR_FC = '#4F6B9B';

function horario(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function rotuloLeitura(leitura: Leitura) {
  if (leitura.tipo === 'fc') return `${Math.round(leitura.valor)} bpm`;
  const escala = ESCALAS[leitura.tipo as TipoEscala];
  return `${leitura.valor} — ${faixaDoValor(escala, leitura.valor).rotulo}`;
}

function corLeitura(leitura: Leitura) {
  if (leitura.tipo === 'fc') return COR_FC;
  const escala = ESCALAS[leitura.tipo as TipoEscala];
  return faixaDoValor(escala, leitura.valor).cor;
}

const NOME_TIPO: Record<Leitura['tipo'], string> = {
  borg: 'Borg',
  omni: 'OMNI',
  dor: 'Dor',
  fc: 'FC',
};

export default function SessaoAoVivo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessaoId = Number(id);
  const db = useSQLiteContext();
  const theme = useTheme();
  const navigation = useNavigation();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [escalaAberta, setEscalaAberta] = useState<TipoEscala | null>(null);
  const [fcAberta, setFcAberta] = useState(false);
  const [fcValor, setFcValor] = useState('');
  const [nota, setNota] = useState('');
  const [finalizando, setFinalizando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      buscarSessao(db, sessaoId).then((sessao) => {
        if (!sessao) return;
        buscarCliente(db, sessao.cliente_id).then((c) => {
          setCliente(c);
          navigation.setOptions({ title: c ? `Sessão · ${c.nome}` : 'Sessão' });
        });
      });
      atualizarLeituras();
    }, [db, sessaoId, navigation]),
  );

  function atualizarLeituras() {
    listarLeituras(db, sessaoId).then((r) => setLeituras(r.slice().reverse()));
  }

  async function registrar(tipo: TipoEscala, valor: number) {
    await registrarLeitura(db, sessaoId, tipo, valor);
    setEscalaAberta(null);
    atualizarLeituras();
  }

  async function registrarFc() {
    const valor = Number(fcValor);
    if (!valor || valor <= 0) return;
    await registrarLeitura(db, sessaoId, 'fc', valor);
    setFcValor('');
    setFcAberta(false);
    atualizarLeituras();
  }

  async function finalizar() {
    if (finalizando) return;
    setFinalizando(true);
    await finalizarSessao(db, sessaoId, nota || null);
    router.back();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.grade}>
            <Tile
              titulo="Borg"
              subtitulo="Esforço aeróbio"
              cor={ESCALAS.borg.faixas[3].cor}
              onPress={() => setEscalaAberta('borg')}
            />
            <Tile
              titulo="OMNI"
              subtitulo="Esforço de força"
              cor={ESCALAS.omni.faixas[3].cor}
              onPress={() => setEscalaAberta('omni')}
            />
            <Tile
              titulo="Dor"
              subtitulo="NPRS 0–10"
              cor={ESCALAS.dor.faixas[1].cor}
              onPress={() => setEscalaAberta('dor')}
            />
            <Tile titulo="FC" subtitulo="Registrar bpm" cor={COR_FC} onPress={() => setFcAberta(true)} />
          </View>

          <View style={styles.campo}>
            <ThemedText type="small" themeColor="textSecondary">
              Nota da sessão (opcional)
            </ThemedText>
            <TextInput
              value={nota}
              onChangeText={setNota}
              placeholder="Ex.: reduziu carga no agachamento por dor no joelho"
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            />
          </View>

          <View style={styles.timeline}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.tituloTimeline}>
              Registros desta sessão
            </ThemedText>
            {leituras.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Nenhum registro ainda. Toque num cartão acima.
              </ThemedText>
            ) : (
              leituras.map((leitura) => (
                <View
                  key={leitura.id}
                  style={[styles.linhaTimeline, { borderLeftColor: corLeitura(leitura) }]}
                >
                  <ThemedText type="small" themeColor="textSecondary" style={styles.horaTimeline}>
                    {horario(leitura.registrada_em)}
                  </ThemedText>
                  <ThemedText type="smallBold">{NOME_TIPO[leitura.tipo]}</ThemedText>
                  <ThemedText type="small">{rotuloLeitura(leitura)}</ThemedText>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <Pressable
          onPress={finalizar}
          disabled={finalizando}
          style={[styles.botaoFinalizar, { backgroundColor: theme.accent, opacity: finalizando ? 0.6 : 1 }]}
        >
          <ThemedText type="smallBold" style={{ color: '#F4EFE8' }}>
            Finalizar sessão
          </ThemedText>
        </Pressable>
      </SafeAreaView>

      <ScalePicker
        visivel={escalaAberta !== null}
        escala={escalaAberta ? ESCALAS[escalaAberta] : null}
        onFechar={() => setEscalaAberta(null)}
        onSelecionar={(valor) => escalaAberta && registrar(escalaAberta, valor)}
      />

      <Modal visible={fcAberta} animationType="fade" transparent onRequestClose={() => setFcAberta(false)}>
        <View style={styles.fcFundo}>
          <ThemedView style={styles.fcCaixa}>
            <ThemedText type="subtitle">Frequência cardíaca</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Digite o bpm atual (integração automática com sensor Bluetooth vem numa próxima versão).
            </ThemedText>
            <TextInput
              value={fcValor}
              onChangeText={setFcValor}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              autoFocus
              style={[styles.fcInput, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            />
            <View style={styles.fcBotoes}>
              <Pressable onPress={() => setFcAberta(false)} style={styles.fcBotaoCancelar}>
                <ThemedText type="smallBold">Cancelar</ThemedText>
              </Pressable>
              <Pressable
                onPress={registrarFc}
                style={[styles.fcBotaoSalvar, { backgroundColor: theme.accent }]}
              >
                <ThemedText type="smallBold" style={{ color: '#F4EFE8' }}>
                  Salvar
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

function Tile({
  titulo,
  subtitulo,
  cor,
  onPress,
}: {
  titulo: string;
  subtitulo: string;
  cor: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: theme.backgroundElement, borderColor: cor, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <ThemedText type="title" style={[styles.tileTitulo, { color: cor }]}>
        {titulo}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {subtitulo}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: Spacing.three, gap: Spacing.four, flexGrow: 1 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  tile: {
    flexBasis: '46%',
    flexGrow: 1,
    borderRadius: Spacing.three,
    borderWidth: 2,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    gap: 4,
    minHeight: 120,
    justifyContent: 'center',
  },
  tileTitulo: { fontSize: 32, lineHeight: 36 },
  campo: { gap: Spacing.one },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  timeline: { gap: Spacing.two },
  tituloTimeline: { textTransform: 'uppercase', letterSpacing: 0.5 },
  linhaTimeline: { borderLeftWidth: 4, paddingLeft: Spacing.two, paddingVertical: 2, gap: 1 },
  horaTimeline: {},
  botaoFinalizar: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  fcFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.four },
  fcCaixa: { borderRadius: Spacing.three, padding: Spacing.four, gap: Spacing.three },
  fcInput: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 32,
    textAlign: 'center',
  },
  fcBotoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.three },
  fcBotaoCancelar: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
  fcBotaoSalvar: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.four, borderRadius: Spacing.two },
});
