// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite no target web carrega o SQLite via WebAssembly (wa-sqlite) — o Metro não trata
// .wasm como asset por padrão, então precisa entrar na lista explicitamente. Ver
// https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#web-setup.
config.resolver.assetExts.push('wasm');

// wa-sqlite usa SharedArrayBuffer, que exige os cabeçalhos COOP/COEP mesmo em dev — sem isso o
// banco falha silenciosamente no browser. Em produção (Vercel) os mesmos cabeçalhos são
// configurados em vercel.json.
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    return middleware(req, res, next);
  },
};

module.exports = config;
