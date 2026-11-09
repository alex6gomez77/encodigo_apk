const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ✅ EXTENDER (no reemplazar) las extensiones
config.resolver.assetExts.push('bin', 'wasm');

// 1. Shim para anular el módulo 'crypto' de Node
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve('./crypto-shim.js'),
};

// 2. Priorizar entrada "browser" (CryptoJS la incluye)
config.resolver.mainFields = ['browser', 'module', 'main'];

// 3. Headers para COOP/COEP
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return middleware(req, res, next);
  };
};

module.exports = withNativeWind(config, { input: './global.css' });