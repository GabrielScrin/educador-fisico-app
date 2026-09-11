import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

type Props = {
  valores: number[]; // em ordem cronológica (mais antigo primeiro)
  cor: string;
  min?: number;
  max?: number;
  altura?: number;
};

// Curva de tendência genérica (SVG) usada tanto na "Curva de Esforço da Sessão" (leituras em
// tempo real) quanto no gráfico de evolução do prontuário (médias por sessão) — sempre
// alimentada por dados reais do banco, sem valores de exemplo fixos.
export function TrendChart({ valores, cor, min = 0, max = 10, altura = 96 }: Props) {
  const largura = 320;

  if (valores.length === 0) {
    return <View style={{ height: altura }} />;
  }

  const n = valores.length;
  const passo = n > 1 ? largura / (n - 1) : 0;
  const escalaY = (v: number) => {
    const amplitude = max - min || 1;
    const t = (Math.min(max, Math.max(min, v)) - min) / amplitude;
    return altura - t * (altura - 8) - 4;
  };

  const pontos = valores.map((v, i) => ({ x: n > 1 ? i * passo : largura / 2, y: escalaY(v) }));
  const linha = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${linha} L ${pontos[pontos.length - 1].x} ${altura} L ${pontos[0].x} ${altura} Z`;
  const gradId = `grad-${cor.replace('#', '')}`;

  return (
    <Svg width="100%" height={altura} viewBox={`0 0 ${largura} ${altura}`}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={cor} stopOpacity={0.3} />
          <Stop offset="100%" stopColor={cor} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Line x1={0} y1={altura * 0.25} x2={largura} y2={altura * 0.25} stroke="#28323D" strokeDasharray="3 3" strokeWidth={1} />
      <Line x1={0} y1={altura * 0.75} x2={largura} y2={altura * 0.75} stroke="#28323D" strokeDasharray="3 3" strokeWidth={1} />
      <Path d={area} fill={`url(#${gradId})`} />
      <Path d={linha} fill="none" stroke={cor} strokeWidth={2.5} strokeLinecap="round" />
      {pontos.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === pontos.length - 1 ? 4.5 : 3}
          fill={i === pontos.length - 1 ? cor : '#13181E'}
          stroke={cor}
          strokeWidth={2}
        />
      ))}
    </Svg>
  );
}
