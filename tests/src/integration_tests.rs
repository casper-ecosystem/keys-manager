#[cfg(test)]
mod tests {
    use casperlabs_engine_test_support::{Code, Error, SessionBuilder, TestContextBuilder, Value, TestContext};
    use casperlabs_types::{account::AccountHash, U512, RuntimeArgs, runtime_args};

    const ALI: AccountHash = AccountHash::new([7u8; 32]);
    const BOB: AccountHash = AccountHash::new([10u8; 32]);
    const JOE: AccountHash = AccountHash::new([11u8; 32]);

    #[test]
    #[should_panic]
    fn should_fail_with_wrong_signature() {
        let mut context = new_context();
        deploy(&mut context, BOB, 2, ALI, &[BOB]);
    }

    #[test]
    #[should_panic]
    fn account_theft_scenario() {
        let mut context = new_context();

        // Ali gives Bob control over her account.
        deploy(&mut context, BOB, 2, ALI, &[ALI]);

        // Bob was tricked by Joe to add him the control.
        deploy(&mut context, JOE, 2, ALI, &[BOB]);
        
        // Joe doesn't like Ali, so he removes her access.
        deploy(&mut context, ALI, 0, ALI, &[JOE]);

        // Ali try to block Joe, but she can't.
        // This should panic.
        deploy(&mut context, JOE, 0, ALI, &[ALI]);
    }

    #[test]
    fn should_allow_to_add_bob() {
        let mut context = new_context();

        // Ali gives Bob control over her account.
        deploy(&mut context, BOB, 2, ALI, &[ALI]);

        // Bob was tricked by Joe to add him the control.
        deploy(&mut context, JOE, 2, ALI, &[BOB]);
    }

    fn new_context() -> TestContext {
        TestContextBuilder::new()
            .with_account(ALI, U512::from(128_000_000))
            .with_account(BOB, U512::from(128_000_000))
            .build()
    }

    fn deploy(context: &mut TestContext, account: AccountHash, weight: u32, as_account: AccountHash, signers: &[AccountHash]) {
        let session_code = Code::from("contract.wasm");
        let session_args = runtime_args! {
            "account" => account,
            "weight" => weight
        };
        let session = SessionBuilder::new(session_code, session_args)
            .with_address(as_account)
            .with_authorization_keys(signers)
            .build();
        context.run(session);
    }
}

fn main() {
    panic!("Execute \"cargo test\" to test the contract, not \"cargo run\".");
}
