const { Keys } = require("casper-js-sdk");

function randomSeed() {
    return Array.from({length: 40}, () => Math.floor(Math.random() * 128))
}

function toAccountHashString(publicKey) {
    return Buffer.from(publicKey.toAccountHash()).toString('hex');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const getAccountFromKeyPair = (baseKeyPath) => {
  const privateKeyPath = baseKeyPath + "secret_key.pem";
  const publicKeyPath = baseKeyPath + "public_key.pem";

  return Keys.Ed25519.parseKeyFiles(publicKeyPath, privateKeyPath);
}

module.exports = {
  randomSeed: randomSeed,
  toAccountHashString: toAccountHashString,
  sleep: sleep,
  getAccountFromKeyPair: getAccountFromKeyPair
}
