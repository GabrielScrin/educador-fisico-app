/**
 * Design system "Clinical High-Contrast Dark" — extraído do projeto Stitch "Design de App
 * Premium" (telas Sessão Ativa V3 Plus, Clientes & Início Rápido, Prontuário & Evolução,
 * Seletor em Tela Cheia, Resumo & Fechamento, Escalas de Referência).
 *
 * OLED pitch-dark de propósito: o app é usado em pé, sob luz de academia, então contraste alto
 * e fundo bem escuro reduzem reflexo/glare e poupam bateria em turnos longos. Não existe
 * variante clara neste design — o app roda sempre no tema escuro (ver `useTheme`).
 */

import '@/global.css';

export const Colors = {
  dark: {
    // Superfícies
    background: '#0B0F12',
    backgroundElement: '#13181E',
    backgroundSelected: '#1C232B',
    surfaceContainer: '#171C22',
    surfaceContainerHigh: '#1B2026',

    // Bordas
    border: '#28323D',
    borderSubtle: '#1B232C',

    // Texto
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',

    // Acentos semânticos
    accent: '#10B981', // effort-optimal — CTA primário / sucesso
    onAccent: '#003824',
    secondary: '#06B6D4', // effort-peak — força/telemetria secundária
    onSecondary: '#00323B',
    warning: '#F59E0B', // pain-warning
    danger: '#EF4444', // pain-critical
  },
} as const;

// Sem variante clara neste design system — mantido só para compatibilidade de tipos.
(Colors as { light?: typeof Colors.dark }).light = Colors.dark;

export type ThemeColor = keyof typeof Colors.dark;

export const Fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
  mono: 'monospace',
  icon: 'MaterialSymbols_400Regular',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  twelve: 12,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const MaxContentWidth = 800;
