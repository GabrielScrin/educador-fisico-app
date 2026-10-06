import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AvatarInitials } from '@/components/avatar-initials';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { ClienteComResumo } from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';

// Versão de desktop da lista de clientes: uma linha por cliente, com colunas de leitura rápida.
// No celular a lista continua sendo de cartões (ver app/(tabs)/index.tsx).
type Props = {
  clientes: ClienteComResumo[];
  onAbrir: (cliente: ClienteComResumo) => void;
  onIniciar: (cliente: ClienteComResumo) => void;
  desabilitado: boolean;
};

function formatarUltimaSessao(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatarNota(valor: number | null): string {
  return valor === null ? '—' : valor.toFixed(1).replace('.', ',');
}

export function TabelaClientes({ clientes, onAbrir, onIniciar, desabilitado }: Props) {
  const theme = useTheme();

  return (
    <FlatList
      data={clientes}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.conteudo}
      ListHeaderComponent={
        <View style={[styles.linha, styles.cabecalho, { borderBottomColor: theme.border }]}>
          <ThemedText type="label" themeColor="textMuted" style={[styles.colunaNome]}>Cliente</ThemedText>
          <ThemedText type="label" themeColor="textMuted" style={styles.colunaContato}>Contato</ThemedText>
          <ThemedText type="label" themeColor="textMuted" style={styles.colunaData}>Última sessão</ThemedText>
          <ThemedText type="label" themeColor="textMuted" style={styles.colunaNota}>Esforço (OMNI)</ThemedText>
          <ThemedText type="label" themeColor="textMuted" style={styles.colunaNota}>Dor (NPRS)</ThemedText>
          <View style={styles.colunaAcao} />
        </View>
      }
      renderItem={({ item }) => {
        const dorAlta = (item.ultima_media_dor ?? 0) >= 4;
        return (
          <Pressable
            onPress={() => onAbrir(item)}
            style={({ hovered }) => [
              styles.linha,
              { borderBottomColor: theme.borderSubtle },
              hovered && { backgroundColor: theme.backgroundElement },
            ]}
          >
            <View style={[styles.colunaNome, styles.nomeLinha]}>
              <AvatarInitials nome={item.nome} size={32} />
              <ThemedText type="smallBold" numberOfLines={1} style={styles.nomeTexto}>
                {item.nome}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.colunaContato}>
              {item.contato ?? '—'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.colunaData}>
              {formatarUltimaSessao(item.ultima_sessao_em)}
            </ThemedText>
            <ThemedText type="smallBold" style={styles.colunaNota}>
              {formatarNota(item.ultima_media_omni)}
            </ThemedText>
            <ThemedText type="smallBold" style={[styles.colunaNota, { color: dorAlta ? theme.warning : theme.text }]}>
              {formatarNota(item.ultima_media_dor)}
            </ThemedText>
            <View style={styles.colunaAcao}>
              <Pressable
                disabled={desabilitado}
                onPress={() => onIniciar(item)}
                style={[styles.botaoIniciar, { backgroundColor: theme.accent, opacity: desabilitado ? 0.5 : 1 }]}
              >
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  Iniciar sessão
                </ThemedText>
              </Pressable>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  conteudo: { paddingBottom: Spacing.five },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
  },
  cabecalho: { paddingVertical: Spacing.two },
  colunaNome: { flex: 3, minWidth: 0 },
  colunaContato: { flex: 2, minWidth: 0 },
  colunaData: { flex: 1.5 },
  colunaNota: { flex: 1, textAlign: 'right' },
  colunaAcao: { flex: 1.6, alignItems: 'flex-end' },
  nomeLinha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  nomeTexto: { flex: 1 },
  botaoIniciar: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
  },
});
