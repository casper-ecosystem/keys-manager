# Casper Keys Manager

First-time contributors can find complete instructions in the [Multi-Signature Tutorial](https://docs.casperlabs.io/en/latest/dapp-dev-guide/tutorials/multi-sig/index.html).

The steps below are a quick start if you have already set up your [development environment](https://docs.casperlabs.io/en/latest/dapp-dev-guide/setup-of-rust-contract-sdk.html), the [casper node](https://github.com/CasperLabs/casper-node), and the [nctl](https://github.com/CasperLabs/casper-node/tree/master/utils/nctl) testing tool. 

## Installing the contract and client

The JS client code expects a compiled WASM file in the ``contract`` folder and a local network called ``casper-net-1``. 

### Compile the smart contract

To compile the WASM file, use these commands:

```bash
cd keys-manager
make prepare
make build-contract
```

### Prepare a local `nctl` network
Set up [nctl](https://github.com/CasperLabs/casper-node/tree/master/utils/nctl) to interact and deploy to a local network.

### Environment configuration

You need to set certain environment variables in an `.env` file in the `client` folder. 

You need to set the minimum configuration for your client to communicate with the network:

- The ``BASE_KEY_PATH`` for the absolute path to your faucet account
- The ``NODE_URL`` for the first node in your local network 

Your ``.env`` file will look like this (replace <ENTER_YOUR_PATH> with the absolute path of your local drive, because the relative path does not work in this context):

```bash
 BASE_KEY_PATH=<ENTER_YOUR_PATH>/casper-node/utils/nctl/assets/net-1/faucet/
 NODE_URL=http://localhost:11101/rpc
```

If you want to customize your setup further, you can set other optional environment variables described below.

```bash
 WASM_PATH=... # optional, defaults to ../contract/target/wasm32-unknown-unknown/release/keys-manager.wasm
 NETWORK_NAME=... # optional, defaults to casper-net-1
 FUND_AMOUNT=10000000000000 # defaults to 10000000000000 = 10000CSPR
 PAYMENT_AMOUNT=100000000000 # defaults to 100000000000 = 100CSPR
 TRANSFER_AMOUNT=2500000000 # defaults to 2500000000 = 2.5CSPR
```

You can also provide a custom `.env` path by running this command:

```bash
 npm run start:atomic dotenv_config_path=./example-env-file
```

### Client installation

To install the client, run `npm install` in the `client` folder.

```bash
 cd client
 npm install
```

### Running prepared scenarios

You will run an example scenario with the following command where three additional accounts will be added to the main account. You will need two out of four accounts to perform a deploy. You will need three out of four accounts to add a new account. Run this command to try out this example:

```bash
 npm run start:all
```

In a second example scenario, two additional accounts will be added to the main account to perform deploys, but they will not be able to add another account. Run this command for this example:

```bash
 npm run start:atomic
```

### Interactive mode

To run a script in interactive mode, just add `interactive` to the above commands.
