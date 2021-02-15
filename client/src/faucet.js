const utils = require('./utils');
const assert = require('assert');

let { DeployUtil, CLValue, Keys, PublicKey } = require('casper-client-sdk');
let masterKey = utils.randomMasterKey();
let from = masterKey.deriveIndex(1);
let to = masterKey.deriveIndex(2);

// Prepare the Deploy.
let deployParams = new DeployUtil.DeployParams(
  from.publicKey,
  'delta-10'
)

// Prepare transfers params
let transferParams = DeployUtil.ExecutableDeployItem.newTransfer(
  1000,
  to.publicKey,
  null,
  10
);
let payment = DeployUtil.standardPayment(10);

let transferDeploy = DeployUtil.makeDeploy(deployParams, transferParams, payment);
transferDeploy = DeployUtil.addArgToDeploy(transferDeploy, "pk", CLValue.publicKey(from.publicKey));
let rebuiltDeploy = DeployUtil.deployFromJson(DeployUtil.deployToJson(transferDeploy));

assert.deepStrictEqual(
  rebuiltDeploy.session.getArgByName("pk").asPublicKey(), 
  from.publicKey
);

assert.deepStrictEqual(
  rebuiltDeploy.session.getArgByName("pk").asPublicKey().rawPublicKey, 
  from.publicKey.rawPublicKey
);