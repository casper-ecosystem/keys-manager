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

const { getAccountFromKeyPair, randomSeed, toAccountHashString, sleep, pauseAndWaitForKeyPress } = require('./utils');

const FUND_AMOUNT = process.env.FUND_AMOUNT || 10000000000000;
const PAYMENT_AMOUNT = process.env.PAYMENT_AMOUNT || 100000000000;

const NODE_URL = process.env.NODE_URL || 'http://localhost:40101/rpc';
const WASM_PATH = process.env.WASM_PATH || '../contract/target/wasm32-unknown-unknown/release/keys-manager.wasm';
const NETWORK_NAME = process.env.NETWORK_NAME || 'casper-net-1';
const BASE_KEY_PATH = process.env.BASE_KEY_PATH;

// Get a faucet account from provided path
const faucetAccount = getAccountFromKeyPair(BASE_KEY_PATH);

// Create a client connected to Casper Node
const client = new CasperClient(NODE_URL);

//
// Helper methods
//

// Helper method for geting a deploy in a defined time period (30s)
async function getDeploy(deployHash) {
    let i = 300;
    while (i != 0) {
        const [deploy, raw] = await client.getDeploy(deployHash);
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

// Helper method for getting the current state of the account
async function getAccount(publicKey) {
    const c = new CasperServiceByJsonRPC(NODE_URL);
    const stateRootHash = (await c.getLatestBlockInfo()).block.header.state_root_hash;
    const account = await c.getBlockState(
        stateRootHash,
        publicKey.toAccountHashStr(),
        []
    ).then(res => res.Account);
    return account;
}

// Helper method for sending deploy and displaying signing keys
async function sendDeploy(deploy, signingKeys) {
    for(let key of signingKeys){
        console.log(`Signed by: ${key.publicKey.toAccountHashStr()}`);
        deploy = client.signDeploy(deploy, key);
    }
    const deployHash = await client.putDeploy(deploy);
    await printDeploy(deployHash);
}

// Helper method to create a new hierarchical deterministic wallet
function randomMasterKey() {
    const seed = new Uint8Array(randomSeed());
    return client.newHdWallet(seed);
}

// Helper method for printing deploy result
async function printDeploy(deployHash) {
    console.log("Deploy hash: " + deployHash);
    console.log("Deploy result:");
    console.log(DeployUtil.deployToJson(await getDeploy(deployHash)));
}

// Helper method for printing account info 
async function printAccount(account) {
    console.log("\n[x] Current state of the account:");
    console.log(JSON.parse(JSON.stringify(await getAccount(account.publicKey), null, 2)));
    await pauseAndWaitForKeyPress();
}

//
// Transfers
//

// Builds native transfer deploy
function transferDeploy(fromAccount, toAccount, amount) {
    const deployParams = new DeployUtil.DeployParams(
        fromAccount.publicKey,
        NETWORK_NAME
    );
    const transferParams = DeployUtil.ExecutableDeployItem.newTransfer(
        amount,
        toAccount.publicKey,
        null,
        1
    );
    const payment = DeployUtil.standardPayment(PAYMENT_AMOUNT);
    return DeployUtil.makeDeploy(deployParams, transferParams, payment);
}

// Helper method for funding the specified account from a faucetAccount
async function fundAccount(account) {
    const deploy = transferDeploy(faucetAccount, account, FUND_AMOUNT);
    await sendDeploy(deploy, [faucetAccount]);
}

//
// Contract deploy related methods
//

// Builds a deploy that will install key-manager contract on specified account
function buildContractInstallDeploy(baseAccount) {
    const deployParams = new DeployUtil.DeployParams(
        baseAccount.publicKey,
        NETWORK_NAME
    );
    const session = new Uint8Array(fs.readFileSync(WASM_PATH, null).buffer);
    const runtimeArgs = RuntimeArgs.fromMap({});
    const sessionModule = DeployUtil.ExecutableDeployItem.newModuleBytes(
        session,
        runtimeArgs
    );
    const payment = DeployUtil.standardPayment(PAYMENT_AMOUNT);

    return DeployUtil.makeDeploy(deployParams, sessionModule, payment);
}

// Builds key-manager deploy that takes entrypoint and args
function buildKeyManagerDeploy(baseAccount, entrypoint, args) {
    const deployParams = new DeployUtil.DeployParams(
        baseAccount.publicKey,
        NETWORK_NAME
    );
    const runtimeArgs = RuntimeArgs.fromMap(args);
    const sessionModule = DeployUtil.ExecutableDeployItem.newStoredContractByName(
        "keys_manager",
        entrypoint,
        runtimeArgs
    );
    const payment = DeployUtil.standardPayment(PAYMENT_AMOUNT);
    return DeployUtil.makeDeploy(deployParams, sessionModule, payment);
}

//
// Key-manager contract specific methods
// 

// Sets deploy threshold, key management threshold, and weights for the specified accounts
function setAll(fromAccount, deployThreshold, keyManagementThreshold, accountWeights) {
    const accounts = accountWeights.map(x => x.publicKey);
    const weights = accountWeights.map(x => CLValueBuilder.u8(x.weight));

    return buildKeyManagerDeploy(fromAccount, "set_all", {
        deployment_thereshold: CLValueBuilder.u8(deployThreshold),
        key_management_threshold: CLValueBuilder.u8(keyManagementThreshold),
        accounts: CLValueBuilder.list(accounts),
        weights: CLValueBuilder.list(weights),
    });
}

// Sets key with a specified weight
function setKeyWeightDeploy(fromAccount, account, weight) {
    return buildKeyManagerDeploy(fromAccount, "set_key_weight", {
        account: account.publicKey,
        weight: CLValueBuilder.u8(weight)
    });
}

// Sets deploys threshold
function setDeploymentThresholdDeploy(fromAccount, weight) {
    return buildKeyManagerDeploy(fromAccount, "set_deployment_threshold", {
        weight: CLValueBuilder.u8(weight)
    });
}

// Sets key-management threshold
function setKeyManagementThresholdDeploy(fromAccount, weight) {
    return buildKeyManagerDeploy(fromAccount, "set_key_management_threshold", {
        weight: CLValueBuilder.u8(weight)
    });
}

module.exports = {
    'randomMasterKey': randomMasterKey,
    'fundAccount': fundAccount,
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
