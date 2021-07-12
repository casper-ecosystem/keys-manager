use casper_engine_test_support::{Code, Session, SessionBuilder, TestContext, TestContextBuilder};
use casper_types::{PublicKey, RuntimeArgs, SecretKey, U512, account::AccountHash, bytesrepr::Bytes, runtime_args};

pub const ARG_ACCOUNT: &str = "account";
pub const ARG_WEIGHT: &str = "weight";
pub const ARG_ACCOUNTS: &str = "accounts";
pub const ARG_WEIGHTS: &str = "weights";
pub const ARG_DEPLOYMENT_THRESHOLD: &str = "deployment_threshold";
pub const ARG_KEY_MANAGEMENT_THRESHOLD: &str = "key_management_threshold";

pub struct Sender(pub AccountHash);

pub struct Context {
    pub context: TestContext,
    pub user: PublicKey,
    pub ali: PublicKey,
    pub bob: PublicKey,
}

impl Context {
    pub fn new() -> Self {
        let user: PublicKey = SecretKey::ed25519_from_bytes([1u8; 32]).unwrap().into();
        let ali: PublicKey = SecretKey::ed25519_from_bytes([3u8; 32]).unwrap().into();
        let bob: PublicKey = SecretKey::ed25519_from_bytes([5u8; 32]).unwrap().into();
        let context = TestContextBuilder::new()
            .with_public_key(user.clone(), U512::from(500_000_000_000_000_000u64))
            .with_public_key(ali.clone(), U512::from(500_000_000_000_000_000u64))
            .with_public_key(bob.clone(), U512::from(500_000_000_000_000_000u64))
            .build();
        Self {
            context,
            user,
            ali,
            bob,
        }
    }

    pub fn deploy_wasm(&mut self, name: &str, signers: Vec<PublicKey>) {
        let session = Context::create_session(self.user.to_account_hash(), signers, Code::from(name), RuntimeArgs::new());
        self.context.run(session);
    }

    pub fn deploy_keys_manager(&mut self) {
        self.deploy_wasm("keys-manager.wasm", vec![self.user.clone()]);
    }

    pub fn deploy_test_contract(&mut self, signers: Vec<PublicKey>) {
        self.deploy_wasm("test-contract.wasm", signers);
    }

    pub fn set_key_weight(&mut self, account: PublicKey, weight: u8, signers: Vec<PublicKey>) {
        self.call_keys_manager(
            signers,
            "set_key_weight",
            runtime_args! {
                ARG_ACCOUNT => account.clone(),
                ARG_WEIGHT => weight
            },
        );
    }

    pub fn set_key_management_threshold(&mut self, account: PublicKey, weight: u8, signers: Vec<PublicKey>) {
        self.call_keys_manager(
            signers,
            "set_key_management_threshold",
            runtime_args! {
                ARG_ACCOUNT => account.clone(),
                ARG_WEIGHT => weight
            },
        );
    }

    pub fn set_deployment_threshold(&mut self, account: PublicKey, weight: u8, signers: Vec<PublicKey>) {
        self.call_keys_manager(
            signers,
            "set_deployment_threshold",
            runtime_args! {
                ARG_ACCOUNT => account.clone(),
                ARG_WEIGHT => weight
            },
        );
    }

    pub fn set_all(&mut self,signers: Vec<PublicKey>, deployment_threshold:u8, key_management_threshold:u8, accounts: Vec<PublicKey>, weights: Vec<u8>) {
        let bytes: Bytes = weights.into();
        self.call_keys_manager(
            signers,
            "set_all",
            runtime_args! {
                ARG_DEPLOYMENT_THRESHOLD => deployment_threshold,
                ARG_KEY_MANAGEMENT_THRESHOLD => key_management_threshold,
                ARG_ACCOUNTS => accounts,
                ARG_WEIGHTS => bytes
            },
        );
    }

    fn create_session(address:AccountHash, signers: Vec<PublicKey>, code:Code, args: RuntimeArgs) -> Session{
        let accounts: Vec<AccountHash> = signers.into_iter()
            .map(|k| k.to_account_hash()).collect();
        SessionBuilder::new(code, args)
            .with_address(address)
            .with_authorization_keys(&accounts)
            .build()
    }

    fn call_keys_manager(&mut self, signers: Vec<PublicKey>, method: &str, args: RuntimeArgs) {
        let code = Code::NamedKey("keys_manager".to_string(), method.to_string());
        let session = Context::create_session(self.user.to_account_hash(), signers, code, args);
        self.context.run(session);
    }
}

#[test]
fn test_default_setup() {
    let mut context = Context::new();
    context.deploy_test_contract(vec![context.user.clone()]);
}

#[test]
#[should_panic]
fn wrong_signer_test() {
    let mut context = Context::new();
    context.deploy_test_contract(vec![context.ali.clone()]);
}

#[test]
fn test_add_key() {
    let mut context = Context::new();
    context.deploy_keys_manager();
    context.set_key_weight(context.ali.clone(), 1, vec![context.user.clone()]);
    context.deploy_test_contract(vec![context.ali.clone()]);
}

#[test]
fn set_weight_test(){
    let mut context = Context::new();
    context.deploy_keys_manager();
    context.set_key_weight(context.user.clone(), 2, vec![context.user.clone()]);
    context.set_key_management_threshold(context.user.clone(), 2, vec![context.user.clone()]);
}

#[test]
fn set_deployment_threshold(){
    let mut context = Context::new();
    context.deploy_keys_manager();
    context.set_key_weight(context.ali.clone(), 1, vec![context.user.clone()]);
    context.set_key_weight(context.ali.clone(), 2, vec![context.user.clone()]);

}


#[test]
#[should_panic]
fn deployment_threshold_should_not_be_greater_than_key_management_threshold(){
    let mut context = Context::new();
    context.deploy_keys_manager();
    // By default both key_management and deploy thresholds are initialized to 1. Since a key_management action
    // is also a deploy action the deployment threshold should not be greater than the key_management threshold.
    // By setting the deployment threshold to 2 (which is greater than the initial key management threshold = 1 )
    context.set_deployment_threshold(context.user.clone(), 2, vec![context.user.clone()]);
}


#[test]
fn set_key_management_threshold(){
    let mut context = Context::new();
    context.deploy_keys_manager();
    context.set_key_weight(context.ali.clone(), 1, vec![context.user.clone()]);
    context.set_key_weight(context.ali.clone(), 2, vec![context.user.clone()]);
}

#[test]
#[should_panic]
fn key_management_threshold_should_not_be_greater_than_sum_of_weights(){
    let mut context = Context::new();
    context.deploy_keys_manager();
    context.set_key_weight(context.ali.clone(), 1, vec![context.user.clone()]);
    context.set_key_weight(context.bob.clone(), 2, vec![context.user.clone()]);

    // Sum of weights is: (user)1 + (ali)1 + (bob)2 = 4.
    // If we now set key_management_threshold to 5 (which is greater than the sum of weights)
    // we will lock the account since any key_management action will be blocked.
    // Thus this should fail. 
    context.set_key_management_threshold(context.user.clone(), 5, vec![context.user.clone()]);
}


#[test]
fn set_all_test(){
    
    let mut context = Context::new();
    context.deploy_keys_manager();

    let signers:Vec<PublicKey> =  [context.user.clone()].into();
    context.set_all(signers, 
        1u8, 
        1u8, 
        vec![context.user.clone(), context.ali.clone()], 
        vec![1, 1]
    );
}