import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { MaterialSymbol } from '@/components/material-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Página de entrada pública: é o que aparece pra quem abre o link sem estar logado. Apresenta o
// produto e leva pro login ou pro cadastro. Não mostra nenhum dado real nem promessa clínica.
const BENEFICIOS = [
  {
    icone: 'speed',
    titulo: 'Escalas na hora certa',
    texto: 'Borg CR10, OMNI-RES e dor (NPRS) registradas em tela cheia, com números grandes pra ler de pé, entre as séries.',
  },
  {
    icone: 'monitoring',
    titulo: 'Evolução sessão a sessão',
    texto: 'O histórico de cada cliente fica comparável: esforço, dor e duração ao longo do tempo, num gráfico simples.',
  },
  {
    icone: 'mic',
    titulo: 'Nota por voz',
    texto: 'Fale a observação da sessão e o texto entra na nota. Você revisa antes de fechar o treino.',
  },
  {
    icone: 'cloud_sync',
    titulo: 'Backup na nuvem',
    texto: 'Os dados ficam no seu aparelho e são copiados pra sua conta. Entrando em outro aparelho, você recupera o histórico.',
  },
] as const;

const PASSOS = [
  'Crie sua conta com e-mail e senha.',
  'Cadastre um cliente e inicie uma sessão.',
  'Registre as leituras durante o treino e finalize com o resumo.',
] as const;

export default function BemVindo() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={[styles.selo, { borderColor: theme.border }]}>
              <View style={[styles.ponto, { backgroundColor: theme.accent }]} />
              <ThemedText type="label" themeColor="textMuted">
                Para educadores físicos
              </ThemedText>
            </View>
            <ThemedText type="title" style={styles.titulo}>
              Registre o esforço e a dor do cliente, sessão a sessão.
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary">
              Substitua a prancheta e as anotações soltas por um histórico digital, feito pra usar
              em pé, com o celular na mão, durante o treino.
            </ThemedText>

            <View style={styles.acoes}>
              <Pressable
                onPress={() => router.push('/(auth)/cadastro')}
                style={[styles.botaoPrincipal, { backgroundColor: theme.accent }]}
              >
                <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                  Criar conta
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(auth)/login')}
                style={[styles.botaoSecundario, { borderColor: theme.border }]}
              >
                <ThemedText type="smallBold">Já tenho conta · Entrar</ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.secao}>
            <ThemedText type="subtitle">O que você ganha</ThemedText>
            {BENEFICIOS.map((b) => (
              <View key={b.titulo} style={[styles.cartao, { backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.icone, { backgroundColor: theme.backgroundSelected }]}>
                  <MaterialSymbol name={b.icone} color={theme.accent} size={22} />
                </View>
                <View style={styles.cartaoTexto}>
                  <ThemedText type="smallBold">{b.titulo}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {b.texto}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.secao}>
            <ThemedText type="subtitle">Como funciona</ThemedText>
            {PASSOS.map((passo, i) => (
              <View key={passo} style={styles.passo}>
                <View style={[styles.numero, { backgroundColor: theme.accent }]}>
                  <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                    {i + 1}
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={styles.passoTexto}>
                  {passo}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={[styles.secao, styles.cartao, styles.cartaoInstalar, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="subtitle">Instale no celular</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Android (Chrome): toque em ⋮ e depois em “Adicionar à tela inicial”.
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              iPhone (Safari): toque em Compartilhar e depois em “Adicionar à Tela de Início”.
            </ThemedText>
          </View>

          <ThemedText type="small" themeColor="textMuted" style={styles.rodape}>
            As escalas seguem material de referência do educador Rafael de Souza Iyama (CREF 010255).
            Este app registra percepção de esforço e dor; não substitui avaliação profissional.
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  conteudo: { padding: Spacing.three, gap: Spacing.four, paddingBottom: Spacing.five },
  hero: { gap: Spacing.three, paddingTop: Spacing.three },
  selo: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
  },
  ponto: { width: 8, height: 8, borderRadius: 4 },
  titulo: { fontSize: 30, lineHeight: 36 },
  acoes: { gap: Spacing.two, marginTop: Spacing.two },
  botaoPrincipal: {
    minHeight: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoSecundario: {
    minHeight: 56,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secao: { gap: Spacing.two },
  cartao: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  cartaoInstalar: { flexDirection: 'column', gap: Spacing.two },
  icone: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartaoTexto: { flex: 1, gap: Spacing.one },
  passo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  numero: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passoTexto: { flex: 1 },
  rodape: { lineHeight: 18 },
});
