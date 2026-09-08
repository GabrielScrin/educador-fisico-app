// Conteúdo clínico das escalas — extraído fielmente dos PDFs de referência do Rafael de Souza
// Iyama (Educação Física, CREF 010255) em `EDUCADOR FÍSICO/LOW TICKETS`.
// Fontes citadas nos PDFs originais: ACSM's Guidelines for Exercise Testing and Prescription
// (2020); Robertson RJ et al., OMNI-RES (2003); Zourdos MC et al., RIR scale (2016);
// Grävare Silbernagel & Crossley (NPRS).
//
// A escala OMNI aqui está com a tabela completa (%1RM, RM, RIR) — confirmada lendo o PDF
// original. Se o Rafael revisar algum valor, é só atualizar esta tabela.

export type TipoEscala = 'borg' | 'omni' | 'dor';

export type ValorEscala = {
  valor: number;
  descritor: string;
  detalhe?: string; // linha secundária (ex: %FC, %1RM, RIR)
};

export type FaixaEscala = {
  min: number;
  max: number;
  rotulo: string;
  cor: string;
};

export type ConfigEscala = {
  tipo: TipoEscala;
  titulo: string;
  subtitulo: string;
  min: number;
  max: number;
  valores: ValorEscala[];
  faixas: FaixaEscala[];
};

export const ESCALA_BORG: ConfigEscala = {
  tipo: 'borg',
  titulo: 'Escala de Borg CR10',
  subtitulo: 'Percepção de esforço — exercício aeróbio',
  min: 0,
  max: 10,
  faixas: [
    { min: 0, max: 0, rotulo: 'Repouso', cor: '#9CA3AF' },
    { min: 1, max: 1, rotulo: 'Muito leve', cor: '#5B8DBE' },
    { min: 2, max: 3, rotulo: 'Leve', cor: '#4F9B6E' },
    { min: 4, max: 5, rotulo: 'Moderada', cor: '#C9A227' },
    { min: 6, max: 7, rotulo: 'Vigorosa', cor: '#D97F3D' },
    { min: 8, max: 9, rotulo: 'Muito vigorosa', cor: '#B84C4C' },
    { min: 10, max: 10, rotulo: 'Máxima', cor: '#7A2436' },
  ],
  valores: [
    { valor: 0, descritor: 'Nenhum esforço', detalhe: '< 20% FCR · < 40% FCmáx' },
    { valor: 1, descritor: 'Muito fraco', detalhe: '< 30% FCR · < 57% FCmáx' },
    { valor: 2, descritor: 'Fraco', detalhe: '30–39% FCR · 57–63% FCmáx' },
    { valor: 3, descritor: 'Moderado', detalhe: '30–39% FCR · 57–63% FCmáx' },
    { valor: 4, descritor: 'Um pouco forte', detalhe: '40–59% FCR · 64–76% FCmáx' },
    { valor: 5, descritor: 'Forte', detalhe: '40–59% FCR · 64–76% FCmáx' },
    { valor: 6, descritor: 'Entre forte e muito forte', detalhe: '60–89% FCR · 77–95% FCmáx' },
    { valor: 7, descritor: 'Muito forte', detalhe: '60–89% FCR · 77–95% FCmáx' },
    { valor: 8, descritor: 'Entre muito forte e extremo', detalhe: '≥ 90% FCR · ≥ 96% FCmáx' },
    { valor: 9, descritor: 'Extremamente forte', detalhe: '≥ 90% FCR · ≥ 96% FCmáx' },
    { valor: 10, descritor: 'Esforço máximo', detalhe: '100% FCR · 100% FCmáx' },
  ],
};

export const ESCALA_OMNI: ConfigEscala = {
  tipo: 'omni',
  titulo: 'Escala OMNI-RES',
  subtitulo: 'Percepção de esforço — treino de força',
  min: 0,
  max: 10,
  faixas: [
    { min: 0, max: 1, rotulo: 'Muito baixa', cor: '#5B8DBE' },
    { min: 2, max: 3, rotulo: 'Baixa', cor: '#4F9B6E' },
    { min: 4, max: 5, rotulo: 'Moderada', cor: '#C9A227' },
    { min: 6, max: 7, rotulo: 'Alta', cor: '#D97F3D' },
    { min: 8, max: 10, rotulo: 'Muito alta', cor: '#7A2436' },
  ],
  valores: [
    { valor: 0, descritor: 'Extremamente fácil', detalhe: '≤ 30% 1RM · > 20 RM · RIR > 8' },
    { valor: 1, descritor: 'Extremamente fácil', detalhe: '30–40% 1RM · 20 RM · RIR > 8' },
    { valor: 2, descritor: 'Fácil', detalhe: '40–50% 1RM · 18–20 RM · RIR 7–8' },
    { valor: 3, descritor: 'Fácil', detalhe: '50–55% 1RM · 15–17 RM · RIR 7–8' },
    { valor: 4, descritor: 'Um pouco fácil', detalhe: '55–62% 1RM · 13–14 RM · RIR 4–6' },
    { valor: 5, descritor: 'Um pouco fácil', detalhe: '62–70% 1RM · 11–12 RM · RIR 4–6' },
    { valor: 6, descritor: 'Um pouco difícil', detalhe: '70–75% 1RM · 9–10 RM · RIR 2–3' },
    { valor: 7, descritor: 'Um pouco difícil', detalhe: '75–82% 1RM · 7–8 RM · RIR 2–3' },
    { valor: 8, descritor: 'Difícil', detalhe: '82–90% 1RM · 4–6 RM · RIR < 2' },
    { valor: 9, descritor: 'Difícil', detalhe: '90–95% 1RM · 2–3 RM · RIR < 2' },
    { valor: 10, descritor: 'Extremamente difícil', detalhe: '95–100% 1RM · 1 RM · RIR < 2' },
  ],
};

export const ESCALA_DOR: ConfigEscala = {
  tipo: 'dor',
  titulo: 'Escala Numérica da Dor (NPRS)',
  subtitulo: 'Intensidade da dor por autorrelato',
  min: 0,
  max: 10,
  faixas: [
    { min: 0, max: 3, rotulo: 'Dor leve · seguir', cor: '#5B8DBE' },
    { min: 4, max: 6, rotulo: 'Dor moderada · reavaliar', cor: '#C9A227' },
    { min: 7, max: 10, rotulo: 'Dor severa · manejar', cor: '#7A2436' },
  ],
  valores: [
    { valor: 0, descritor: 'Sem dor', detalhe: 'Impacto: nenhum' },
    { valor: 1, descritor: 'Dor leve', detalhe: 'Impacto: mínimo' },
    { valor: 2, descritor: 'Dor leve', detalhe: 'Impacto: mínimo' },
    { valor: 3, descritor: 'Dor leve', detalhe: 'Impacto: mínimo · seguir progressão planejada' },
    { valor: 4, descritor: 'Dor moderada', detalhe: 'Impacto: moderado' },
    { valor: 5, descritor: 'Dor moderada', detalhe: 'Impacto: moderado' },
    { valor: 6, descritor: 'Dor moderada', detalhe: 'Impacto: moderado · manter carga, checar resposta' },
    { valor: 7, descritor: 'Dor severa', detalhe: 'Impacto: significativo' },
    { valor: 8, descritor: 'Dor muito severa', detalhe: 'Impacto: significativo' },
    { valor: 9, descritor: 'Dor muito severa', detalhe: 'Impacto: significativo · reduzir carga, reavaliar' },
    { valor: 10, descritor: 'Pior dor', detalhe: 'Impacto: total' },
  ],
};

export const ESCALAS: Record<TipoEscala, ConfigEscala> = {
  borg: ESCALA_BORG,
  omni: ESCALA_OMNI,
  dor: ESCALA_DOR,
};

export function faixaDoValor(escala: ConfigEscala, valor: number): FaixaEscala {
  return (
    escala.faixas.find((f) => valor >= f.min && valor <= f.max) ??
    escala.faixas[escala.faixas.length - 1]
  );
}
