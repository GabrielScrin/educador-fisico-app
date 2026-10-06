import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Substituto do Alert.alert. O Alert nativo não funciona no navegador (react-native-web ignora a
// chamada), então confirmações como "Sair" e "Excluir" ficavam sem efeito na web. Este diálogo é
// desenhado dentro do app e funciona igual no celular e no computador.
export type BotaoDialogo = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type Alertar = (titulo: string, mensagem?: string, botoes?: BotaoDialogo[]) => void;
type Estado = { titulo: string; mensagem?: string; botoes: BotaoDialogo[] };

const DialogoContext = createContext<Alertar>(() => {});

export function DialogoProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const [estado, setEstado] = useState<Estado | null>(null);

  const alertar = useCallback<Alertar>((titulo, mensagem, botoes) => {
    setEstado({ titulo, mensagem, botoes: botoes?.length ? botoes : [{ text: 'OK' }] });
  }, []);

  function escolher(botao: BotaoDialogo) {
    setEstado(null);
    botao.onPress?.();
  }

  const cancelar = estado?.botoes.find((b) => b.style === 'cancel');

  return (
    <DialogoContext.Provider value={alertar}>
      {children}
      <Modal visible={!!estado} transparent animationType="fade" onRequestClose={() => setEstado(null)}>
        <Pressable style={styles.fundo} onPress={() => (cancelar ? escolher(cancelar) : setEstado(null))}>
          <Pressable
            style={[styles.caixa, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            onPress={() => {}}
          >
            <ThemedText type="subtitle">{estado?.titulo}</ThemedText>
            {estado?.mensagem ? (
              <ThemedText type="small" themeColor="textSecondary">
                {estado.mensagem}
              </ThemedText>
            ) : null}
            <View style={styles.botoes}>
              {estado?.botoes.map((botao) => {
                const destrutivo = botao.style === 'destructive';
                const cancel = botao.style === 'cancel';
                return (
                  <Pressable
                    key={botao.text}
                    onPress={() => escolher(botao)}
                    style={[
                      styles.botao,
                      cancel
                        ? { borderColor: theme.border, borderWidth: 1 }
                        : { backgroundColor: destrutivo ? theme.danger : theme.accent },
                    ]}
                  >
                    <ThemedText
                      type="smallBold"
                      style={{ color: cancel ? theme.text : destrutivo ? theme.text : theme.onAccent }}
                    >
                      {botao.text}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </DialogoContext.Provider>
  );
}

export function useDialogo(): Alertar {
  return useContext(DialogoContext);
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  caixa: {
    width: '100%',
    maxWidth: 400,
    gap: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  botoes: { gap: Spacing.two, marginTop: Spacing.two },
  botao: {
    minHeight: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
