prepare:
	rustup target add wasm32-unknown-unknown

build-contract:
	cargo build --release -p contract --target wasm32-unknown-unknown

test-only:
	cargo test -p tests

copy-wasm-file-to-test:
	cp target/wasm32-unknown-unknown/release/contract.wasm tests/wasm

test: build-contract copy-wasm-file-to-test test-only

clippy:
	cd contract && cargo clippy --all-targets --all -- -D warnings -A renamed_and_removed_lints

check-lint: clippy
	cd contract && cargo fmt --all -- --check

lint: clippy
	cd contract && cargo fmt --all
	
clean:
	cd contract && cargo clean
