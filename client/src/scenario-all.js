const keyManager = require('./key-manager');
const amount = process.env.AMOUNT;

(async function () {
    const masterKey = keyManager.randomMasterKey();
    const mainAccount = masterKey.deriveIndex(1);
    const firstAccount = masterKey.deriveIndex(2);
    const secondAccount = masterKey.deriveIndex(3);
    const thirdAccount = masterKey.deriveIndex(3);

    console.log("Main account: " + mainAccount.publicKey.toHex());
    console.log("First account: " + firstAccount.publicKey.toHex());
    console.log("Second account: " + secondAccount.publicKey.toHex());
    console.log("Third account: " + thirdAccount.publicKey.toHex());

    console.log("\n[x] Funding main account.");
    await keyManager.fund(mainAccount);
    await keyManager.printAccount(mainAccount);

    console.log("\n[x] Install Keys Manager contract");
    let deploy = keyManager.keys.buildContractInstallDeploy(mainAccount);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);

    const deployThereshold = 2;
    const keyManagementThreshold = 3;
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
    deploy = keyManager.transferDeploy(mainAccount, secondAccount, amount);
    await keyManager.sendDeploy(deploy, [firstAccount, secondAccount]);
    await keyManager.printAccount(mainAccount);
})();
