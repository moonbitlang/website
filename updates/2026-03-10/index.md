# 20260310 MoonBit v0.8.3 Release

## Language Updates

1. Functions marked with `#alias` and `#as_free_fn` no longer inherit attributes that should not be inherited, such as `#deprecated`. Alias metadata and attributes on the original function body can now be controlled independently:

   ```moonbit
   // Neither the original nor the alias is deprecated
   #alias(g1)
   fn f1() -> Unit

   // Only the alias is deprecated
   #alias(g2, deprecated)
   fn f2() -> Unit

   // Only the original is deprecated
   #alias(g3)
   #deprecated
   fn f3() -> Unit

   // Both the original and the alias are deprecated
   #alias(g4, deprecated)
   #deprecated
   fn f4() -> Unit
   ```

2. `const` declarations now support string concatenation and string interpolation:

   ```moonbit
   const Hello : String = "Hello"
   const HelloWorld : String = Hello + " world"
   const Message : String =
     $|========
     $|\{HelloWorld}
     $|========
   ```

3. `for .. in` loops now support additional loop variables:

   ```moonbit
   // Sum the array xs
   for x in xs; sum = 0 {
     continue sum + x
   } nobreak {
     sum
   }
   ```

   With this new feature, `for .. in` loops can maintain extra state in a functional style without using `let mut`.

4. Implicit implementation of method-less traits is now deprecated. Previously, a trait with no methods was implicitly implemented by all types without requiring an explicit `impl Trait for Type`. Using this behavior now produces a warning. In the future, this behavior will be removed entirely, and all traits will require explicit implementation.

5. `for { ... }` as infinite-loop syntax is now deprecated. Such loops should be written as `for ;; { ... }` or `while true { ... }` instead. This migration can be performed automatically with `moon fmt`. The motivation is that MoonBit may add pattern matching support to `for .. in` loops in the future, and `for { .. }` would conflict syntactically with struct or `Map` patterns.

6. For `for` loops without an update clause, the semicolon after the condition can now be omitted. For example, `for i = 0; i < 10; { ... }` can now be written as `for i = 0; i < 10 { ... }`.

7. The old behavior that allowed `impl` methods in the current package to always be called via `.` has now been officially removed. In MoonBit, `x.f(..)` syntax is only valid when the `impl` and the type definition are in the same package.

8. FFI parameters without an explicitly annotated lifetime management mode are now treated as an error rather than a warning. This prepares for a future change where the default lifetime management mode for FFI parameters will change from `#owned` to `#borrow`.

9. Fixed an issue where the loop variable in `for i in x..<y` could still be referenced inside the `nobreak` block. Some code that accidentally relied on this behavior may now fail to compile.

10. Improved error messages for mismatched top-level function signatures by showing only the differing parts of the signature. For example:

    ```moonbit
    trait I {
      f(Self, flag1~ : Int, flag2~ : Int, flag3~ : Int) -> Unit
    }

    impl I for T with f(self, flag1~, flga2~, flag3~) {
      ...
    }
    ```

    Previously, the error message was:

    ```moonbit
    ...
      expected: (Self, flag1~ : Int, flag2~ : Int, flag3~ : Int) -> Unit
      actual:   (Self, flag1~ : Int, flga2~ : Int, flag3~ : Int) -> Unit
    ```

    It is now shortened to:

    ```moonbit
    ...
      expected: (.., flag2~ : _, ..) -> Unit
      actual:   (.., flga2~ : _, ..) -> Unit
    ```

11. Added the `#unsafe_skip_stub_check` attribute. It can be used to skip checks on whether types in an FFI signature have a stable ABI, which is useful for advanced wasm FFI experiments. Since this makes FFI behavior undefined and subject to change, it should only be used experimentally.

## Toolchain Updates

1. `moon ide` now includes a new `analyze` command for analyzing usage of a package's public APIs. It prints the package's public APIs in `mbti` format and appends usage information to each item, including total usage count, test usage count, and whether the API is defined in `exports.mbt`:

   ```moonbit
   $ moon ide analyze . # path to packages to be analyzed
   package "username/analyze"

   import {
   "username/analyze/util",
   }

   // Values
   pub const REPORT_CONST_TAG : String = "analyze-tag"  // usage: 2 (1 in test)

   #alias(analyze_raw)                                  // usage: 2 (1 in test)
   pub fn analyze_text(String) -> @util.Token           // usage: 2 (1 in test)

   pub fn build_report(String, @util.Level) -> Report   // usage: 2 (1 in test), in exports.mbt

   pub fn never_called_pub() -> String                  // usage: 0 (0 in test), in exports.mbt

   // Errors

   // Types and methods
   pub(all) struct Report {
     title : String                                     // usage: 1 (0 in test)
     score : Int                                        // usage: 1 (0 in test)

     fn new(String, Int) -> Report                      // usage: 2 (1 in test)
   }
   #as_free_fn(make_report)                             // usage: 2 (1 in test)
   pub fn Report::new(String, Int) -> Self              // usage: 0 (0 in test)
   pub impl Analyzer for Report                         // usage: 2 (1 in test)

   // Type aliases
   pub using @util { type Token as PublicResult }       // usage: 0 (0 in test)

   // Traits
   pub trait Analyzer {
     analyze(Self, String) -> @util.Token               // usage: 2 (1 in test)
   }
   ```

   `moon ide analyze` supports two invocation styles:

   - `moon ide analyze` analyzes all packages in the current module.
   - `moon ide analyze path/to/pkg1 path/to/pkg2 ...` analyzes the specified packages and can be combined with shell glob patterns such as `moon ide analyze internal/*`.

   This command is useful for AI-assisted refactoring when cleaning up unused public APIs inside a module. For non-`internal` packages, public APIs may still be used outside the module, so MoonBit now uses a convention that APIs intended for external users should be defined in `exports.mbt`. `moon ide analyze` highlights those APIs specially.

2. Support for `supported-targets` has been improved:

   - New syntax allows explicit backend declarations such as `"+js+wasm+wasm-gc"` or exclusions such as `"+all-js"`.
   - The setting can be defined in both `moon.mod.json` and `moon.pkg`, and the effective supported backends are the intersection of the two.
   - Error messages are better when dependency graphs cannot be constructed.

3. The build system now tracks the compiler itself, reducing `segfault` issues caused by compiler version updates and cache mismatches.

4. `mbtx` script mode now supports input from `stdin`:

   ```shell
   $ echo "fn main {println(\"hello\")}" | moon run -
   ```

   ```shell
   $ moon run - <<EOF
   import {
     "moonbitlang/core/list"
   }
   fn main {
     debug(@list.from_array([1, 2, 3]))
   }
   EOF
   ```

## Standard Library Updates

1. Added the `argparse` library, which provides basic command-line argument parsing:

   ```moonbit
   ///|
   async fn main {
     let cmd = @argparse.Command(
       "demo",
       options=[@argparse.OptionArg("name")],
       positionals=[@argparse.PositionArg("target")],
     )
     let _ = cmd.parse()
   }
   ```

2. Updates to `moonbitlang/async`:
   - The JavaScript backend now includes HTTP client support based on the Fetch API. All HTTP client APIs in `moonbitlang/async/http` are available on the JavaScript backend except HTTP proxy support, including in browser environments.
   - `moonbitlang/async/js_async` now includes support for interacting with the Web API `ReadableStream`.
