const fs = require('fs');

let {Client, HTTPTransport, RequestManager} = require('rpc-client-js');
let {CasperClient, CasperServiceByJsonRPC, PublicKey, Keys, RuntimeArgs, CLValue, DeployUtil, AccountHash, KeyValue, CLTypedAndToBytesHelper} = require('casper-client-sdk');
const { time } = require('console');
const { send } = require('process');

let nodeUrl = 'http://localhost:40101/rpc';
let eventStoreUrl = 'http://localhost:3000';
let wasmPath = '../contract/target/wasm32-unknown-unknown/release/keys-manager.wasm';
let networkName = 'casper-net-1';

// Create a client connect to Casper Node
let client = new CasperClient(nodeUrl, eventStoreUrl);

// Load the faucet key.
let baseKeyPath = process.env.FAUCET_PATH;
let privateKeyPath = baseKeyPath + "secret_key.pem";
let publicKeyPath = baseKeyPath + "public_key.pem";
let faucetAccount = Keys.Ed25519.parseKeyFiles(publicKeyPath, privateKeyPath);

// Define two keys that will be used.
var seed = new Uint8Array(randomSeed());
let masterKey = client.newHdWallet(seed);


(async function () {
    let mainAccount = masterKey.deriveIndex(1);
    let firstAccount = masterKey.deriveIndex(2);
    let secondAccount = masterKey.deriveIndex(3);

    console.log("Main account: " + toAccountHashString(mainAccount.publicKey));
    console.log("First account: " + toAccountHashString(firstAccount.publicKey));
    console.log("Second account: " + toAccountHashString(secondAccount.publicKey));

    console.log("\n[x] Funding main account:");
    await fund(mainAccount);

    await printAccount(mainAccount);

    let deployThreshold = 2;
    let keyManagementThreshold = 2;
    let accounts = [
        { publicKey: firstAccount.publicKey, weight: 2 }, 
        { publicKey: secondAccount.publicKey, weight: 2 },
        { publicKey: mainAccount.publicKey, weight: 0 }
    ]

    console.log("\n[x] Update keys deploy:");
    let deploy = setAll(mainAccount, deployThreshold, keyManagementThreshold, accounts);
    await sendDeploy(deploy, [mainAccount]);
    await printAccount(mainAccount);

    accounts = [
        { publicKey: mainAccount.publicKey, weight: 2 }
    ]
    deploy = setAll(mainAccount, deployThreshold, keyManagementThreshold, accounts);
    console.log("\n[x] Lockout account:");
    deploy = buildSetKeyWeightDeploy(mainAccount, mainAccount, 2);
    await sendDeploy(deploy, [firstAccount]);
    
    await printAccount(mainAccount);
})();

function randomSeed() {
    return Array.from({length: 40}, () => Math.floor(Math.random() * 128))
}

async function fund(account) {
    let deployParams = new DeployUtil.DeployParams(
        faucetAccount.publicKey,
        networkName
    );
    let session = new DeployUtil.Transfer(10000000000000, account.publicKey)
    let payment = DeployUtil.standardPayment(100000000000);
    let deploy = client.makeDeploy(deployParams, session, payment);
    await sendDeploy(deploy, [faucetAccount]);
}

function setAll(fromAccount, deployThreshold, keyManagementThreshold, accountWeights) {
    let accounts = accountWeights.map(x => CLTypedAndToBytesHelper.bytes(x.publicKey.toAccountHash()));
    let weights = accountWeights.map(x => CLTypedAndToBytesHelper.u8(x.weight));

    return buildKeyManagerDeploy(fromAccount, {
        action: CLValue.fromString("set_all"),
        deployment_thereshold: CLValue.fromU8(deployThreshold),
        key_management_threshold: CLValue.fromU8(keyManagementThreshold),
        accounts: CLValue.fromList(accounts),
        weights: CLValue.fromList(weights),
    });
}

function buildSetKeyWeightDeploy(fromAccount, account, weight) {
    return buildKeyManagerDeploy(fromAccount, {
        action: CLValue.fromString("set_key_weight"),
        account: CLValue.fromBytes(account.accountHash()),
        weight: CLValue.fromU8(weight)
    });
}

async function sendDeploy(deploy, signingKeys) {
    for(let key of signingKeys){
        console.log(`Signed by: ${toAccountHashString(key.publicKey)}`);
        deploy = client.signDeploy(deploy, key);
    }
    let deployHash = await client.putDeploy(deploy);
    await printDeploy(deployHash);
}

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
    console.log("Deploy hash: " + deployHash);
    console.log("Deploy result:");
    console.log(await getDeploy(deployHash));
}

async function printAccount(account) {
    console.log("\n[x] Current state of the account:");
    console.log(await getAccount(account.publicKey));
}

async function getAccount(publicKey) {
    let c = new CasperServiceByJsonRPC(nodeUrl);
    let stateRootHash = (await c.getLatestBlockInfo()).block.header.state_root_hash;
    let account = await c.getBlockState(
        stateRootHash,
        'account-hash-' + toAccountHashString(publicKey),
        []
    ).then(res => res.stored_value.Account);
    return account;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function toAccountHashString(publicKey) {
    return Buffer.from(publicKey.toAccountHash()).toString('hex');
}