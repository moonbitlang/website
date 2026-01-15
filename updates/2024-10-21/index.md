# 2024-10-21

## Language Update

- **MoonBit [native backend](https://www.moonbitlang.com/blog/native) support**

- **Js-string-builtins proposal support for Wasm-gc backend**

  When the `-use-js-builtin-string` compiler option is enabled, MoonBit strings will be represented with JavaScript's string type when targeting the wasm-gc backend. This requires importing string-related functions from the JavaScript host into the generated Wasm executable. This can be achieved using the following option in the JS glue code:

```javascript
// glue.js
// read wasm file
let bytes = read_file_to_bytes(module_name);
// compile the wasm module with js-string-builtin on
let module = new WebAssembly.Module(bytes, { builtins: ['js-string'], importedStringConstants: "moonbit:constant_strings" });
// instantiate the wasm module
let instance = new WebAssembly.Instance(module, spectest);
```

- **Integer literal overloading for Byte type**

```moonbit
let b : Byte = 65
println(b) // b'\x41'
```

- **Multiline string interpolation and escape sequence support**

  Since multiline strings are sometimes used to store raw strings, which may contain sequences conflicting with escape sequences, MoonBit has extended the existing multiline string interpolation syntax. Users can now control whether to enable interpolation and escape sequences for each line with the following markers:

  `$|`: enables interpolation and escape

  `#|`: marks it as a raw string.

  For example:

```moonbit
let a = "string"
let b = 20
let c =
  #| This is a multiline string
  $| \ta is \{a},
  $| \tb is \{b}
  #| raw string \{not a interpolation}
println(c)
```

  Print:

```plain text
 This is a multiline string
        a is string,
        b is 20
 raw string \{not a interpolation}
```

- **Syntax adjustment for labeled parameters**

  The syntax `f(~label=value)` in function calls and `Constr(~label=pattern)` in pattern matching has been removed. The form without the `~` symbol is now the only valid syntax: `f(label=value)` and `Constr(label=pattern)`. However, `f(~value)` and `Constr(~name)` remain unaffected.

## IDE Update

- Fixed highlighting for string interpolation.

## Core Update

- **Introduced `StringBuilder` in the Builtin package**

  `StringBuilder` has been optimized for string concatenation operations across different backends. For example, on the JS backend, using `StringBuilder` results in a fivefold performance improvement compared to the previous `Buffer` implementation. The `Buffer` in the Builtin package has been deprecated, and its related APIs have been moved to the `moonbitlang/core/buffer` package. Future updates will involve adjustments to the `Bytes` and `Buffer` APIs.

- **Bitwise operations adjustment**

  The standard library’s left and right shift functions (`lsr`, `asr`, `lsl`, `shr`, `shl`) have been deprecated. Only `op_shl` and `op_shr` remain. For bitwise operations like `lxor`, `lor`, `land`, `op_shr`, and `op_shl`, infix operators are now recommended for use.

- **Breaking change**

  The `Last` function in `immut/List` now returns `Option[T]`.

## Build System Update

- **Initial support for the native backend**
  - `run | test | build | check` now support `--target native`.
  - On the native backend, `moon test` compiles with `tcc` in debug mode (default) and `cc` in release mode (on Unix). Windows is not yet supported.
  - Panic tests are not yet supported.

- **Support for `@json.inspect`**—objects inspected must implement `ToJson`.

  Example:

```moonbit
enum Color {
  Red
} derive(ToJson)

struct Point {
  x : Int
  y : Int
  color : Color
} derive(ToJson)

test {
  @json.inspect!({ x: 0, y: 0, color: Color::Red })
}
```

  After running `moon test -u`, the test block is automatically updated:

```moonbit
test {
  @json.inspect!({ x: 0, y: 0, color: Color::Red }, content={"x":0,"y":0,"color":{"$tag":"Red"}})
}
```

  Compared to `inspect`, the results of `@json.inspect` can be formatted with code formatting tools:

```moonbit
test {
  @json.inspect!(
    { x: 0, y: 0, color: Color::Red },
    content={ "x": 0, "y": 0, "color": { "$tag": "Red" } },
  )
}
```

  Additionally, `moon test` automatically performs structured comparisons on the JSON within `@json.inspect`.

```moonbit
enum Color {
  Red
  Green
} derive(ToJson)

struct Point {
  x : Int
  y : Int
  z : Int
  color : Color
} derive(ToJson)

test {
  @json.inspect!(
    { x: 0, y: 0, z: 0, color: Color::Green },
    content={ "x": 0, "y": 0, "color": { "$tag": "Red" } },
  )
}
```

  The `moon test` output diff for the following code will look like this:

```diff
Diff:
 {
+  z: 0
   color: {
-    $tag: "Red"
+    $tag: "Green"
   }
 }
```

- **`moon.mod.json` supports `include` and `exclude` fields**. These fields are arrays of strings, with each string following the same format as lines in a `.gitignore` file. The rules are as follows:
  - If neither `include` nor `exclude` fields exist, only the `.gitignore` file is considered.
  - If the `exclude` field exists, both the `exclude` field and `.gitignore` file are considered.
  - If the `include` field exists, both `exclude` and `.gitignore` are ignored; only files listed in `include` will be packaged.
  - The `moon.mod.json` file is always packaged, regardless of the rules.
  - `/target` and `/.mooncakes` are always excluded from packaging.

- **Added the `moon package` command** for packaging files without uploading.
  - `moon package --list` lists all files in the package.

- **Support for `moon publish --dry-run`**—the server will validate the package without updating the index data.
