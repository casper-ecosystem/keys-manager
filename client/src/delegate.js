const { PublicKey } = require('casper-client-sdk');
const utils = require('./utils');

(async function () {
    let masterKey = utils.randomMasterKey();
    let mainAccount = masterKey.deriveIndex(1);
    let auctionInfo = await utils.auction.auctionInfo();
    let validator = PublicKey.fromHex(auctionInfo.bids[0].public_key);

    console.log("Main account: " + utils.toAccountHashString(mainAccount.publicKey));
    console.log("Validator: " + validator.toAccountHex());
    console.log("\n[x] Funding main account.");
    await utils.fund(mainAccount);

    console.log("[x] Delegate");
    let deploy = utils.auction.delegateDeploy(mainAccount, validator, 1000000);
    await utils.sendDeploy(deploy, [mainAccount]);

    console.log("[x] Undelegate");
    deploy = utils.auction.undelegateDeploy(mainAccount, validator, 1000000);
    await utils.sendDeploy(deploy, [mainAccount]);

    // await utils.printAccount(mainAccount);
})();
