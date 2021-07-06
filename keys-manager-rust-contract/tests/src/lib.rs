use casper_engine_test_support::{Code, SessionBuilder, TestContext, TestContextBuilder};
use casper_types::{PublicKey, RuntimeArgs, SecretKey, U512, account::AccountHash, runtime_args};

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
            user: user,
            ali: ali,
            bob: bob,
        }
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
                "account" => account.clone(),
                "weight" => weight
            },
        );
    }

    // Utils

    fn call_keys_manager(&mut self, signers: Vec<PublicKey>, method: &str, args: RuntimeArgs) {
        let accounts: Vec<AccountHash> = signers.into_iter()
            .map(|k| k.to_account_hash()).collect();
        let code = Code::NamedKey("keys_manager".to_string(), method.to_string());
        let session = SessionBuilder::new(code, args)
            .with_address(self.user.to_account_hash())
            .with_authorization_keys(&accounts)
            .build();
        self.context.run(session);
    }

    pub fn deploy_wasm(&mut self, name: &str, signers: Vec<PublicKey>) {
        let accounts: Vec<AccountHash> = signers.into_iter()
            .map(|k| k.to_account_hash()).collect();
        let session_code = Code::from(name);
        let session_args = RuntimeArgs::new();
        let session = SessionBuilder::new(session_code, session_args)
            .with_address(self.user.to_account_hash())
            .with_authorization_keys(&accounts)
            .build();
        self.context.run(session);
    }

}

#[test]
#[should_panic]
fn test_default_setup() {
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