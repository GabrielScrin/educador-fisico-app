import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { MaterialSymbol } from '@/components/material-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { atualizarCliente, buscarCliente, excluirCliente } from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';

export default function EditarCliente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clienteId = Number(id);
  const db = useSQLiteContext();
  const theme = useTheme();
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [carregado, setCarregado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    buscarCliente(db, clienteId).then((cliente) => {
      if (cliente) {
        setNome(cliente.nome);
        setContato(cliente.contato ?? '');
      }
      setCarregado(true);
    });
  }, [db, clienteId]);

  async function salvar() {
    if (!nome.trim() || salvando) return;
    setSalvando(true);
    await atualizarCliente(db, clienteId, nome, contato || null);
    router.back();
  }

  function confirmarExclusao() {
    Alert.alert(
      'Excluir cliente',
      `Isso apaga "${nome}" e todo o histórico de sessões e leituras dele. Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await excluirCliente(db, clienteId);
            router.dismissTo('/');
          },
        },
      ],
    );
  }

  if (!carregado) return <ThemedView style={styles.container} />;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText type="subtitle">Editar cliente</ThemedText>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={[styles.headerBotao, { backgroundColor: theme.backgroundElement }]}
          >
            <MaterialSymbol name="close" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.form}>
          <View style={styles.campo}>
            <ThemedText type="label" themeColor="textMuted">
              Nome
            </ThemedText>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Nome do cliente"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            />
          </View>

          <View style={styles.campo}>
            <ThemedText type="label" themeColor="textMuted">
              Contato (opcional)
            </ThemedText>
            <TextInput
              value={contato}
              onChangeText={setContato}
              placeholder="WhatsApp, e-mail..."
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            />
          </View>

          <Pressable
            onPress={salvar}
            disabled={!nome.trim() || salvando}
            style={[
              styles.botao,
              { backgroundColor: theme.accent, opacity: !nome.trim() || salvando ? 0.5 : 1 },
            ]}
          >
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              Salvar alterações
            </ThemedText>
          </Pressable>

          <Pressable onPress={confirmarExclusao} style={styles.botaoExcluir} hitSlop={8}>
            <MaterialSymbol name="delete" size={18} color={theme.danger} />
            <ThemedText type="smallBold" style={{ color: theme.danger }}>
              Excluir cliente
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBotao: { width: 36, height: 36, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  form: { padding: Spacing.three, gap: Spacing.three },
  campo: { gap: Spacing.one },
  input: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  botao: {
    marginTop: Spacing.two,
    minHeight: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoExcluir: {
    flexDirection: 'row',
    gap: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
});
