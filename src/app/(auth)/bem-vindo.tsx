import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { MaterialSymbol } from '@/components/material-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { LARGURA_MAX_CONTEUDO, useLayoutDesktop } from '@/hooks/use-layout-desktop';
import { useTheme } from '@/hooks/use-theme';

// Página de entrada pública: é o que aparece pra quem abre o link sem estar logado. Apresenta o
// produto e leva pro login ou pro cadastro. Não mostra dado real nem promessa clínica.
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
  { titulo: 'Crie sua conta', texto: 'Com e-mail e senha. Leva menos de um minuto.' },
  { titulo: 'Cadastre o cliente', texto: 'Nome e contato opcional. Inicie uma sessão com um toque.' },
  { titulo: 'Registre durante o treino', texto: 'Leituras rápidas de esforço e dor. Feche a sessão com o resumo.' },
] as const;

// Barras ilustrativas do cartão de exemplo (valores fixos, só pra mostrar o tipo de gráfico).
const BARRAS_EXEMPLO = [3, 4, 4, 6, 5, 7, 8];

export default function BemVindo() {
  const theme = useTheme();
  const desktop = useLayoutDesktop();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
          <View style={[styles.area, desktop && styles.areaDesktop]}>
            <View style={styles.cabecalho}>
              <View style={styles.marca}>
                <View style={[styles.marcaPonto, { backgroundColor: theme.accent }]} />
                <ThemedText type="smallBold">Educador Físico</ThemedText>
              </View>
              <View style={styles.cabecalhoAcoes}>
                <Pressable onPress={() => router.push('/(auth)/login')} style={styles.linkEntrar}>
                  <ThemedText type="smallBold">Entrar</ThemedText>
                </Pressable>
                {desktop && (
                  <Pressable
                    onPress={() => router.push('/(auth)/cadastro')}
                    style={[styles.botaoCompacto, { backgroundColor: theme.accent }]}
                  >
                    <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                      Criar conta
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            </View>

            <View style={[styles.hero, desktop && styles.heroDesktop]}>
              <View style={[styles.heroTexto, desktop && styles.heroTextoDesktop]}>
                <View style={[styles.selo, { borderColor: theme.border }]}>
                  <View style={[styles.ponto, { backgroundColor: theme.accent }]} />
                  <ThemedText type="label" themeColor="textMuted">
                    Para educadores físicos
                  </ThemedText>
                </View>
                <ThemedText type="title" style={[styles.titulo, desktop && styles.tituloDesktop]}>
                  Registre o esforço e a dor do cliente, sessão a sessão.
                </ThemedText>
                <ThemedText type="default" themeColor="textSecondary" style={desktop && styles.subtituloDesktop}>
                  Substitua a prancheta e as anotações soltas por um histórico digital, feito pra usar em pé,
                  com o celular na mão, durante o treino.
                </ThemedText>
                <View style={[styles.acoes, desktop && styles.acoesDesktop]}>
                  <Pressable
                    onPress={() => router.push('/(auth)/cadastro')}
                    style={[styles.botaoPrincipal, desktop && styles.botaoPrincipalDesktop, { backgroundColor: theme.accent }]}
                  >
                    <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                      Criar conta
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('/(auth)/login')}
                    style={[styles.botaoSecundario, desktop && styles.botaoPrincipalDesktop, { borderColor: theme.border }]}
                  >
                    <ThemedText type="smallBold">Já tenho conta · Entrar</ThemedText>
                  </Pressable>
                </View>
              </View>

              <View style={[styles.previa, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, desktop && styles.previaDesktop]}>
                <ThemedText type="label" themeColor="textMuted">
                  Exemplo ilustrativo
                </ThemedText>
                <View style={styles.previaLinhaTopo}>
                  <View style={[styles.metrica, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText type="label" themeColor="textMuted">OMNI-RES</ThemedText>
                    <ThemedText type="smallBold" style={{ color: theme.accent }}>7 / 10</ThemedText>
                  </View>
                  <View style={[styles.metrica, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText type="label" themeColor="textMuted">Dor NPRS</ThemedText>
                    <ThemedText type="smallBold" style={{ color: theme.warning }}>3 / 10</ThemedText>
                  </View>
                </View>
                <View style={styles.grafico}>
                  {BARRAS_EXEMPLO.map((valor, i) => (
                    <View
                      key={i}
                      style={[styles.barra, { height: valor * 12, backgroundColor: i === BARRAS_EXEMPLO.length - 1 ? theme.accent : theme.border }]}
                    />
                  ))}
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  Esforço (OMNI) ao longo das sessões deste cliente
                </ThemedText>
              </View>
            </View>

            <View style={styles.secao}>
              <ThemedText type="label" themeColor="textMuted">O que você ganha</ThemedText>
              <View style={[styles.grade, desktop && styles.gradeDesktop]}>
                {BENEFICIOS.map((b) => (
                  <View
                    key={b.titulo}
                    style={[styles.cartao, desktop && styles.cartaoDesktop, { backgroundColor: theme.backgroundElement }]}
                  >
                    <View style={[styles.icone, { backgroundColor: theme.backgroundSelected }]}>
                      <MaterialSymbol name={b.icone} color={theme.accent} size={22} />
                    </View>
                    <ThemedText type="smallBold">{b.titulo}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {b.texto}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.secao}>
              <ThemedText type="label" themeColor="textMuted">Como funciona</ThemedText>
              <View style={[styles.grade, desktop && styles.gradeDesktop]}>
                {PASSOS.map((passo, i) => (
                  <View
                    key={passo.titulo}
                    style={[styles.cartao, desktop && styles.cartaoDesktop, { backgroundColor: theme.backgroundElement }]}
                  >
                    <View style={[styles.numero, { backgroundColor: theme.accent }]}>
                      <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                        {i + 1}
                      </ThemedText>
                    </View>
                    <ThemedText type="smallBold">{passo.titulo}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {passo.texto}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.secao}>
              <ThemedText type="label" themeColor="textMuted">Instale no celular</ThemedText>
              <View style={[styles.grade, desktop && styles.gradeDesktop]}>
                <View style={[styles.cartao, desktop && styles.cartaoDesktop, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="smallBold">Android (Chrome)</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Toque em ⋮ e depois em “Adicionar à tela inicial”.
                  </ThemedText>
                </View>
                <View style={[styles.cartao, desktop && styles.cartaoDesktop, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="smallBold">iPhone (Safari)</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Toque em Compartilhar e depois em “Adicionar à Tela de Início”.
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={[styles.rodapeArea, { borderTopColor: theme.border }]}>
              <ThemedText type="small" themeColor="textMuted" style={styles.rodape}>
                As escalas seguem material de referência do educador Rafael de Souza Iyama (CREF 010255).
                Este app registra percepção de esforço e dor; não substitui avaliação profissional.
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  conteudo: { paddingBottom: Spacing.five },
  area: { padding: Spacing.three, gap: Spacing.four },
  areaDesktop: { width: '100%', maxWidth: LARGURA_MAX_CONTEUDO, alignSelf: 'center', paddingHorizontal: Spacing.five, paddingTop: Spacing.three, gap: Spacing.six },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.two },
  marca: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  marcaPonto: { width: 10, height: 10, borderRadius: 5 },
  cabecalhoAcoes: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  linkEntrar: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.two },
  botaoCompacto: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + 2, borderRadius: Radius.md },
  hero: { gap: Spacing.four, paddingTop: Spacing.three },
  heroDesktop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.five },
  heroTexto: { gap: Spacing.three },
  heroTextoDesktop: { flex: 1.1 },
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
  tituloDesktop: { fontSize: 52, lineHeight: 58 },
  subtituloDesktop: { fontSize: 18, lineHeight: 28 },
  acoes: { gap: Spacing.two, marginTop: Spacing.two },
  acoesDesktop: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.three },
  botaoPrincipal: {
    minHeight: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoPrincipalDesktop: { flex: 0, minWidth: 220, paddingHorizontal: Spacing.four },
  botaoSecundario: {
    minHeight: 56,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previa: { gap: Spacing.three, borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.three },
  previaDesktop: { flex: 1, padding: Spacing.four },
  previaLinhaTopo: { flexDirection: 'row', gap: Spacing.two },
  metrica: { flex: 1, gap: Spacing.one, borderRadius: Radius.md, padding: Spacing.three },
  grafico: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, height: 110 },
  barra: { flex: 1, borderRadius: Radius.xs },
  secao: { gap: Spacing.three },
  grade: { gap: Spacing.two },
  gradeDesktop: { flexDirection: 'row', gap: Spacing.three },
  cartao: {
    gap: Spacing.two,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  cartaoDesktop: { flex: 1, gap: Spacing.three, padding: Spacing.four },
  icone: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numero: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rodapeArea: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three },
  rodape: { lineHeight: 18 },
});
