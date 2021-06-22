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


## Running prepared client-scenarios

### Installation

Just run `npm i` in `./client`.

### Set-all 

`npm run start:all`

### Step-by-step

`npm run start:atomic`

### Env configuration

Environment variables needs to be set in `.env` file in `./client`.

```
BASE_KEY_PATH=... # absolute path to keys directory
NODE_URL=... # optional, defaults to standard NCTL address http://localhost:40101/rpc
WASM_PATH=... # optional, defaults to ../contract/target/wasm32-unknown-unknown/release/keys-manager.wasm
NETWORK_NAME=... # optional, defaults to casper-net-1
FUND_AMOUNT=10000000000000 # defaults to 10000000000000 = 10000CSPR
PAYMENT_AMOUNT=100000000000 # defaults to 100000000000 = 100CSPR
TRANSFER_AMOUNT=2500000000 # defaults to 2500000000 = 2.5CSPR
```

You can also run run both scripts providing custom `.env` path by running 

`npm run start:atomic dotenv_config_path=./example-env-file`
