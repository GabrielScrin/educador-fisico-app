import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { listarClientes, type Cliente } from '@/db/queries';
import { useTheme } from '@/hooks/use-theme';

export default function ListaClientes() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');

  useFocusEffect(
    useCallback(() => {
      listarClientes(db, busca).then(setClientes);
    }, [db, busca]),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.buscaWrap}>
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar cliente"
            placeholderTextColor={theme.textSecondary}
            style={[styles.busca, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          />
        </View>

        <FlatList
          data={clientes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <ThemedText type="small" themeColor="textSecondary">
                Nenhum cliente ainda. Toque em "Novo cliente" para começar.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <Link href={{ pathname: '/cliente/[id]', params: { id: String(item.id) } }} asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.item,
                  { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <ThemedText type="smallBold">{item.nome}</ThemedText>
                {item.contato ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.contato}
                  </ThemedText>
                ) : null}
              </Pressable>
            </Link>
          )}
        />

        <Link href="/cliente/novo" asChild>
          <Pressable style={[styles.botaoNovo, { backgroundColor: theme.accent }]}>
            <ThemedText type="smallBold" style={{ color: '#F4EFE8' }}>
              + Novo cliente
            </ThemedText>
          </Pressable>
        </Link>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  buscaWrap: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  busca: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  lista: { padding: Spacing.three, gap: Spacing.two, flexGrow: 1 },
  vazio: { paddingTop: Spacing.six, alignItems: 'center' },
  item: { borderRadius: Spacing.two, padding: Spacing.three, gap: 2 },
  botaoNovo: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
});
