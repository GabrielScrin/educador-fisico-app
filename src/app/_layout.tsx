import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { MaterialSymbols_400Regular } from '@expo-google-fonts/material-symbols';
import { useFonts } from 'expo-font';
import { Stack, Theme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';
import { applyMigrations } from '@/db/migrate';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { SyncProvider } from '@/hooks/use-sync';

SplashScreen.preventAutoHideAsync();

const NAV_THEME: Theme = {
  dark: true,
  colors: {
    primary: Colors.dark.accent,
    background: Colors.dark.background,
    card: Colors.dark.backgroundElement,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.danger,
  },
  fonts: {
    regular: { fontFamily: 'Inter_400Regular', fontWeight: '400' },
    medium: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
    bold: { fontFamily: 'Inter_700Bold', fontWeight: '700' },
    heavy: { fontFamily: 'Inter_800ExtraBold', fontWeight: '800' },
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    MaterialSymbols_400Regular,
  });

  return (
    <SQLiteProvider databaseName="educador-fisico.db" onInit={applyMigrations}>
      <AuthProvider>
        <SyncProvider>
          <ThemeProvider value={NAV_THEME}>
            <StatusBar style="light" />
            <RootNavigator fontsLoaded={fontsLoaded} />
          </ThemeProvider>
        </SyncProvider>
      </AuthProvider>
    </SQLiteProvider>
  );
}

// Só libera a navegação quando fontes e sessão de auth estão prontas — evita piscar a tela de
// login por uma fração de segundo pra quem já está logado (Supabase lê a sessão salva no
// AsyncStorage de forma assíncrona).
function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { session, carregando } = useAuth();
  const pronto = fontsLoaded && !carregando;

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync();
  }, [pronto]);

  if (!pronto) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cliente/novo" options={{ presentation: 'modal' }} />
        <Stack.Screen name="cliente/[id]" />
        <Stack.Screen name="cliente/[id]/editar" options={{ presentation: 'modal' }} />
        <Stack.Screen name="sessao/[id]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="sessao/[id]/resumo" options={{ gestureEnabled: false }} />
        <Stack.Screen name="escalas" options={{ presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
