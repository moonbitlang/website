# 20260310 MoonBit v0.8.3 Release

## Language Updates

1. **Functions marked with `#alias` and `#as_free_fn` will no longer inherit attributes that they should not inherit**, such as the `#deprecated` attribute. Now, the alias declared by `#alias` and the various attributes on the original function body can be controlled independently:

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

   With this new feature, `for .. in` loops can now maintain extra state in a functional style without using `let mut`.

4. **Deprecate implicit implementation of method-less traits.Previously**, a trait with no methods was implicitly implemented by all types, without requiring an explicit `impl Trait for Type`. This behavior has now been deprecated, and using such implicit implementations will produce a warning. In the future, this behavior will be removed entirely, and all traits will uniformly require explicit implementation.

5. **Deprecate `for { ... }` infinite loop syntax**.Previously, `for { ... }` could be used to write an infinite loop with no termination condition. This syntax has now been deprecated. Such loops should instead be written as `for ;; { ... }` or `while true { ... }`. This migration can be performed automatically using `moon fmt`. The motivation for this change is that we may add pattern matching support to `for .. in` loops in the future, such as `for (x, y) in array_of_tuple`. The `for { .. }` syntax conflicts syntactically with pattern matching on structs or `Map`s.

6. **Allow omitting the semicolon in `for` loops without an update clause**`.`For `for` loops such as `for i = 0; i < 10; { ... }` (with no update clause), the semicolon after the loop condition can now be omitted, so it can be written as `for i = 0; i < 10 { ... }`.

7. **Remove the behavior allowing impl to always be called via** `.`In MoonBit, an `impl` can only be called using `x.f(..)` syntax when both the `impl` and the type definition are in the same package. However, before the MoonBit beta release, `impls` in the current package could always be called using `.` syntax. This behavior was deprecated with a warning in the beta release, and has now been officially removed.

8. **FFI parameters without an explicitly annotated lifetime management mode are now treated as an error rather than a warning**. In the future, we will officially change the default lifetime management mode for FFI parameters from `#owned` to `#borrow`. For now, the compiler will report an error for any FFI function whose lifetime management mode is not explicitly annotated.

9. **Fix referencing loop variable `i` in `nobreak` blocks of `for i in x..y` loops**.Fixed an issue where the loop variable i could still be referenced inside the nobreak block of a for i in x..<y loop. Some code that accidentally relied on this behavior may now fail to compile.

10. **Improve error messages for mismatched top-level function signatures**. Improved some error messages for mismatched top-level function signatures: the error output now shows only the differing parts of the signature, making it easier to locate the problem. For example:

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

    The improved error message is now:

    ```moonbit
    ...
      expected: (.., flag2~ : _, ..) -> Unit
      actual:   (.., flga2~ : _, ..) -> Unit
    ```

11. **Added the `#unsafe_skip_stub_check` attribute**, which can be used to skip checks on whether types in an FFI signature have a stable ABI. This attribute can be used by advanced users for more complex FFI experiments on the wasm backend. Note that once this check is skipped, FFI behavior becomes undefined and may change at any time, so this attribute should only be used for experimentation.

## Toolchain Updates

1.  **`moon ide` now includes a new `analyze` command for analyzing usage of a package’s public APIs**. It prints the package’s public APIs in `mbti` format, and appends a comment to each API showing its usage information, including total usage count, usage count in tests, and whether the API is defined in `exports.mbt`. Below is an example of the output:

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
    pub using @util {type Token as PublicResult}         // usage: 0 (0 in test)

    // Traits
    pub trait Analyzer {
      analyze(Self, String) -> @util.Token               // usage: 2 (1 in test)
    }
    ```

    `moon ide analyze` supports two ways of passing arguments:

    - `moon ide analyze` analyzes all packages in the current module.
    - `moon ide analyze path/to/pkg1 path/to/pkg2 ...` analyzes all specified packages, and can be used together with shell glob patterns. For example, `moon ide analyze internal/*` can be used to analyze all packages under `internal`.

    This command can be used together with AI-powered refactoring to quickly remove unused public APIs within a module. However, since the public APIs of non-`internal` packages may be used by users outside the module, this kind of refactoring is, in principle, only safe for `internal` packages. To distinguish between APIs in non-`internal` packages that are intended for `internal` use and those intended for external use, we have introduced a new convention: any public API intended for users outside the module should be defined in exports.mbt. Such APIs should not be removed, even if they have no usage within the module. `moon ide analyze` will specially highlight APIs defined in `exports.mbt` in its output, such as `build_report` and `never_called_pub`

2.  Support for `supported-targets` has been improved.
    The new syntax is now enabled, allowing users to explicitly declare which backends are supported using forms like `"+js+wasm+wasm-gc"`, or to declare which backends are not supported using `"+all-js"`.

        This can be defined in both `moon.mod.json` and `moon.pkg`. For a given package, the supported backends are the intersection of the two.

        Better error messages are now provided when a dependency graph cannot be constructed.

3.  The build system now tracks the compiler itself, reducing `segfault` issues caused by compiler version updates and cache mismatches.

4.  The `mbtx` script mode now supports input from `stdin`:
    ```shell
    $ echo "fn main {println(\"hello\")}" | moon run -
    ```
    ```shell
    $ echo "fn main {println(\"hello\")}" | moon run -
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
     let cmd = @argparse.Command("demo", options=[@argparse.OptionArg("name")], positionals=[
       @argparse.PositionArg("target"),
     ])
     let _ = cmd.parse()
   }
   ```
2. Updates to `moonbitlang/async`:

   The JavaScript backend now includes HTTP client support based on the Fetch API. All HTTP client APIs in `moonbitlang/async/http` are available on the JavaScript backend except HTTP proxy support, including in browser environments.

   `moonbitlang/async/js_async` now includes support for interacting with the Web API `ReadableStream`.
