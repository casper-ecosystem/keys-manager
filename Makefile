prepare:
	rustup target add wasm32-unknown-unknown

build-contract:
	cd contract && cargo build --release -p keys-manager --target wasm32-unknown-unknown

clippy:
	cd contract && cargo clippy --all-targets --all -- -D warnings -A renamed_and_removed_lints

check-lint: clippy
	cd contract && cargo fmt --all -- --check

lint: clippy
	cd contract && cargo fmt --all
	
clean:
	cd contract && cargo clean
