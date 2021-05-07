use casper_engine_test_support::{Code, Hash, SessionBuilder, TestContext, TestContextBuilder};
use casper_types::{
    account::AccountHash, bytesrepr::FromBytes, runtime_args, AsymmetricType, CLTyped, PublicKey,
    RuntimeArgs, U512,
};

pub const KEYS_MANAGER: &str = "keys_manager";
pub const KEYS_MANAGER_HASH: &str = "keys_manager_hash";

pub struct KeysManagerContract {
    pub context: TestContext,
    pub keys_manager_hash: Hash,
    pub main_account: AccountHash,
    pub second_account: AccountHash,
}

impl KeysManagerContract {
    pub fn deploy() -> Self {
        let main_key = PublicKey::ed25519_from_bytes([3u8; 32]).unwrap();
        let second_key = PublicKey::ed25519_from_bytes([1u8; 32]).unwrap();
        let mut context = TestContextBuilder::new()
            .with_public_key(main_key, U512::from(500_000_000_000_000_000u64))
            .build();
        let session_code = Code::from("contract.wasm");
        let session = SessionBuilder::new(session_code, runtime_args! {})
            .with_address(main_key.to_account_hash())
            .with_authorization_keys(&[main_key.to_account_hash()])
            .build();
        context.run(session);
        let keys_manager_hash = context
            .query(main_key.to_account_hash(), &[KEYS_MANAGER_HASH.to_string()])
            .unwrap()
            .into_t()
            .unwrap();
        Self {
            context,
            keys_manager_hash,
            main_account: main_key.to_account_hash(),
            second_account: second_key.to_account_hash(),
        }
    }

    pub fn query_contract<T: CLTyped + FromBytes>(&self, name: &str) -> Option<T> {
        match self.context.query(
            self.main_account,
            &[KEYS_MANAGER.to_string(), name.to_string()],
        ) {
            Err(_) => None,
            Ok(maybe_value) => {
                let value = maybe_value
                    .into_t()
                    .unwrap_or_else(|_| panic!("{} is not expected type.", name));
                Some(value)
            }
        }
    }
}
