const utils = require('./utils');
const amount = process.env.AMOUNT;

(async function () {
    const masterKey = utils.randomMasterKey();
    const mainAccount = masterKey.deriveIndex(1);
    const firstAccount = masterKey.deriveIndex(2);
    const secondAccount = masterKey.deriveIndex(3);
    const thirdAccount = masterKey.deriveIndex(3);

    console.log("Main account: " + utils.toAccountHashString(mainAccount.publicKey));
    console.log("First account: " + utils.toAccountHashString(firstAccount.publicKey));
    console.log("Second account: " + utils.toAccountHashString(secondAccount.publicKey));
    console.log("Third account: " + utils.toAccountHashString(thirdAccount.publicKey));

    console.log("\n[x] Funding main account.");
    await utils.fund(mainAccount);
    await utils.printAccount(mainAccount);

    const deployThereshold = 2;
    const keyManagementThreshold = 3;
    const accounts = [
        { publicKey: mainAccount.publicKey, weight: 1 },
        { publicKey: firstAccount.publicKey, weight: 1 }, 
        { publicKey: secondAccount.publicKey, weight: 1 }, 
        { publicKey: thirdAccount.publicKey, weight: 1 }, 
    ]

    console.log("\n[x] Update keys deploy.");
    let deploy = utils.keys.setAll(mainAccount, deployThereshold, keyManagementThreshold, accounts);
    await utils.sendDeploy(deploy, [mainAccount]);
    await utils.printAccount(mainAccount);

    console.log("\n[x] Make transfer.");
    deploy = utils.transferDeploy(mainAccount, secondAccount, amount);
    await utils.sendDeploy(deploy, [firstAccount, secondAccount]);
    await utils.printAccount(mainAccount);
})();
