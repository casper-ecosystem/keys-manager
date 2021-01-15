# Casper Keys Manager

## Install

### Compile Account Code (Smart Contracts).
It creates a WASM file used by JS code.
```bash
$ cd contract
$ cargo build --release
```

### Install JS packages
```bash
$ cd client
$ npm install
```

## Prepare nctl network.
1. Setup [nctl](https://github.com/CasperLabs/casper-node/tree/master/utils/nctl)
2. Update `FAUCET_PATH` in `client/package.json` to point to your local faucet folder (e.g. `.../nctl/assets/net-1/faucet/`) including the trailing `/`.

## Run
```bash
$ cd client
$ npm run keys-manager
$ npm run keys-manager-all
```
