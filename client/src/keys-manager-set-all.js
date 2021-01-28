const utils = require('./utils');

(async function () {
    let masterKey = utils.randomMasterKey();
    let mainAccount = masterKey.deriveIndex(1);
    let firstAccount = masterKey.deriveIndex(2);
    let secondAccount = masterKey.deriveIndex(3);

    console.log("Main account: " + utils.toAccountHashString(mainAccount.publicKey));
    console.log("First account: " + utils.toAccountHashString(firstAccount.publicKey));
    console.log("Second account: " + utils.toAccountHashString(secondAccount.publicKey));

    console.log("\n[x] Funding main account:");
    await utils.fund(mainAccount);
    await utils.printAccount(mainAccount);

    let deployThereshold = 2;
    let keyManagementThreshold = 4;
    let accounts = [
        { publicKey: firstAccount.publicKey, weight: 2 }, 
        { publicKey: secondAccount.publicKey, weight: 2 },
        { publicKey: mainAccount.publicKey, weight: 0 }
    ]

    console.log("\n[x] Update keys deploy:");
    let deploy = utils.keys.setAll(mainAccount, deployThereshold, keyManagementThreshold, accounts);
    await utils.sendDeploy(deploy, [mainAccount]);
    await utils.printAccount(mainAccount);
})();
