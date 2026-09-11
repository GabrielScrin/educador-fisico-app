import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { MaterialSymbol } from '@/components/material-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { criarCliente } from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';

export default function NovoCliente() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!nome.trim() || salvando) return;
    setSalvando(true);
    const id = await criarCliente(db, nome, contato || null);
    router.replace({ pathname: '/cliente/[id]', params: { id: String(id) } });
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText type="subtitle">Novo cliente</ThemedText>
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
              autoFocus
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
              Salvar cliente
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
});
