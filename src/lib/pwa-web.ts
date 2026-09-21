// Tags de PWA injetadas em runtime, só no browser. `expo-router/+html.tsx` seria o jeito
// "oficial" de customizar o <head>, mas só funciona com web.output "static" — e esse app usa
// "single" (SPA) de propósito, porque o client do Supabase toca `window` (via AsyncStorage) na
// construção, o que quebra a pré-renderização em Node do modo "static" ("window is not
// defined"). Injetar aqui evita esse problema por completo, já que só roda depois de montado
// no browser de verdade.
export function configurarPwaWeb() {
  document.title = 'Educador Físico';

  adicionarMeta('description', 'Registro de esforço e dor do cliente, sessão a sessão, pro educador físico usar em pé durante o treino.');
  adicionarMeta('theme-color', '#0B0F12');
  adicionarMeta('apple-mobile-web-app-capable', 'yes');
  adicionarMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
  adicionarMeta('apple-mobile-web-app-title', 'Educador Físico');

  adicionarLink('manifest', '/manifest.json');
  adicionarLink('apple-touch-icon', '/icon-1024.png');
}

function adicionarMeta(name: string, content: string) {
  if (document.querySelector(`meta[name="${name}"]`)) return;
  const tag = document.createElement('meta');
  tag.name = name;
  tag.content = content;
  document.head.appendChild(tag);
}

function adicionarLink(rel: string, href: string) {
  if (document.querySelector(`link[rel="${rel}"]`)) return;
  const tag = document.createElement('link');
  tag.rel = rel;
  tag.href = href;
  document.head.appendChild(tag);
}
