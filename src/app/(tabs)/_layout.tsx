import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaterialSymbol } from '@/components/material-symbol';
import { Colors, Fonts } from '@/constants/theme';

const ICONE: Record<string, string> = {
  index: 'group',
  'treino-ativo': 'ecg_heart',
  evolucao: 'monitoring',
  ajustes: 'settings',
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.dark.accent,
        tabBarInactiveTintColor: Colors.dark.textMuted,
        tabBarStyle: [styles.tabBar, { height: 56 + insets.bottom, paddingBottom: insets.bottom }],
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size }) => (
          <MaterialSymbol name={ICONE[route.name] ?? 'circle'} color={color as string} size={size} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Clientes' }} />
      <Tabs.Screen name="treino-ativo" options={{ title: 'Treino ativo' }} />
      <Tabs.Screen name="evolucao" options={{ title: 'Evolução' }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.dark.backgroundElement,
    borderTopColor: Colors.dark.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
