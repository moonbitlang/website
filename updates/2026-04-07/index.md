# 20260407 MoonBit v0.9 Release

**moonc version:** `v0.9.0+9f1423bcb`

## Language Updates

1. **Deprecate `derive(Show)`**

   The interface for debugging data structures has moved to the `Debug` trait. The `Show` trait will now focus on customizable output formats such as `Json::stringify`, rather than special-casing only `String` and `Char`. Manual `Show` implementations are still supported.

2. **Add formal verification support**

   For example, we can use `proof_ensure` to specify properties that the result of a function should satisfy:

   ```moonbit
   // Int is assumed to be unbounded integers
   // We will provide a config option to change it to 32-bit machine integers
   // in later releases
   pub fn abs(x : Int) -> Int where {
     proof_ensure: result => result >= 0,
     proof_ensure: result => (result == x) || (result == -x)
   } {
     if x >= 0 {
       x
     } else {
       -x
     }
   }
   ```

   Enable proof support in `moon.pkg`:

   ```moonbit
   options(
     "proof-enabled": true
   )
   ```

   Then run `moon prove` to view the proof results. More details about verification support will be covered in another article.

3. **Deprecate `loop` syntax**

   The `loop` syntax has been deprecated to simplify the language. Existing code using `loop` can be rewritten using `for` + `match`:

   ```moonbit
   loop value {
     Pattern1 => continue value1
     Pattern2 => ...
   }
   ```

   ```moonbit
   for x = value {
     match x {
       Pattern1 => continue value1
       Pattern2 => { ...; break }
     }
   }
   ```

4. **Stable `regex` support and the new regex match expression `s =~ re"..."`**

   The new regex match expression is similar to the earlier experimental `lexmatch?`, but it has important semantic differences. See the documentation for [regex literal expressions](https://docs.moonbitlang.com/en/latest/language/fundamentals.html#regex-literal-expression) and [regex match expressions](https://docs.moonbitlang.com/en/latest/language/fundamentals.html#regex-match-expression) for details.

   We plan to deprecate the experimental `lexmatch` and `lexmatch?` expressions in the future.

   ```moonbit
   const PREFIX = re"a"
   const ALT = re"b"
   const SUFFIX = re"bc"

   fn main {
     let s = "==abc=="
     let _ = s =~ re"abc"
     let _ = s =~ (PREFIX + SUFFIX, )
     let _ = s =~ (((re"x" as x) | ALT) + SUFFIX, before=y, after~)
   }
   ```

5. **`Int64` and `UInt64` now compile to `BigInt` on the JavaScript backend**

   `UInt64` maps directly to JavaScript `BigInt`. For `Int64`, use `BigInt.asIntN(64, x)` to obtain the corresponding signed 64-bit value.

   We are switching to `BigInt` for two main reasons:

   - Modern JavaScript engines have significantly improved `BigInt` performance, and `Int64` built on top of `BigInt` is now substantially faster than the previous two-`Int` representation.
   - It aligns MoonBit with the natural way 64-bit integers are handled in modern JavaScript.

6. **Add reverse pipeline syntax `div(id="...") <| []`**

   Reverse pipeline introduces a new DSL style for UI libraries and improves readability by reducing nested parentheses in view code:

   ```moonbit
   fn view() -> Html {
     div([
       text("hello"),
       ul([
         li("item 1"),
         li("item 2"),
       ]),
       h1(id="...", [
         a(href="..."),
       ]),
     ])
   }
   ```

   ```moonbit
   fn view() -> Html {
     div <| [
       text("hello"),
       ul <| [
         li("item 1"),
         li("item 2"),
       ],
       h1(id="...") <| [
         a(href="..."),
       ],
     ]
   }
   ```

   The right-hand side also supports lambdas. This enables trailing-lambda style APIs for UI frameworks similar to Compose UI or SwiftUI:

   ```moonbit
   list(album.songs) <| song => {
     hstack <| () => {
       image(album.cover)
       vstack(alignment=Leading) <| () => {
         text(song.title)
         text(song.artist.name)
           .foreground_style(Secondary)
       }
     }
   }
   ```

7. **Unify the ABI of `Unit`-returning FFI functions**

   On the native / wasm / wasm-gc backends, FFI functions returning `Unit` now use a no-return ABI. For example, on the native backend, a MoonBit `extern "C"` declaration returning `Unit` now corresponds to a C function returning `void`.

8. **Add `#deprecated` support for `impl`**

   Currently, `#deprecated` can only be attached to `impl Trait for Type` declarations without `with`. Any use of a deprecated `impl`, including polymorphic calls and direct method calls through that `impl`, will produce a warning:

   ```moonbit
   struct T(Int)

   #deprecated
   impl Eq for T

   impl Eq for T with equal(x, y) {
     x.0 == y.0
   }

   test {
     let _ = T(1) == T(2) // deprecated warning
   }
   ```

9. **`using` and `#alias` now create constructor aliases automatically**

   Tuple structs, structs with constructors, and errors with a single constructor can now automatically get constructor aliases, making them constructible and matchable via the alias:

   ```moonbit
   using @ref {type Ref}

   test {
     let _ = Ref(42) // No need to write `@ref.Ref(42)` anymore
   }

   #alias(Alias)
   struct MyType(Int)

   test {
     let _ = Alias(42) // No need to write `MyType(42)` anymore
   }
   ```

   This makes all three forms work naturally with re-export through `using` and renaming through `#alias`.

## Toolchain Updates

1. **Add workspace support**

   This includes `moon work init` and `moon work use` for creating and managing workspaces. `moon work sync` syncs package versions inside the workspace.

   Commands such as `check`, `test`, and `format` now support workspaces. Publishing still works at the module level only, and should be done with `moon -C module publish`.

2. **Deprecate symbol lookup in `moon doc`**

   Symbol lookup is now unified under `moon ide doc`.

3. **Add Windows aarch64 support to the install script**

4. **Retire `try.moonbitlang.cn` and `oj.moonbitlang.com`**

5. **Change version resolution for pre-1.0 packages**

   Pre-1.0 versions are now treated as compatible until the official 1.0 release. For example, `moonbitlang/async@0.15.0` and `moonbitlang/async@0.16.0` in the dependency graph will now resolve to `moonbitlang/async@0.16.0`.

6. **Improve the UI and documentation browsing experience on `mooncakes.io`**

## Standard Library Updates

1. **Add `immut/vector`**

   `immut/vector` replaces the old `immut/array` and provides better performance.

2. **Adjust the `Show` format of `SourceLoc`**

   File names are now rendered relative to the module rather than the package. This change allows a project's `source` configuration to be reflected in `SourceLoc`. If your tests print `SourceLoc`, you may need to update the expected output with `moon test -u`.

3. **`moonbitlang/async` update (latest version `v0.17.0`)**

   - Add the `@async.Timer` type, which can be used to implement abstractions such as idle timeouts.
   - Many types, such as `@async.Queue`, now provide `struct` constructor APIs and can be created with forms like `@async.Queue(..)`.
   - `@async.spawn_loop` has some breaking signature changes to adapt to upstream type changes.
   - It is now possible to access socket file descriptors directly, which is useful for advanced users binding platform-specific socket APIs.
