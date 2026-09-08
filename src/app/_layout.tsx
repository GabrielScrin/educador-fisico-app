import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { SQLiteProvider } from 'expo-sqlite';
import { useColorScheme } from 'react-native';

import { MIGRATIONS } from '@/db/schema';

async function migrar(db: SQLiteDatabase) {
  for (const statement of MIGRATIONS) {
    await db.execAsync(statement);
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SQLiteProvider databaseName="educador-fisico.db" onInit={migrar}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Clientes' }} />
          <Stack.Screen
            name="cliente/novo"
            options={{ title: 'Novo cliente', presentation: 'modal' }}
          />
          <Stack.Screen name="cliente/[id]" options={{ title: 'Cliente' }} />
          <Stack.Screen
            name="sessao/[id]"
            options={{ title: 'Sessão', headerBackVisible: false, gestureEnabled: false }}
          />
        </Stack>
      </ThemeProvider>
    </SQLiteProvider>
  );
}
