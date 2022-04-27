const util = require('util');
const assert = require('assert');
const fs = require('fs');
const { ethers } = require("ethers");
const Wallet = ethers.Wallet;

const wallet = Wallet.createRandom();

const filePath = process.env.FILEPATH || "/keystore/keystore.json";
const password = process.env.PASSWORD;

(async () => {
    try {
        assert(password != null, "nopassword");
        const keystore = await wallet.encrypt(process.env.PASSWORD);
        assert(!fs.existsSync(filePath), 'keystoer path filled');
        fs.writeFile(filePath, keystore, (e) => console.log(e));
        console.log(`sucess, wrote to ${filePath}`);
    } catch (e) {
        console.log(e);
    }
})();

