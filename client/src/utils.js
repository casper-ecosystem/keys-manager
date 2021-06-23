const { Keys } = require("casper-js-sdk");

function randomSeed() {
    return Array.from({length: 40}, () => Math.floor(Math.random() * 128))
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const getAccountFromKeyPair = (baseKeyPath) => {
  const privateKeyPath = baseKeyPath + "secret_key.pem";
  const publicKeyPath = baseKeyPath + "public_key.pem";

  return Keys.Ed25519.parseKeyFiles(publicKeyPath, privateKeyPath);
}

const pauseAndWaitForKeyPress = async () => {
  if (process.argv[2] === "interactive") {
    process.stdin.setRawMode(true)
    console.log("\n============================================\n");
    console.log("press any key to continue script execution");
    return new Promise(resolve => process.stdin.once('data', () => {
      process.stdin.setRawMode(false)
      resolve()
      console.log("\n============================================\n");
    }))
  }
  return;
}

module.exports = {
  randomSeed: randomSeed,
  sleep: sleep,
  getAccountFromKeyPair: getAccountFromKeyPair,
  pauseAndWaitForKeyPress
}
