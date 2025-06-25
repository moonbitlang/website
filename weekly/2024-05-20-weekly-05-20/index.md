# weekly 2024-05-20

MoonBit is a Rust-like programming language (with GC support) and toolchain optimized for WebAssembly.

## Language Update
- **Breaking Change**: Rename `Array` to `FixedArray`, `@vec.Vec` to `Array`
```moonbit
// Before
fn init {
  let array : @vec.Vec[Int] = [1, 2, 3]
}
// After
fn main {
  let array : Array[Int] = [1, 2, 3]
}
```
- Add pattern matching support for `Map`, `HashMap`.
  - The type must implement the `op_get` method, where the key is a native type (Int, Char, String, Bool, etc.), and the value is an `Option[T]`.
  - When matching, the key must be a literal.
  - In `{ "key": pat }`, the pattern pat type is `Option[T]`. None means "key" does not exist, `Some(p)` means "key" exists, and `p` will be used to match the value of this key.
  - The pattern for matching key-value pairs is open: unmatched keys will be ignored even if they exist.
  - Key-value pair patterns will generate optimized code, with each key being queried at most once.
```moonbit
fn main {
  let map = @map.Map::[ ("a", 1) ]
  match map {
    // Match when `map` contains "b",
    // and bind the value of "b" in `map` to `y`.
    { "b": Some(y) } => println(y)
    // Match when `map` does not contain "b" but contains "a",
    // and bind the value of "a" to `k`.
    { "b": None, "a": Some(k) } => println(k)
    // The compiler warns that the case { "b": None, "a": None } is not matched.
  }
  // Output: 1
}
```
- Allow omitting the `newtype` constructor when type information is known.
```moonbit
type A Int

pub fn op_add(self : A, other : A) -> A {
  self.0 + other.0 // omit the constructor
}

fn main {
  A::A(0) + 1 |> ignore // omit the constructor of 1
  let _c : A = 0 + 1 + 2
}
```
## Build System Update
- Configuration file options are converted to kebab-case (we'll still support snake_case for a while).
```json
{
  "is-main": true,
  "test-import": []
}
```
- Wasm, Wasm-GC: The backend supports specifying the exported memory name (default is `moonbit.memory`) and compile options (e.g., `-no-block-params` for compatibility with the Binaryen toolchain) in `moon.pkg.json`.
```json
{
 "link": {
  "wasm": {
  "export-memory-name": "custom_memory_name",
  "flags": ["-no-block-params"]
 },
}
```
- `moon check` adds a `--deny-warn` option, treating warnings as failures and returning a non-zero exit code.
- Optimized the execution speed of `moon fmt` and `moon info`.
- `moon fmt` adds a `--check` option to check if the current code is formatted.
## Core Update
- Added an experimental library [moonbitlang/x](https://github.com/moonbitlang/x) for developing and testing packages with unstable APIs. Once packages in `moonbitlang/x` are stable, we will select important packages to merge into `moonbitlang/core` based on community feedback.
  - `num`, `time`, `uuid`, and `json5` have all been moved to `moonbitlang/x`.
- The Bytes API moved from the `Int` type to the `Byte` type.
```moonbit
fn Bytes::op_get(self : Bytes, index : Int) -> Byte
fn Bytes::op_set(self : Bytes, index : Int, value : Byte) -> Unit
fn Bytes::length(self : Bytes) -> Int
fn Bytes::make(len : Int, ~init : Byte = b'\x00') -> Bytes
```

