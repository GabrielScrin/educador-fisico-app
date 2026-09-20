import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar() {
    if (!email.trim() || !senha || entrando) return;
    setEntrando(true);
    setErro(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setEntrando(false);
    if (error) setErro(traduzirErro(error.message));
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.form}>
          <View style={styles.cabecalho}>
            <ThemedText type="title">Entrar</ThemedText>
            <ThemedText type="default" themeColor="textMuted">
              Seus clientes e sessões ficam salvos na nuvem, vinculados a esta conta.
            </ThemedText>
          </View>

          {erro && (
            <View style={styles.avisoErro}>
              <ThemedText type="small" style={{ color: theme.danger }}>
                {erro}
              </ThemedText>
            </View>
          )}

          <View style={styles.campo}>
            <ThemedText type="label" themeColor="textMuted">
              E-mail
            </ThemedText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            />
          </View>

          <View style={styles.campo}>
            <ThemedText type="label" themeColor="textMuted">
              Senha
            </ThemedText>
            <TextInput
              value={senha}
              onChangeText={setSenha}
              placeholder="••••••••"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            />
          </View>

          <Pressable
            onPress={entrar}
            disabled={!email.trim() || !senha || entrando}
            style={[
              styles.botao,
              { backgroundColor: theme.accent, opacity: !email.trim() || !senha || entrando ? 0.5 : 1 },
            ]}
          >
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              {entrando ? 'Entrando...' : 'Entrar'}
            </ThemedText>
          </Pressable>

          <Link href="/(auth)/cadastro" asChild>
            <Pressable style={styles.linkCadastro}>
              <ThemedText type="small" themeColor="textMuted">
                Ainda não tem conta? <ThemedText type="smallBold" style={{ color: theme.accent }}>Cadastre-se</ThemedText>
              </ThemedText>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

// Mensagens do Supabase vêm em inglês — traduz só os casos comuns pra não confundir o
// educador com um erro técnico em outro idioma no meio do treino.
function traduzirErro(mensagem: string): string {
  if (mensagem.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (mensagem.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  return mensagem;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'center' },
  form: { padding: Spacing.three, gap: Spacing.three },
  cabecalho: { gap: Spacing.one, marginBottom: Spacing.two },
  avisoErro: {
    borderRadius: Radius.md,
    padding: Spacing.two,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
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
  linkCadastro: { alignItems: 'center', paddingVertical: Spacing.two },
});
