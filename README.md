# Casper Keys Manager

Full instructions for first-time contributors are found in the [Multi-Signature Tutorial](https://docs.casperlabs.io/en/latest/dapp-dev-guide/tutorials/multi-sig/index.html).

The steps below are a quick start if you have already set up your [develoment environment](https://docs.casperlabs.io/en/latest/dapp-dev-guide/setup-of-rust-contract-sdk.html), the [casper node](https://github.com/CasperLabs/casper-node), and the [nctl](https://github.com/CasperLabs/casper-node/tree/master/utils/nctl) testing tool). 

## Install

### Set up the Rust toolchain
You need the Rust toolchain to develop smart contracts.
```bash
$ cd contract
$ rustup install $(cat rust-toolchain)
$ rustup target add --toolchain $(cat rust-toolchain) wasm32-unknown-unknown
```

### Compile Account Code (Smart Contracts)
Create a WASM file that will be used by the JS client.
```bash
$ cargo build --release
```

### Install the JS packages
```bash
$ cd client
$ npm install
```

## Prepare the local `nctl` network
1. Set up [nctl](https://github.com/CasperLabs/casper-node/tree/master/utils/nctl)
2. Update `client/src/utils.js`:
    - Set `baseKeyPath` to your nctl faucet key.

## Run
Run the client code.
```bash
$ cd client
$ node src/keys-manager.js
$ node src/keys-manager-set-all.js
```
