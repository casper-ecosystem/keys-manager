#![no_main]

use casper_contract::{
    contract_api::{account, runtime, storage},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{
    account::{
        AccountHash, ActionType, AddKeyFailure, RemoveKeyFailure, SetThresholdFailure,
        UpdateKeyFailure, Weight,
    },
    CLType, EntryPoint, EntryPointAccess, EntryPointType, EntryPoints, Parameter, PublicKey,
};

mod errors;
use errors::Error;

pub const ARG_ACCOUNT: &str = "account";
pub const ARG_WEIGHT: &str = "weight";
pub const ARG_ACCOUNTS: &str = "accounts";
pub const ARG_WEIGHTS: &str = "weights";
pub const ARG_DEPLOYMENT_THRESHOLD: &str = "deployment_thereshold";
pub const ARG_KEY_MANAGEMENT_THRESHOLD: &str = "key_management_threshold";

#[no_mangle]
pub extern "C" fn set_key_weight() {
    let key: PublicKey = runtime::get_named_arg(ARG_ACCOUNT);
    let weight: Weight = Weight::new(runtime::get_named_arg(ARG_WEIGHT));
    update_key_weight(key.to_account_hash(), weight);
}

#[no_mangle]
pub extern "C" fn set_deployment_threshold() {
    let threshold: Weight = Weight::new(runtime::get_named_arg(ARG_WEIGHT));
    let res = set_threshold(ActionType::Deployment, threshold);
    res.unwrap_or_revert()
}

#[no_mangle]
pub extern "C" fn set_key_management_threshold() {
    let threshold: Weight = Weight::new(runtime::get_named_arg(ARG_WEIGHT));
    let res = set_threshold(ActionType::KeyManagement, threshold);
    res.unwrap_or_revert()
}

#[no_mangle]
pub extern "C" fn set_all() {
    let deployment_thereshold: Weight =
        Weight::new(runtime::get_named_arg(ARG_DEPLOYMENT_THRESHOLD));
    let key_management_threshold: Weight =
        Weight::new(runtime::get_named_arg(ARG_KEY_MANAGEMENT_THRESHOLD));
    let accounts: Vec<PublicKey> = runtime::get_named_arg(ARG_ACCOUNTS);
    let weights: Vec<Weight> = runtime::get_named_arg(ARG_WEIGHTS);

    for (account, weight) in accounts.into_iter().zip(weights) {
        update_key_weight(account.to_account_hash(), weight);
    }
    set_threshold(ActionType::KeyManagement, key_management_threshold).unwrap_or_revert();
    set_threshold(ActionType::Deployment, deployment_thereshold).unwrap_or_revert();
}

#[no_mangle]
pub extern "C" fn call() {
    let mut entry_points = EntryPoints::new();
    entry_points.add_entry_point(EntryPoint::new(
        String::from("set_key_weight"),
        vec![
            Parameter::new(ARG_ACCOUNT, CLType::PublicKey),
            Parameter::new(ARG_WEIGHT, CLType::U8),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Session,
    ));
    entry_points.add_entry_point(EntryPoint::new(
        String::from("set_deployment_threshold"),
        vec![Parameter::new(ARG_WEIGHT, CLType::U8)],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Session,
    ));
    entry_points.add_entry_point(EntryPoint::new(
        String::from("set_key_management_threshold"),
        vec![Parameter::new(ARG_WEIGHT, CLType::U8)],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Session,
    ));
    entry_points.add_entry_point(EntryPoint::new(
        String::from("set_all"),
        vec![
            Parameter::new(ARG_DEPLOYMENT_THRESHOLD, CLType::U8),
            Parameter::new(ARG_KEY_MANAGEMENT_THRESHOLD, CLType::U8),
            Parameter::new(ARG_ACCOUNTS, CLType::List(Box::new(CLType::PublicKey))),
            Parameter::new(ARG_WEIGHTS, CLType::List(Box::new(CLType::U8))),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Session,
    ));

    let (contract_hash, _) = storage::new_locked_contract(entry_points, None, None, None);
    runtime::put_key("keys_manager", contract_hash.into());
    runtime::put_key("keys_manager_hash", storage::new_uref(contract_hash).into());
}

fn update_key_weight(account: AccountHash, weight: Weight) {
    if weight.value() == 0 {
        remove_key_if_exists(account).unwrap_or_revert()
    } else {
        add_or_update_key(account, weight).unwrap_or_revert()
    }
}

fn set_threshold(permission_level: ActionType, threshold: Weight) -> Result<(), Error> {
    match account::set_action_threshold(permission_level, threshold) {
        Ok(()) => Ok(()),
        Err(SetThresholdFailure::KeyManagementThreshold) => Err(Error::KeyManagementThreshold),
        Err(SetThresholdFailure::DeploymentThreshold) => Err(Error::DeploymentThreshold),
        Err(SetThresholdFailure::PermissionDeniedError) => Err(Error::PermissionDenied),
        Err(SetThresholdFailure::InsufficientTotalWeight) => Err(Error::InsufficientTotalWeight),
    }
}

fn add_or_update_key(key: AccountHash, weight: Weight) -> Result<(), Error> {
    match account::update_associated_key(key, weight) {
        Ok(()) => Ok(()),
        Err(UpdateKeyFailure::MissingKey) => add_key(key, weight),
        Err(UpdateKeyFailure::PermissionDenied) => Err(Error::PermissionDenied),
        Err(UpdateKeyFailure::ThresholdViolation) => Err(Error::ThresholdViolation),
    }
}

fn add_key(key: AccountHash, weight: Weight) -> Result<(), Error> {
    match account::add_associated_key(key, weight) {
        Ok(()) => Ok(()),
        Err(AddKeyFailure::MaxKeysLimit) => Err(Error::MaxKeysLimit),
        Err(AddKeyFailure::DuplicateKey) => Err(Error::DuplicateKey), // Should never happen.
        Err(AddKeyFailure::PermissionDenied) => Err(Error::PermissionDenied),
    }
}

fn remove_key_if_exists(key: AccountHash) -> Result<(), Error> {
    match account::remove_associated_key(key) {
        Ok(()) => Ok(()),
        Err(RemoveKeyFailure::MissingKey) => Ok(()),
        Err(RemoveKeyFailure::PermissionDenied) => Err(Error::PermissionDenied),
        Err(RemoveKeyFailure::ThresholdViolation) => Err(Error::ThresholdViolation),
    }
}
