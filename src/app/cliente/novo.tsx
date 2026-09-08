import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
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
        <View style={styles.campo}>
          <ThemedText type="small" themeColor="textSecondary">
            Nome
          </ThemedText>
          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Nome do cliente"
            placeholderTextColor={theme.textSecondary}
            autoFocus
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          />
        </View>

        <View style={styles.campo}>
          <ThemedText type="small" themeColor="textSecondary">
            Contato (opcional)
          </ThemedText>
          <TextInput
            value={contato}
            onChangeText={setContato}
            placeholder="WhatsApp, e-mail..."
            placeholderTextColor={theme.textSecondary}
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
          <ThemedText type="smallBold" style={{ color: '#F4EFE8' }}>
            Salvar cliente
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.three, gap: Spacing.three },
  campo: { gap: Spacing.one },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  botao: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
});
