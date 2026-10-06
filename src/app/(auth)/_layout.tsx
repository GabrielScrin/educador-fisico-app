import { Stack } from 'expo-router';

// Visitante sem login cai na página de entrada (bem-vindo), que leva pro login ou pro cadastro.
export const unstable_settings = {
  initialRouteName: 'bem-vindo',
};

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="bem-vindo" />
      <Stack.Screen name="login" />
      <Stack.Screen name="cadastro" />
    </Stack>
  );
}
