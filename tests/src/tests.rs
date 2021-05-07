use crate::keys_manager::KeysManagerContract;

#[test]
fn test_keys_manager_deploy() {
    let _ = KeysManagerContract::deploy();
}
