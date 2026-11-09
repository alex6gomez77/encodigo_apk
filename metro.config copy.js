// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Solución específica para Windows: ignora .ts en node_modules
config.resolver.assetExts.push('bin');
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];

// 1.  Shim para anular el módulo 'crypto' de Node
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve('./crypto-shim.js'),
};

// 2.  Priorizar entrada "browser" (CryptoJS la incluye)
config.resolver.mainFields = ['browser', 'module', 'main'];

// 3.  Tus ajustes anteriores
config.resolver.assetExts.push('wasm');

config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = withNativeWind(config, { input: './global.css' });