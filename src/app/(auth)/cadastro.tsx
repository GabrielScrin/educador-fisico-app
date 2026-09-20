import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function Cadastro() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmacaoPendente, setConfirmacaoPendente] = useState(false);

  async function cadastrar() {
    if (!email.trim() || senha.length < 6 || enviando) return;
    setEnviando(true);
    setErro(null);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: senha });
    setEnviando(false);
    if (error) {
      setErro(traduzirErro(error.message));
      return;
    }
    // Se o projeto exige confirmação de e-mail, ainda não há sessão — avisa em vez de deixar
    // o educador achando que já está logado.
    if (!data.session) {
      setConfirmacaoPendente(true);
    }
  }

  if (confirmacaoPendente) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.form}>
            <ThemedText type="title">Confirme seu e-mail</ThemedText>
            <ThemedText type="default" themeColor="textMuted">
              Enviamos um link de confirmação para {email.trim()}. Depois de confirmar, volte e
              entre normalmente.
            </ThemedText>
            <Pressable onPress={() => router.replace('/(auth)/login')} style={[styles.botao, { backgroundColor: theme.accent }]}>
              <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                Ir para o login
              </ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.form}>
          <View style={styles.cabecalho}>
            <ThemedText type="title">Criar conta</ThemedText>
            <ThemedText type="default" themeColor="textMuted">
              Uma conta por educador — os dados continuam neste aparelho, a conta só adiciona
              backup e sincronização.
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
              Senha (mínimo 6 caracteres)
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
            onPress={cadastrar}
            disabled={!email.trim() || senha.length < 6 || enviando}
            style={[
              styles.botao,
              { backgroundColor: theme.accent, opacity: !email.trim() || senha.length < 6 || enviando ? 0.5 : 1 },
            ]}
          >
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              {enviando ? 'Criando conta...' : 'Criar conta'}
            </ThemedText>
          </Pressable>

          <Link href="/(auth)/login" asChild>
            <Pressable style={styles.linkCadastro}>
              <ThemedText type="small" themeColor="textMuted">
                Já tem conta? <ThemedText type="smallBold" style={{ color: theme.accent }}>Entrar</ThemedText>
              </ThemedText>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('User already registered')) return 'Já existe uma conta com esse e-mail.';
  if (mensagem.includes('Password should be at least')) return 'Senha muito curta (mínimo 6 caracteres).';
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
