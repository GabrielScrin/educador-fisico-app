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
import { Platform } from 'react-native';

import { Colors } from '@/constants/theme';
import { applyMigrations } from '@/db/migrate';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { SyncProvider } from '@/hooks/use-sync';
import { configurarPwaWeb } from '@/lib/pwa-web';

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
  return (
    <SQLiteProvider databaseName="educador-fisico.db" onInit={applyMigrations}>
      <AuthProvider>
        <SyncProvider>
          <ThemeProvider value={NAV_THEME}>
            <StatusBar style="light" />
            <RootNavigator />
          </ThemeProvider>
        </SyncProvider>
      </AuthProvider>
    </SQLiteProvider>
  );
}

// useFonts precisa rodar aqui dentro, não em RootLayout: `SQLiteProvider` é memoizado com um
// comparador que ignora `children` (só compara databaseName/onInit/etc — ver
// node_modules/expo-sqlite/build/hooks.js), então depois do primeiro render ele nunca mais
// atualiza a árvore de filhos. Se `fontsLoaded` fosse calculado em RootLayout e só passado como
// prop pra baixo, ficaria "congelado" no valor que existia no instante em que o provider montou
// (quase sempre `false`) — a splash screen nunca sumia. Achado testando no device físico.
function RootNavigator() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    MaterialSymbols_400Regular,
  });
  const { session, carregando } = useAuth();
  const pronto = fontsLoaded && !carregando;

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync();
  }, [pronto]);

  // PWA: só na web, e só depois que o app está de pé — não bloqueia o primeiro carregamento.
  // Ver public/sw.js (cache do shell, não garante offline completo) e src/lib/pwa-web.ts.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    configurarPwaWeb();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((erro) => {
        console.error('Falha ao registrar service worker:', erro);
      });
    }
  }, []);

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
