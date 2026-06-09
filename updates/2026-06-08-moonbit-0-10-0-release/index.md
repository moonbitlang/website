# 20260608 MoonBit v0.10.0 Release

**moonc version:** `v0.10.0+84519ca0a`

_This update is for MoonBit 0.10, an important step before the official 1.0 release. We are continuing to refine the language, toolchain, and ecosystem experience, and are currently targeting MoonBit 1.0 for Q3. The final timeline may be adjusted based on testing progress and community feedback._

## Language Updates

1. **`trait` and `impl` syntax now require the `fn` keyword:** This change makes it easier to add support for polymorphic methods in traits. Existing code can be migrated automatically by running `moon fmt`. The old syntax without `fn` is still supported for now; in the next version, it will start producing warnings and will be removed in the future. `impl` entries in `.mbtp` files are also now required to include the `fn` keyword.

   ```mbt
   trait I {
     fn f(Self) -> Unit
   //^^
   }

   impl I for Int with fn f(_) {}
   //                  ^^
   ```

2. **Polymorphic `trait` methods are now supported.** Methods inside a `trait` can now have their own type parameters. When implementing a polymorphic trait method, the method's own type parameters do not need to be annotated explicitly. If you do annotate them, put the method type parameters after the `fn` keyword, while the type parameters of the `impl` itself still go after the `impl` keyword:

   ```mbt
   trait Logger {
     fn[X : Show] write_object(Self, X) -> Unit
   }

   impl Logger for StringBuilder with fn write_object(self, x) {
     self.write_string(x.to_string())
   }
   ```

   ```mbt
   trait Poly {
     fn[X] f(Self, X) -> Unit
   }

   impl[A] Poly for Array[A] with fn[X] f(self, x : X) {
   //  ^^^ impl type parameters      ^^^ method type parameters
     ...
   }
   ```

3. **`for .. in` loops now support default updates for state variables.**

   ```mbt
   for i in 0..<10; p1 = 1, p2 = 0; p1 = p1 + p2, p2 = p1 {
                                 // ^^^^^^^^^^^^^^^^^^^^^
                                 // New in this release. The semantics are
                                 // the same as default updates in regular
                                 // `for` loops. When `continue` with arguments
                                 // is not called explicitly, these declarations
                                 // update the loop variables at the end of
                                 // each iteration.
     println("fib#\{i + 1} = \{p1}")
   }
   ```

4. **List comprehensions now support extra loop variables from `for .. in`.**

   ```mbt
   let fibs = [
     for _ in 0..<10
         p1 = 1, p2 = 0
         p1 = p1 + p2, p2 = p1 => {
       p1
     }
   ]
   ```

5. **When using list comprehensions to construct types other than `Iter`, the body can contain side effects.** This includes `raise` and `async`.

6. **String interpolation improvements.**

   - String interpolation used to compile to string concatenation. It now compiles to efficient writes into a `StringBuilder`. For example, `let r = "a\{b}c"`:

     ```moonbit
     // Previous compilation result
     let r = "a" + b.to_string() + "c"

     // Current compilation result
     let r = {
       let builder = StringBuilder(size_hint=2)
       builder.write_string("a")
       builder.write(b)
       builder.write_string("c")
       builder.to_string()
     }
     ```

   - Inside string interpolation `\{...}`, the use of `{`, `}`, and `"` is no longer restricted, so nested string interpolation is allowed.

     ```mbt
     let xs = ["cd", "ef"]
     let r1 = "ab\{xs.join(";")}"
     assert_eq(r1, "abcd;ef")
     ```

   - Nested anonymous functions are supported inside string interpolation and receive special handling:

     ```mbt
     let r = "a\{builder => builder.f()}"
     // Equivalent to
     let r = {
       let builder = StringBuilder()
       builder.write_string("a")
       (builder => builder.f())(builder)
       builder.to_string()
     }
     ```

7. **Added template write syntax `lhs <+ rhs`.** In web backend development, a common pattern is to assemble strings through a buffer. Calling `StringBuilder::write_string` and `StringBuilder::write` manually is verbose. HTML DSLs or template engines can also be used for this scenario, but they introduce extra memory allocation and string replacement overhead. Template write syntax provides a lighter, more readable solution with zero additional overhead. The following is equivalent code using the new feature:

   ```mbt
   fn render(
     style : String,
     li_class : String,
     items : Array[String],
   ) -> String {
     let buf = StringBuilder()
     // <ul prop=foo>
     buf..write_string("<ul prop=foo>")
     //   <li class="{li_style}">{item}</li>
     for item in items {
       buf..write_string("<li class=\"")
          ..write(li_class)
          ..write_string("\">")
          ..write(item)
          .write_string("</li>")
     }
     // </ul>
     buf.write("</ul>")
     buf.to_string()
   }
   ```

   ```mbt
   fn render(
     style : String,
     li_class : String,
     items : Array[String],
   ) -> String {
     let buf = StringBuilder()
     buf <+ "<ul prop=foo>"
     for item in items {
       buf <+ $|<li class="\{li_class}">\{item}</li>
     }
     buf <+ "</ul>"
     buf.to_string()
   }
   ```

   For `buf <+ "a\{b}"`, it is decomposed directly into `buf..write_string("a")..write(b)`.

   The right-hand side of `<+` supports the following expressions:

   - A string: `"abc\{x}"`

   - A multiline string: `#| multiline string...`

   - A multiline string interpolation: `$| multiline string with \{x}`

   - A map literal: `{"k1": v1, "k2": v2}`

   The left-hand side of `<+` does not have to be a `StringBuilder`; it can be any type `T` that implements the following methods:

   - `T::write_string(T, String)`

   - `T::write(T, X)`

   - Optional, for map literals: `T::write_object_begin(T)`, `T::write_object_field(T, String, X)`, and `T::write_object_end(T)`

   The syntax rules for string interpolation inside `\{...}` are the same as regular string interpolation.

8. **Added conditional template write syntax `lhs <? rhs`.** On top of template write syntax, writes can now have a precondition. This is useful for debug logging and similar scenarios: the program should output debug information only in debug mode and should not pay the logging cost in normal mode. In the following example, `logger` has type `Option[T]`. In debug mode, its value is `Some(...)`; in normal mode, it is `None`.

   ```mbt
   logger <? "[tag] message \{x}..."
   // Equivalent to
   if logger is Some(x) {
     x <+ "[tag] message \{x}..."
   }
   ```

9. **Removed the old struct constructor syntax.** The previously deprecated custom constructor syntax `fn new(..)` is no longer supported. The unified new constructor syntax is `fn Type::Type(..)`.

10. **Deprecated the `try?` syntax.** The compiler now provides migration suggestions during checking.

11. **Added the experimental built-in `V128` type.** It currently compiles to the `v128` type on the wasm/wasm-gc backends. On the native backend that generates C code, it compiles to `uint8x16_t` on Arm architectures with NEON support and to `__m128i` on x86 architectures with SSE2 support. In other cases, it is simulated with two `uint64` values. None of these details are ABI guarantees; efficient `V128` operations will be provided through the standard library in the future.

## Toolchain Updates

1. The new MoonBit native backend has been released and can be tried with the `MOONBIT_NEW_NATIVE=1` environment variable. It currently supports macOS on Apple Silicon only; Linux and Windows support will be rolled out gradually.

2. Added `moon test --profile` and `moon run --profile`. On macOS, these commands use `xctrace` to profile native programs. Linux support has also been completed.

3. Added `--diagnostics-limit` to limit the number of errors and warnings and reduce the noise from printing the underlying `moonc` command directly on failure.

4. The Wasm backend's `println` implementation has been replaced with a WASI-based implementation.

5. Added the experimental `moon runwasm` command and SKILL marketplace. Use `moon runwasm Yoorkin/cowsay -- hello` to directly run packages published on mooncakes.io that support the Wasm target. mooncakes.io automatically builds wasm-opt-optimized `*.wasm` files for packages that support Wasm compilation targets and displays any `SKILL.md` in the same directory on the [mooncakes.io/skills](https://mooncakes.io/skills) page.

   ![mooncakes.io skills page](mooncakes-skills.png)

   ![moon runwasm example](./moon-runwasm.png)

6. Use `moon.mod` instead of `moon.mod.json` by default. `moon.mod` now supports top-level fields such as `supported_targets`, `preferred_target`, `readme`, `license`, `keywords`, `repository`, and `description`. `moon fmt` enables migration from `moon.mod.json` to `moon.mod` by default. If issues occur, set `NEW_MOON_MOD=0` to disable it.

7. The behavior of `moon add path/to/mod` has been changed: adding an existing dependency again now only emits a warning and no longer updates the version implicitly. Use `moon add --upgrade path/to/mod` when an update is needed.

8. Native LSP is now the default LSP, with newly added LSP support for `moon.mod` and `moon.pkg`.

9. Added the experimental `moon cram test` command for testing MoonBit CLI applications. It first builds CLI programs in the project with the native backend, puts them into the `PATH`, and then runs cram tests. See the basic example at [moonbit-community/cram_test_poc](https://github.com/moonbit-community/cram_test_poc).

10. Added experimental `moon run --profile` and `moon test --profile` tooling. It currently supports the native backend on macOS and Linux, using `xctrace` and `perf` respectively for profiling and demangling symbols in the results.

## Standard Library Updates

1. `moonbitlang/async` is now at version 0.19.2. The main updates since the previous monthly report, 0.19.0, are as follows:

   - Added support for watching file system changes. Use `@fs.Watcher(..)` to watch changes under all child files and folders of a directory. Currently, `@fs.Watcher` only provides the `wait_any` method and does not yet report the specific changed content. Support for reporting detailed change information will be added in the future. See the `@fs.Watcher` documentation for details.

   - Added the `@raw_fd.RawFdStream` type. It is similar to `@raw_fd.RawFd`, but implements `@io.Reader`/`@io.Writer`, making it easier to operate file descriptors with stream semantics.

   - Added the `@async.Mutex` type for synchronization across concurrent tasks.

   - Added optional file descriptor leak checking, which can be enabled with `MOONBIT_ASYNC_CHECK_FD_LEAK=1`. When enabled, if the program forgets to release resources managed by `moonbitlang/async`, such as files, it will `abort` before exit and report the leak.
