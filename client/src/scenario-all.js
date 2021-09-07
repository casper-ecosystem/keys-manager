const keyManager = require('./key-manager');
const TRANSFER_AMOUNT = process.env.TRANSFER_AMOUNT || 2500000000;

(async function () {

    // In this example the 3 additional accounts will be added to 
    // the mainAccount but two out of four will be needed to perform the deploy
    // and three out of four to add new account.
    
    // To achive the task, we will:
    // 1. Set Keys Management Threshold to 3.
    // 2. Set Deploy Threshold to 2.
    // 3. Set every account weight to 1.
    // 4. Make a transfer from mainAccount to secondAccount using first & second accounts.
    // 
    // 1, 2, 3 will be done in one step.

    const masterKey = keyManager.randomMasterKey();
    const mainAccount = masterKey.deriveIndex(1);
    const firstAccount = masterKey.deriveIndex(2);
    const secondAccount = masterKey.deriveIndex(3);
    const thirdAccount = masterKey.deriveIndex(4);

    console.log("Main account: " + mainAccount.publicKey.toHex());
    console.log("First account: " + firstAccount.publicKey.toHex());
    console.log("Second account: " + secondAccount.publicKey.toHex());
    console.log("Third account: " + thirdAccount.publicKey.toHex());

    console.log("\n[x] Funding main account.");
    await keyManager.fundAccount(mainAccount);
    await keyManager.printAccount(mainAccount);

    console.log("\n[x] Install Keys Manager contract");
    let deploy = keyManager.keys.buildContractInstallDeploy(mainAccount);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);

    // Deploy threshold is 2 out of 4
    const deployThereshold = 2;
    // Key Managment threshold is 3 out of 4
    const keyManagementThreshold = 3;
    // Every account weight is set to 1
    const accounts = [
        { publicKey: mainAccount.publicKey, weight: 1 },
        { publicKey: firstAccount.publicKey, weight: 1 }, 
        { publicKey: secondAccount.publicKey, weight: 1 }, 
        { publicKey: thirdAccount.publicKey, weight: 1 }, 
    ];

    console.log("\n[x] Update keys deploy.");
    deploy = keyManager.keys.setAll(mainAccount, deployThereshold, keyManagementThreshold, accounts);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);

    console.log("\n[x] Make transfer.");
    deploy = keyManager.transferDeploy(mainAccount, secondAccount, TRANSFER_AMOUNT);
    await keyManager.sendDeploy(deploy, [firstAccount, secondAccount]);
    await keyManager.printAccount(mainAccount);
})();
