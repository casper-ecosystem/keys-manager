const fs = require('fs');

const {
  CasperClient, 
  CasperServiceByJsonRPC, 
  PublicKey, 
  Keys, 
  RuntimeArgs, 
  DeployUtil, 
  AccountHash, 
  KeyValue, 
  CLTypedAndToBytesHelper,
  CLValueBuilder,
} = require('casper-js-sdk');

const { getAccountFromKeyPair, randomSeed, toAccountHashString, sleep } = require('./utils');

const FUND_AMOUNT = 10000000000000;
const PAYMENT_AMOUNT = 100000000000;

const NODE_URL = process.env.NODE_URL || 'http://localhost:40101/rpc';
const WASM_PATH = process.env.WASM_PATH || '../contract/target/wasm32-unknown-unknown/release/keys-manager.wasm';
const NETWORK_NAME = process.env.NETWORK_NAME || 'casper-net-1';
const BASE_KEY_PATH = process.env.BASE_KEY_PATH;

const faucetAccount = getAccountFromKeyPair(BASE_KEY_PATH);

// Create a client connect to Casper Node
let client = new CasperClient(NODE_URL);

async function sendDeploy(deploy, signingKeys) {
    for(let key of signingKeys){
        console.log(`Signed by: ${toAccountHashString(key.publicKey)}`);
        deploy = client.signDeploy(deploy, key);
    }
    let deployHash = await client.putDeploy(deploy);
    await printDeploy(deployHash);
}

async function getDeploy(deployHash) {
    let i = 300;
    while (i != 0) {
        let [deploy, raw] = await client.getDeploy(deployHash);
        if (raw.execution_results.length !== 0){
            if (raw.execution_results[0].result.Success) {
                return deploy;
            } else {
                throw Error("Contract execution: " + raw.execution_results[0].result.Failure.error_message);
            }
        } else {
            i--;
            await sleep(1000);
            continue;
        }
    }
    throw Error('Timeout after ' + i + 's. Something\'s wrong');
}

async function getAccount(publicKey) {
    let c = new CasperServiceByJsonRPC(NODE_URL);
    let stateRootHash = (await c.getLatestBlockInfo()).block.header.state_root_hash;
    let account = await c.getBlockState(
        stateRootHash,
        'account-hash-' + toAccountHashString(publicKey),
        []
    ).then(res => res.Account);
    return account;
}

async function printDeploy(deployHash) {
    console.log("Deploy hash: " + deployHash);
    console.log("Deploy result:");
    console.log(DeployUtil.deployToJson(await getDeploy(deployHash)));
}

async function printAccount(account) {
    console.log("\n[x] Current state of the account:");
    console.log(JSON.stringify(await getAccount(account.publicKey), null, 2));
}

function randomMasterKey() {
    const seed = new Uint8Array(randomSeed());
    return client.newHdWallet(seed);
}

// Key manager

function setAll(fromAccount, deployThereshold, keyManagementThreshold, accountWeights) {
    let accounts = accountWeights.map(x => x.publicKey);
    let weights = accountWeights.map(x => CLValueBuilder.u8(x.weight));

    return buildKeyManagerDeploy(fromAccount, "set_all", {
        deployment_thereshold: CLValueBuilder.u8(deployThereshold),
        key_management_threshold: CLValueBuilder.u8(keyManagementThreshold),
        accounts: CLValueBuilder.list(accounts),
        weights: CLValueBuilder.list(weights),
    });
}

function setKeyWeightDeploy(fromAccount, account, weight) {
    return buildKeyManagerDeploy(fromAccount, "set_key_weight", {
        account: account.publicKey,
        weight: CLValueBuilder.u8(weight)
    });
}

function setDeploymentThresholdDeploy(fromAccount, weight) {
    return buildKeyManagerDeploy(fromAccount, "set_deployment_threshold", {
        weight: CLValueBuilder.u8(weight)
    });
}

function setKeyManagementThresholdDeploy(fromAccount, weight) {
    return buildKeyManagerDeploy(fromAccount, "set_key_management_threshold", {
        weight: CLValueBuilder.u8(weight)
    });
}

function buildKeyManagerDeploy(baseAccount, entrypoint, args) {
    let deployParams = new DeployUtil.DeployParams(
        baseAccount.publicKey,
        NETWORK_NAME
    );
    let runtimeArgs = RuntimeArgs.fromMap(args);
    let sessionModule = DeployUtil.ExecutableDeployItem.newStoredContractByName(
        "keys_manager",
        entrypoint,
        runtimeArgs
    );
    let payment = DeployUtil.standardPayment(PAYMENT_AMOUNT);
    return DeployUtil.makeDeploy(deployParams, sessionModule, payment);
}

function buildContractInstallDeploy(baseAccount) {
    let deployParams = new DeployUtil.DeployParams(
        baseAccount.publicKey,
        NETWORK_NAME
    );
    const session = new Uint8Array(fs.readFileSync(WASM_PATH, null).buffer);
    let runtimeArgs = RuntimeArgs.fromMap({});

    let sessionModule = DeployUtil.ExecutableDeployItem.newModuleBytes(
        session,
        runtimeArgs
    );
    let payment = DeployUtil.standardPayment(PAYMENT_AMOUNT);
    return DeployUtil.makeDeploy(deployParams, sessionModule, payment);
}

// Funding
function transferDeploy(fromAccount, toAccount, amount) {
    let deployParams = new DeployUtil.DeployParams(
        fromAccount.publicKey,
        NETWORK_NAME
    );
    let transferParams = DeployUtil.ExecutableDeployItem.newTransfer(
        amount,
        toAccount.publicKey,
        null,
        1
    );
    let payment = DeployUtil.standardPayment(PAYMENT_AMOUNT);
    return DeployUtil.makeDeploy(deployParams, transferParams, payment);
}

async function fund(account) {
    let deploy = transferDeploy(faucetAccount, account, FUND_AMOUNT);
    await sendDeploy(deploy, [faucetAccount]);
}

module.exports = {
    'randomMasterKey': randomMasterKey,
    'toAccountHashString': toAccountHashString,
    'fund': fund,
    'printAccount': printAccount,
    'keys': {
        'setAll': setAll,
        'setKeyWeightDeploy': setKeyWeightDeploy,
        'setDeploymentThresholdDeploy': setDeploymentThresholdDeploy,
        'setKeyManagementThresholdDeploy': setKeyManagementThresholdDeploy,
        'buildContractInstallDeploy': buildContractInstallDeploy
    },
    'sendDeploy': sendDeploy,
    'transferDeploy': transferDeploy,
    'getDeploy': getDeploy,
}
