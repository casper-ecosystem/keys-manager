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
let faucetAccount = Keys.Ed25519.parseKeyFiles(publicKeyPath, privateKeyPath);

// Define two keys that will be used.
var seed = new Uint8Array([21,31]);
let masterKey = client.newHdWallet(seed);
let firstAccount = masterKey.deriveIndex(1);
let secondAccount = masterKey.deriveIndex(2);
// let firstAccount = client.newKeyPair(Keys.SignatureAlgorithm.Ed25519);
// let secondAccount = client.newKeyPair(Keys.SignatureAlgorithm.Ed25519);



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
    // 6. Make a transfer from faucet using only both accounts.
    // 7. Remove first account.
    // 8. Remove second account.

    let deploy;

    // 0. Initial state of the account.
    // There should be only one associated key (facuet) with weight 1.
    // Deployment Threshold should be set to 1.
    // Key Management Threshold should be set to 1.
    // console.log("\n0. Initial settings.\n");
    // await printAccount();
    
    // 1. Set faucet's weight to 3
    console.log("\n1. Set faucet's weight to 3\n");
    deploy = buildSetKeyWeightDeploy(faucetAccount, 3);
    await sendDeploy(deploy, faucetAccount, [faucetAccount]);

    // 2. Set Keys Management Threshold to 3.
    console.log("\n2. Set Keys Management Threshold to 3\n");
    deploy = buildSetKeyManagementThresholdDeploy(3);
    await sendDeploy(deploy, faucetAccount, [faucetAccount]);

    // 3. Set Deploy Threshold to 2.
    console.log("\n3. Set Deploy Threshold to 2.\n");
    deploy = buildSetDeploymentThresholdDeploy(2);
    await sendDeploy(deploy, faucetAccount, [faucetAccount]);
    
    // 4. Add first new key with weight 1.
    console.log("\n4. Add first new key with weight 1.\n");
    deploy = buildSetKeyWeightDeploy(firstAccount, 1);
    await sendDeploy(deploy, faucetAccount, [faucetAccount]);
    
    // 5. Add second new key with weight 1.
    console.log("\n5. Add second new key with weight 1.\n");
    deploy = buildSetKeyWeightDeploy(secondAccount, 1);
    await sendDeploy(deploy, faucetAccount, [faucetAccount]);
    
    // 6. Make a transfer from faucet using only both accounts.
    console.log("\n6. Make a transfer from faucet using only both accounts.\n");
    deploy = buildTransferDeploy(faucetAccount, firstAccount, 1);
    await sendDeploy(deploy, faucetAccount, [firstAccount, secondAccount]);

    // 7. Remove first account.
    console.log("\n7. Remove the first account\n");
    deploy = buildSetKeyWeightDeploy(firstAccount, 0);
    await sendDeploy(deploy, faucetAccount, [faucetAccount]);

    // 8. Remove second account.
    console.log("\n8. Remove the second account\n");
    deploy = buildSetKeyWeightDeploy(secondAccount, 0);
    await sendDeploy(deploy, faucetAccount, [faucetAccount]);

})();

async function sendDeploy(deploy, fromAccount, signingKeys) {
    for(let key of signingKeys){
        console.log(`Signed by: ${toAccountHashString(key.publicKey)}`);
        deploy = client.signDeploy(deploy, key);
    }
    let deployHash;
    try {
        deployHash = await client.putDeploy(deploy);
    } catch (e) {
        console.log(e);
    }
    await printDeploy(deployHash);
    await printAccount();
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

function buildSetKeyWeightDeploy(account, weight) {
    return buildKeyManagerDeploy(faucetAccount, {
        action: CLValue.string("set_key_weight"),
        account: CLValue.byteArray(account.accountHash()),
        weight: CLValue.u8(weight)
    });
}

function buildSetDeploymentThresholdDeploy(weight) {
    return buildKeyManagerDeploy(faucetAccount, {
        action: CLValue.string("set_deployment_threshold"),
        weight: CLValue.u8(weight)
    });
}

function buildSetKeyManagementThresholdDeploy(weight) {
    return buildKeyManagerDeploy(faucetAccount, {
        action: CLValue.string("set_key_management_threshold"),
        weight: CLValue.u8(weight)
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

function buildTransferDeploy(fromAccount, toAccount, amount) {
    // Preapre the Deploy.
    let deployParams = new DeployUtil.DeployParams(
        fromAccount.publicKey,
        networkName
    );
    let transferParams = new DeployUtil.Transfer(
        amount,
        toAccount.publicKey,
        null,
        null
    );
    let payment = DeployUtil.standardPayment(100000000000);
    return client.makeTransferDeploy(deployParams, transferParams, payment);
}

async function printDeploy(deployHash) {
    console.log("Transfer hash: " + deployHash);
    console.log("Transfer result:");
    console.log(await getDeploy(deployHash));
}

async function printAccount() {
    console.log("Current state of the account:");
    console.log(await getAccount(faucetAccount.publicKey));
}

// This function will be part of CasperClient in the next release.
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