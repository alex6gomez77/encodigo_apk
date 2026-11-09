const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generar claves RSA (ejecutar una sola vez)
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

module.exports = {
    hmacSecret: 'BRONIK2016.*',
    publicKey: fs.readFileSync(path.join(__dirname, 'public.pem'), 'utf8'),
    privateKey: fs.readFileSync(path.join(__dirname, 'private.pem'), 'utf8'),
    apiKey: 'BRONIK2016.*'
};