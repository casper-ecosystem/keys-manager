prepare:
	rustup target add wasm32-unknown-unknown

build-RS-contract:
	cargo build --manifest-path keys-manager-rust-contract/Cargo.toml --release -p contract --target wasm32-unknown-unknown

build-AS-contract:
	npm run --prefix keys-manager-as-contract asbuild

clippy:
	cd contract && cargo clippy --all-targets --all -- -D warnings -A renamed_and_removed_lints

check-lint: clippy
	cd contract && cargo fmt --all -- --check

lint: clippy
	cd contract && cargo fmt --all
	
clean:
	cd contract && cargo clean

test-only:
	cargo test --manifest-path keys-manager-rust-contract/Cargo.toml -p tests

copy-RS-wasm-file-to-test:
	mkdir -p keys-manager-rust-contract/tests/wasm
	cp keys-manager-rust-contract/target/wasm32-unknown-unknown/release/*.wasm keys-manager-rust-contract/tests/wasm

copy-AS-wasm-file-to-test:
	mkdir -p keys-manager-rust-contract/tests/wasm
	cp keys-manager-as-contract/dist/*.wasm keys-manager-rust-contract/tests/wasm

test-RS: build-RS-contract copy-RS-wasm-file-to-test test-only
test-AS: build-AS-contract copy-AS-wasm-file-to-test test-only