#![cfg_attr(
    not(target_arch = "wasm32"),
    crate_type = "target arch should be wasm32"
)]
#![no_main]

use casperlabs_contract::{
    contract_api::{runtime, storage, account},
};
use casperlabs_types::{Key, URef, account::{AccountHash, Weight}};


// All session code must have a `call` entrypoint.
#[no_mangle]
pub extern "C" fn call() {
    // Get the optional first argument supplied to the argument.
    let account: AccountHash = runtime::get_named_arg("account");
    let weight = {
        let value: u32 = runtime::get_named_arg("weight");
        Weight::new(value as u8)
    };

    account::add_associated_key(account, weight).unwrap_or_else(|_| {
        account::update_associated_key(account, weight).unwrap_or_else(|_| {
            runtime::revert(101);
        });
    });

}
