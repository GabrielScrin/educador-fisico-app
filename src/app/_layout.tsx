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
import type { SQLiteDatabase } from 'expo-sqlite';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';
import { MIGRATIONS } from '@/db/schema';

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

async function migrar(db: SQLiteDatabase) {
  for (const statement of MIGRATIONS) {
    await db.execAsync(statement);
  }
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    MaterialSymbols_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SQLiteProvider databaseName="educador-fisico.db" onInit={migrar}>
      <ThemeProvider value={NAV_THEME}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="cliente/novo" options={{ presentation: 'modal' }} />
          <Stack.Screen name="cliente/[id]" />
          <Stack.Screen name="sessao/[id]" options={{ gestureEnabled: false }} />
          <Stack.Screen name="sessao/[id]/resumo" options={{ gestureEnabled: false }} />
          <Stack.Screen name="escalas" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </SQLiteProvider>
  );
}
