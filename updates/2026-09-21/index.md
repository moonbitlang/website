# 20260921 MoonBit v0.10.14 Release

**moonc version:** `v0.10.14`

## Language Updates

### `MySubError::_` pattern

You can now use `T::_` to match suberrors by type without listing every error constructor of that type. This feature can also narrow `Error` to a specific `suberror` type.

```moonbit
suberror ParseError {
  Empty
  InvalidChar(Char)
}

fn describe(error : Error) -> String {
  match error {
    ParseError::_ as e => use_suberror(e) // type of e is ParseError
    _ => "Other error"
  }
}

fn use_suberror(_e: ParseError) -> String {
  "Parse error"
}

fn main {
  println(describe(ParseError::Empty)) // Parse error
  println(describe(ParseError::InvalidChar('?'))) // Parse error
}
```

### `for... in...` now supports pattern matching

`for... in...` loops can now destructure elements directly during iteration:

```moonbit
fn main {
  let items = [("Apple", 2), ("Pear", 3)]
  for (name, count) in items {
    println("\{name}: \{count}")
  }
  // Output:
  // Apple: 2
  // Pear: 3
}
```

### `#non_exhaustive` annotation for `enum`

An `enum` marked with `#non_exhaustive` may gain new constructors in the future. When matching such an `enum` from another package, you must handle potential future constructors with `TypeName::..` after matching all known constructors. Otherwise, the compiler issues a warning:

```moonbit
// @pkg
#non_exhaustive
enum E {
  A
  B
}

// In another package:

fn bad(x : @pkg.E) -> Unit {
  // Compiler warning: matching a `#non_exhaustive` enum requires handling unknown constructors
  match x {
    A | B => ...
  }
}

fn good(x : @pkg.E) -> Unit {
  match x {
    A | B => ...
    E::.. => println("fallback")
  }
}
```

`E::..` is a construct specifically for handling unknown constructors. If you use `E::..` while some known constructors remain unmatched, the compiler also issues a warning. For example, if @pkg adds a new constructor C to E, the pattern match in good receives a warning that the known constructor C is unmatched. This lets downstream users learn about new upstream constructors through warnings. At runtime, `E::..` matches any value. Until good is updated to handle the new constructor C, the default branch with `E::..` handles C, so the program does not crash.

If you only want to match a few specific constructors of a `#non_exhaustive` type, you can use `_`. You can use `_` even when some known constructors remain unmatched, explicitly ignoring all remaining constructors. However, if you use `_` after matching all known constructors, the compiler warns you to use `E::..` instead, because only `E::..` provides a warning when upstream adds new constructors.

### Pipeline expression improvements

The anonymous function body on the right side of `lhs |> x => {...}` can now call `async` functions:

`.mbtx script`

```moonbit
import {
  "moonbitlang/async@0.21.3",
}

async fn main {
  let result = 21 |> value => {
    @async.sleep(1)
    double(value)
  }
  println(result) // 42
}
```

### Improvements to slicing with `a[i:j]`

Slicing with `a[i:j]` now produces a clamped view, with the slice range restricted to valid bounds.

```moonbit
fn main {
  let values = [10, 20, 30]
  let middle = values[1:10] // The actual range is [1:3], containing 20 and 30
  println(middle.length()) // 2
  println(middle[0]) // 20
  println(values[5:10].length()) // 0, an empty view
}
```

The main motivation is to ensure that `a[i:j]` does not crash at runtime, including when taking a view of a String with invalid indices at UTF-16 surrogate boundaries. To use the previous view operation, which could crash, use the new `exact_view` API.

### Improved warnings for unused packages. The following two cases now produce warnings:

- A package from `moonbitlang/core` is explicitly imported with `import` but is not used.

- An `import` is not used explicitly through `@xxx.xxx`, and the imported package's contents are only used indirectly, such as through method calls.

In both cases, the `import` is unnecessary, but the compiler previously gave no warning. The compiler now warns in both cases. For example, the following configuration and code in a regular package cause `moon check` to report `unused_package`. Removing the unused math `import` clears the warning.

```moonbit
import {
  "moonbitlang/core/math", // This package does not use it, so this import can be removed
}
```

```moonbit
fn main {
  println("Hello, MoonBit!")
}
```

### Improved error recovery for `var x = 10`

Improved diagnostics for var declarations, including those with type annotations. The compiler recognizes them and issues a warning to use `let mut` instead.

```moonbit
fn main {
  var count = 0 // Warning: use let mut instead
  count += 1
  println(count)
}
```

### Deprecated the use of `Array` at JavaScript FFI boundaries

Future versions will change the ABI of MoonBit `Array` on the JavaScript backend, so it will no longer be guaranteed to be equivalent to JavaScript's `Array`. Using `Array` at FFI boundaries is therefore deprecated. Use `FixedArray` instead.

### Warning for implicit promotion of `impl` to methods is now enabled by default

Previously, an `impl` defined in the same package as its type was implicitly promoted to methods, allowing calls through dot syntax. We plan to deprecate this behavior in favor of explicit `extend Type with Trait::{f, g}` declarations. The compiler provides a migration warning for every `pub impl` that is implicitly promoted to methods under the current semantics. To migrate:

- To preserve a method, add an `extend` declaration.

- To deprecate a method, still add an `extend` declaration, but mark it with `#deprecated`.

This warning was previously disabled by default. It is now enabled by default, and all users should migrate to explicit `extend` declarations. See the [2026/07/13 release note](../2026-07-13-moonbit-0-10-4-release/index.md) for more details.

### Warning for implicit imports in blackbox tests is now enabled by default

In MoonBit, blackbox tests (`_test.mbt` files) test a package's public API and are compiled as a separate package. References to APIs from the tested package should therefore use explicit `@pkg.xxx` syntax. To simplify writing tests, the compiler previously imported all definitions from the tested package implicitly, unless a name was shadowed by a local definition in the test files. We no longer encourage relying on this implicit behavior. The compiler provides the `test_unqualified_package` warning wherever implicitly imported definitions are used. This warning was previously disabled by default and is now enabled by default.

## Toolchain Updates

### Moon and Runtime

- Added `moon search` for finding packages. For example, `moon search 'html markdown'` finds packages related to html and markdown.

- Added `moon view` for viewing information such as package versions and packages published by a particular user. Examples include `moon view --my` and `moon view moonbitlang/async --versions`.

- Added `moon deprecate` for marking a package as deprecated. Deprecating individual versions is not yet supported.

- `moon tree [--json]` lists a module's external dependencies. `moon tree --package [--json]` lists package dependencies.

- `moonx` will focus on execution with the Wasm backend. `--target native` is deprecated.

- `moonx` execution policies now support spawning processes based on command prefixes.

- `moonx` execution policies can now be inherited across `moonx` calls.

- `moonx` now supports running `.mbtx` files.

- `.mbtx` files have experimental support for declaring required permissions at the top of the file, with restrictions enforced by the runtime. For example:

```moonbit
// policy:
//   fs:
//     read: []

///|
import {
  "moonbitlang/async@0.21.3",
  "moonbitlang/async@0.21.3/fs",
}

///|
async fn main {
  // Following operation will be rejected
  println(@fs.read_file("input.txt").text())
}
```

- `moon runwasm` is deprecated.

- Experimental prebuild scripts now support `.mbtx` and can receive additional environment variables. The existing input mechanism through stdin will be removed.

- Experimental prebuild scripts are restricted to running on the native backend.

### Editor Support

- The language service can now handle multiple backends in the same workspace at the same time.

- `moon ide` now supports `.mbtx` files. Fixed an issue where `import` aliases could be overwritten when a `moon.pkg` file was in the same directory as the script.

## Standard Library Updates

### `moonbitlang/core`

- QuickCheck now supports unbiased random number generation, with improved generation ranges and boundary value coverage for scalar `Arbitrary` instances. The `BigInt` generator is no longer limited to 64 bits and can generate a wider range of values and common boundary values. A unified entry point for shrinkers has also been added.

- Added `derive(Shrink)` to automatically generate counterexample shrinking logic, helping find smaller, simpler failing cases. Shrinking based on subterms is not yet supported.

- Added `BigInt` implementations using wide arithmetic for the native and wasm1 backends. Fixed several overflow issues in `immut/vector`.

- Adjusted how `Array` handles iteration and cleanup. Iteration first obtains the underlying buffer. Operations such as `pop`, `truncate`, and `clear` update the length first, and the original slots may still hold references to elements. The new `fill_unused` function can release these references by filling the slots with a default value.

- Added percent-encoding helpers that encode characters in %XX form.

### moonbitlang/x

- Completed and optimized `crypto`.

- Added the `jwt` package with support for HS256 encoding and decoding.

- Added the `bcrypt` package for password hashing.

- Consolidated Unicode implementations into `moonbitlang/x/unicode`. The old APIs are deprecated.

### `moonbitlang/async`

The latest version of `moonbitlang/async` is 0.22.1. The main updates since the last monthly report (0.21.0) are:

- [breaking] Changed cancellation semantics. Previously, when an `async` task was cancelled, it received a special `suberror` as a signal so that the cancelled code could perform cleanup. The cancellation signal is now implemented through a special compiler primitive instead of a `suberror`. Compared with a `suberror`:

  - The new cancellation signal still propagates upward automatically, like an error.

  - The cancellation signal can trigger `defer` and `errdefer`.

  - The new cancellation signal cannot be caught with `catch`.

For guidance on migrating user code, see [https://github.com/moonbitlang/async/releases/tag/v0.22.0](https://github.com/moonbitlang/async/releases/tag/v0.22.0)

- [breaking] `@async.is_cancellation_error` now always returns `false` and is deprecated, because the cancellation signal is no longer a special error. In a `catch` that uses `@async.is_cancellation_error` to handle cancellation separately, you can delete the cancellation branch if it only skips handling the cancellation signal. Otherwise, use `@async.handle_cancellation` to handle cancellation separately.

- Some APIs now have more precise types. Since cancellation is no longer a special error, cancellability is no longer tied to `raise` at the type level. In the latest version, `async` functions are cancellable by default. Only `async` functions explicitly marked with `nocancel`, such as `@async.protect_from_cancel`, are non-cancellable. Async functions that do not themselves `raise` errors but can be cancelled, such as `@async.sleep`, can now include `noraise` in their signatures.

- [breaking] `@async.TaskGroup::add_defer` now requires the callback passed to it to be `nocancel`.

- `@async.with_cancellation_handler` is deprecated and replaced by a new API, `@async.handle_cancellation`. `@async.handle_cancellation` runs an `async` callback, which remains cancellable at runtime, and returns `None` if the callback is cancelled. It can be used to handle cancellation separately. `@async.handle_cancellation` cannot revoke the current task's cancelled state. Even after a cancellation signal is caught once, subsequent cancellable `async` operations in the current task are still cancelled immediately.

- `@fs.remove` and `@fs.rmdir` are now non-cancellable (`nocancel`).

- `@socket.TcpServer(..)` has a new option, `reuse_port_lb?: Bool = false`. When enabled, the TCP server can share the same listening address with other servers, and the kernel automatically balances the load across servers sharing that port. This option is only supported on Linux and is ignored on other operating systems.

- Added `@async.platform` to identify the current operating system at runtime. Since the same Wasm binary can run on different operating systems, programs using the Wasm backend can only determine the current operating system at runtime, not at compile time.

## Ecosystem and Development Tool Updates

### mooncakes.io

- The search service is now live, with indexing of package summaries and pre-indexing of existing packages.

- Modules can now be deprecated through `moon deprecate`. The website displays their deprecation status and reason.

- Improved build speed in the build queue.

### SeekMoon

- Added web search and mbtx tools. The mbtx tool lets agents run mbtx scripts in a sandbox. Improved error reporting when the edit tool fails.

- Added retries when SSE streams disconnect, reducing interruptions to agent runs caused by network instability.

- Integrated diff algorithms based on MoonBit tokens and ASTs, with support for ignoring differences in tests and comments. Added navigation between blocks and the ability to mark blocks as viewed. Added Git commit history.

- Added support for rendering `.mbti` as SVG and displaying project dependency graphs from `moon.mod`.

- Integrated rg text search and moongrep search. AI can repair moongrep query patterns.

- Added context menus and Cmd+W to close tabs. Improved highlighting of selected text, fonts, and other UI details.

- Improved Windows support.

- `cmd/openseek` now supports running on Wasm.

### Rabbita and Full-Stack Development

A MoonBit full-stack template is available for web, desktop, and backend development, with debugging and packaging ready to use. No Makefile or scripts in other languages are needed: [https://github.com/moonbit-community/fullstack-moonbit](https://github.com/moonbit-community/fullstack-moonbit).

### Proton

- The desktop development framework proton is open source under the Apache 2.0 license: [https://github.com/moonbit-community/proton](https://github.com/moonbit-community/proton)

- Internationalization, app icon badges, context menus, and accessibility are now supported.

### Moonback

The web backend framework Moonback is now open source under the Apache 2.0 license and has moved to moonbitlang/moonback. The mooncakes.io website backend is now powered by moonback.

### cli Command-Line Tools

`cli/<cmd>` has been published on mooncakes, including the commands already ported by moonbit-jq. Work continues on porting common commands and verifying them across platforms. Versions 0.1.2 to 0.1.4 added missing common options and fixed behavior that differed from the upstream tools.

### `moonbit-community/sqlite3`

Added experimental `async` support for the native and wasm backends.
