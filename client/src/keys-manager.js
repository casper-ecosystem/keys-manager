const fs = require('fs');

let {Client, HTTPTransport, RequestManager} = require('rpc-client-js');
let {CasperClient, CasperServiceByJsonRPC, PublicKey, Keys, RuntimeArgs, CLValue, DeployUtil, AccountHash, KeyValue} = require('casper-client-sdk');
const { time } = require('console');

let nodeUrl = 'http://localhost:40101/rpc';
let eventStoreUrl = 'http://localhost:3000';
let wasmPath = '../contract/target/wasm32-unknown-unknown/release/keys-manager.wasm';
let networkName = 'casper-net-1';

// Create a client connect to Casper Node
let client = new CasperClient(nodeUrl, eventStoreUrl);

// Load the faucet key.
let baseKeyPath = "/home/ziel/workspace/casperlabs/casper-node/utils/nctl/assets/net-1/faucet/";
let privateKeyPath = baseKeyPath + "secret_key.pem";
let publicKeyPath = baseKeyPath + "public_key.pem";
let faucetKeys = Keys.Ed25519.parseKeyFiles(publicKeyPath, privateKeyPath);

// Define two keys that will be used.
var seed = new Uint8Array([21,31]);
let masterKey = client.newHdWallet(seed);
let firstAccount = masterKey.deriveIndex(1);
let secondAccount = masterKey.deriveIndex(2);

(async function () {
    
    // In this example the 2 additional accounts will be added to the faucet
    // account to perform deploys, but they will not be able to add another
    // accounts. This will remain available only to the faucet account. 
    
    // To achive the task, we will:
    // 1. Set faucet's weight to 3.
    // 2. Set Keys Management Threshold to 3.
    // 3. Set Deploy Threshold to 2.
    // 4. Add first new key with weight 1.
    // 5. Add second new key with weight 1.
    
    let deploy, signedDeploy, deployHash;

    // 0. Initial state of the account.
    // There should be only one associated key (facuet) with weight 1.
    // Deployment Threshold should be set to 1.
    // Key Management Threshold should be set to 1.
    console.log("\n[x] 0. Initial settings.\n");
    await printAccount();
    
    // 1. Set faucet's weight to 3
    console.log("\n[x] 1. Set faucet's weight to 3\n");
    deploy = buildSetKeyWeightDeploy(faucetKeys, 3);
    signedDeploy = client.signDeploy(deploy, faucetKeys);
    deployHash = await client.putDeploy(signedDeploy);
    await printDeploy(deployHash);
    await printAccount();

    // 2. Set Keys Management Threshold to 3.
    console.log("\n2. Set Keys Management Threshold to 3\n");
    deploy = buildSetKeyManagementThresholdDeploy(3);
    signedDeploy = client.signDeploy(deploy, faucetKeys);
    deployHash = await client.putDeploy(signedDeploy);
    await printDeploy(deployHash);
    await printAccount();

    // 3. Set Deploy Threshold to 2.
    console.log("\n3. Set Deploy Threshold to 2.\n");
    deploy = buildSetDeploymentThresholdDeploy(2);
    signedDeploy = client.signDeploy(deploy, faucetKeys);
    deployHash = await client.putDeploy(signedDeploy);
    await printDeploy(deployHash);
    await printAccount();
    
    // 4. Add first new key with weight 1.
    console.log("\n4. Add first new key with weight 1.\n");
    deploy = buildSetKeyWeightDeploy(firstAccount, 1);
    signedDeploy = client.signDeploy(deploy, faucetKeys);
    deployHash = await client.putDeploy(signedDeploy);
    await printDeploy(deployHash);
    await printAccount();

    // 5. Add second new key with weight 1.
    console.log("\n5. Add second new key with weight 1.\n");
    deploy = buildSetKeyWeightDeploy(secondAccount, 2);
    signedDeploy = client.signDeploy(deploy, faucetKeys);
    deployHash = await client.putDeploy(signedDeploy);
    await printDeploy(deployHash);
    await printAccount();
})();

async function getDeploy(deployHash) {
    let i = 10;
    while (i != 0) {
        try {
            return await client.getDeployByHash(deployHash);
        } catch(e) {
            i--;
            await sleep(1000);
        }
    }
    throw Error('Tried 10 times. Something\'s wrong');
}

function buildSetKeyWeightDeploy(account, weight) {
    return buildKeyManagerDeploy(faucetKeys, {
        action: CLValue.fromString("set_key_weight"),
        account: CLValue.fromBytes(account.accountHash()),
        weight: CLValue.fromU8(weight)
    });
}

function buildSetDeploymentThresholdDeploy(weight) {
    return buildKeyManagerDeploy(faucetKeys, {
        action: CLValue.fromString("set_deployment_threshold"),
        weight: CLValue.fromU8(weight)
    });
}

function buildSetKeyManagementThresholdDeploy(weight) {
    return buildKeyManagerDeploy(faucetKeys, {
        action: CLValue.fromString("set_key_management_threshold"),
        weight: CLValue.fromU8(weight)
    });
}


function buildKeyManagerDeploy(baseAccount, args) {
    let deployParams = new DeployUtil.DeployParams(
        baseAccount.publicKey,
        networkName
    );
    var session = new Uint8Array(fs.readFileSync(wasmPath, null).buffer);
    let runtimeArgs = RuntimeArgs.fromMap(args).toBytes();

    let sessionModule = new DeployUtil.ModuleBytes(
        session,
        runtimeArgs
    );
    let payment = DeployUtil.standardPayment(100000000000);
    return client.makeDeploy(deployParams, sessionModule, payment);
}

async function printDeploy(deployHash) {
    console.log("Transfer hash: " + deployHash);
    console.log("Transfer result:");
    console.log(await getDeploy(deployHash));
}

async function printAccount() {
    console.log("Current state of the account:");
    console.log(await getAccount(faucetKeys.publicKey));
}

// This function will be part of CasperClient in the next release.
async function getAccount(publicKey) {
    let accountHash = Buffer.from(publicKey.toAccountHash()).toString('hex');
    let c = new CasperServiceByJsonRPC(nodeUrl);
    let stateRootHash = (await c.getLatestBlockInfo()).block.header.state_root_hash;
    let account = await c.getBlockState(
        stateRootHash,
        'account-hash-' + accountHash,
        []
      ).then(res => res.stored_value.Account);
    return account;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
