import { Platform } from 'react-native';

// Instalação do PWA na tela inicial. O Chrome (Android) avisa com o evento `beforeinstallprompt`,
// que guardamos pra disparar a janela de instalação com um toque. Em outros navegadores (iPhone,
// Samsung Internet sem o evento), não existe essa janela: mostramos o passo a passo do aparelho.
type EventoInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let eventoSalvo: EventoInstalacao | null = null;

export function ouvirInstalacao(aoMudar: (disponivel: boolean) => void): () => void {
  if (Platform.OS !== 'web') return () => {};

  const quandoPodeInstalar = (evento: Event) => {
    evento.preventDefault();
    eventoSalvo = evento as EventoInstalacao;
    aoMudar(true);
  };
  const quandoInstalado = () => {
    eventoSalvo = null;
    aoMudar(false);
  };

  window.addEventListener('beforeinstallprompt', quandoPodeInstalar);
  window.addEventListener('appinstalled', quandoInstalado);
  return () => {
    window.removeEventListener('beforeinstallprompt', quandoPodeInstalar);
    window.removeEventListener('appinstalled', quandoInstalado);
  };
}

// Abre a janela de instalação do navegador. Retorna false se ela não estiver disponível.
export async function abrirJanelaInstalacao(): Promise<boolean> {
  if (!eventoSalvo) return false;
  const evento = eventoSalvo;
  eventoSalvo = null;
  await evento.prompt();
  await evento.userChoice;
  return true;
}

// Texto do passo a passo conforme o aparelho e o navegador (quando não há janela automática).
export function instrucoesInstalacao(): { titulo: string; mensagem: string } {
  const agente = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (/iPhone|iPad|iPod/.test(agente)) {
    return {
      titulo: 'Instalar no iPhone',
      mensagem:
        'Abra o site no Safari. Toque no botão Compartilhar (quadrado com seta para cima), role para baixo e toque em "Adicionar à Tela de Início".',
    };
  }
  if (/SamsungBrowser/.test(agente)) {
    return {
      titulo: 'Instalar no Samsung Internet',
      mensagem:
        'Toque no menu (≡ ou ⋮) e depois em "Adicionar página a" → "Tela inicial". Confirme em "Adicionar".',
    };
  }
  return {
    titulo: 'Instalar no Android',
    mensagem:
      'Toque nos três pontinhos (⋮) do Chrome e depois em "Instalar app" ou "Adicionar à tela inicial". Confirme em "Instalar".',
  };
}
