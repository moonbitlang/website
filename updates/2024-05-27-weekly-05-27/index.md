# weekly 2024-05-27
MoonBit is a Rust-like programming language (with GC support) and toolchain optimized for WebAssembly.

## Language Update
- Breaking Change: Restructure APIs of MoonBit Core library.
  - Placing all immutable data structures under the `immut` path, for example, from `@immutable_hashmap.Map` to `@immut/hashmap.Map`.
```moonbit
// Before
let a : @immutable_hashmap.Map[Int, Int] = @immutable_hashmap.make()
// After
let a : @immut/hashmap.Map[Int, Int] = @immut/hashmap.make()
```
- Performance optimization for the Option[T] type in the core library:
  - When the type T is a reference type, for values of type Option[T], `Some(v)` will be directly compiled into `v`, and None will be compiled into ref.null in the wasm-gc backend, or `undefined` in the JavaScript backend, thus avoiding memory allocation.
- Introduced `fn panicT -> T` function in the core library, which can be used within test blocks where the test name must start with `"panic"`:
```bash
test "panic test ok" {
  panic() // Test passes
}

test "panic test failed" {
  () // Test fails
}
```

## IDE Update
- VS Code extension: Added `test` and `for` code snippets.
  `test` snippet:
![test.gif](test.gif)
  `for` snippet:
![for.gif](for.gif)

## Build System Update
- Initialization: `moon new` now automatically initializes version control for new projects, currently supporting git
- Testing: You can now specify multiple packages to test
```bash
moon test -p a b c
moon test -p a -p b -p c
```

## Toolchain Update
- Installation: You can now specify a version number for installation
```bash
# Mac and Linux Users
# Download the latest version
curl -fsSL https://cli.moonbitlang.com/install/unix.sh | bash
# Download the bleeding edge version
curl -fsSL https://cli.moonbitlang.com/install/unix.sh | bash -s bleeding
# Download a specific version
curl -fsSL https://cli.moonbitlang.com/install/unix.sh | bash -s 0.1.20240520+b1f30d5e1
```
```powershell
# Windows Users
# Download the latest version
irm cli.moonbitlang.cn/install/powershell.ps1 | iex
# Download a specific version
$env:MOONBIT_INSTALL_VERSION = "0.1.20240520+b1f30d5e1"; irm cli.moonbitlang.cn/install/powershell.ps1 | iex
```
- Installation: You can now look up the SHA256 checksum for a specific version to verify downloads.
    - Visit: [https://www.moonbitlang.com/download/#verifying-binaries](https://www.moonbitlang.com/download/#verifying-binaries)