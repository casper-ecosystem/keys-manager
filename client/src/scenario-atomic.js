const utils = require('./utils');
const amount = process.env.AMOUNT;

(async function () {
    
    // In this example the 2 additional accounts will be added to 
    // the mainAccount to perform deploys, but they will not be 
    // able to add another account. 
    
    // To achive the task, we will:
    // 1. Set mainAccount's weight to 3.
    // 2. Set Keys Management Threshold to 3.
    // 3. Set Deploy Threshold to 2.
    // 4. Add first new key with weight 1 (first account).
    // 5. Add second new key with weight 1 (second account).
    // 6. Make a transfer from mainAccount using the new accounts.
    // 7. Remove first account.
    // 8. Remove second account.

    let deploy;

    // 0. Initial state of the account.
    // There should be only one associated key (facuet) with weight 1.
    // Deployment Threshold should be set to 1.
    // Key Management Threshold should be set to 1.
    let masterKey = utils.randomMasterKey();
    let mainAccount = masterKey.deriveIndex(1);
    let firstAccount = masterKey.deriveIndex(2);
    let secondAccount = masterKey.deriveIndex(3);

    console.log("\n0. Fund main account.\n");
    await utils.fund(mainAccount);
    await utils.printAccount(mainAccount);
    
    // 1. Set mainAccount's weight to 3
    console.log("\n1. Set faucet's weight to 3\n");
    deploy = utils.keys.setKeyWeightDeploy(mainAccount, mainAccount, 3);
    await utils.sendDeploy(deploy, [mainAccount]);
    await utils.printAccount(mainAccount);
    
    // 2. Set Keys Management Threshold to 3.
    console.log("\n2. Set Keys Management Threshold to 3\n");
    deploy = utils.keys.setKeyManagementThresholdDeploy(mainAccount, 3);
    await utils.sendDeploy(deploy, [mainAccount]);
    await utils.printAccount(mainAccount);
    
    // 3. Set Deploy Threshold to 2.
    console.log("\n3. Set Deploy Threshold to 2.\n");
    deploy = utils.keys.setDeploymentThresholdDeploy(mainAccount, 2);
    await utils.sendDeploy(deploy, [mainAccount]);
    await utils.printAccount(mainAccount);
    
    // 4. Add first new key with weight 1 (first account).
    console.log("\n4. Add first new key with weight 1.\n");
    deploy = utils.keys.setKeyWeightDeploy(mainAccount, firstAccount, 1);
    await utils.sendDeploy(deploy, [mainAccount]);
    await utils.printAccount(mainAccount);
    
    // 5. Add second new key with weight 1 (second account).
    console.log("\n5. Add second new key with weight 1.\n");
    deploy = utils.keys.setKeyWeightDeploy(mainAccount, secondAccount, 1);
    await utils.sendDeploy(deploy, [mainAccount]);
    await utils.printAccount(mainAccount);
    
    // 6. Make a transfer from faucet using the new accounts.
    console.log("\n6. Make a transfer from faucet using the new accounts.\n");
    deploy = utils.transferDeploy(mainAccount, firstAccount, amount);
    await utils.sendDeploy(deploy, [firstAccount, secondAccount]);
    await utils.printAccount(mainAccount);
    
    // 7. Remove first account.
    console.log("\n7. Remove the first account\n");
    deploy = utils.keys.setKeyWeightDeploy(mainAccount, firstAccount, 0);
    await utils.sendDeploy(deploy, [mainAccount]);
    await utils.printAccount(mainAccount);
    
    // 8. Remove second account.
    console.log("\n8. Remove the second account\n");
    deploy = utils.keys.setKeyWeightDeploy(mainAccount, secondAccount, 0);
    await utils.sendDeploy(deploy, [mainAccount]);
    await utils.printAccount(mainAccount);
    
})();
