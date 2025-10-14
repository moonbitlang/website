# 20251014 MoonBit Monthly Update Vol.04
## **Version v0.6.29**
## Language Updates
- Asynchronous Programming Enhancements

    Added support for `async test` and `async fn main` syntax, enabling asynchronous tests and asynchronous main functions. Both `async fn main` and `async test` are based on the `moonbitlang/async` library and are currently supported on the native backend for Linux and macOS. For more details about async programming in MoonBit, see the [documentation](https://mooncakes.io/docs/moonbitlang/async) and [GitHub](https://github.com/moonbitlang/async) repository of `moonbitlang/async`. `Async tests` declared with async test will run in parallel.
  ```mbt
  ///|
  async test "http request" {
    let (response, result) = @http.get("https://www.example.org")
    inspect(response.code, content="200")
    assert_true(result.text().has_prefix("<!doctype html>"))
  }
  ```
- Experimental Feature: `lexmatch` Expression

  Added the `lexmatch` **expression** (experimental feature), which enables pattern matching on `StringView` or `BytesView` using regular expressions.

  The following example matches two to four consecutive `'a'` characters followed by a `'b'`, capturing the consecutive `'a'`s as variable `a`.
  For more detailed usage, refer to [lexer.mbt](https://github.com/moonbitlang/parser/blob/master/lexer/lexer.mbt) in  [moonbitlang/parser](https://github.com/moonbitlang/parser.git) and the  [lexmatch](https://github.com/moonbitlang/moonbit-evolution/pull/15) proposal in  [moonbit-evolution](https://github.com/moonbitlang/moonbit-evolution).

  ```mbt
  lexmatch x with longest {
    (("a{2,4}" as a) "b", _) => Some(a.length())
    _ => None
  }
  ```
- Unified Import Syntax with `using`

  Introduced the `using` **syntax**, which unifies `fnalias`, `traitalias`, and simple typealias. When importing a `type` or `trait`, the corresponding keyword must now be prefixed before the name.

  ```mbt
  using @pkg {
    value,
    CONST,
    type Type,
    trait Trait,
  }
  ```

  In addition, `pub using` can be used to achieve **re-export**, allowing definitions from other packages to be re-exported in the current package.
  In the future, the `fnalias`, `traitalias`, and simple `typealias` syntaxes will be deprecated — the functionality of creating aliases for external definitions will be replaced by `using`, while creating aliases for definitions within the current package will be handled by the `#alias` attribute.
- Methods in a trait now support optional parameters.
  ```mbt
  pub(open) trait Reader {
    async read(Self, buf : FixedArray[Byte], offset? : Int, len? : Int) -> Unit
  }
  ```

  The default value of an optional parameter is determined individually by each `impl`. Different implementations can define their own default values or choose not to provide one at all — in that case, the optional parameter’s type within the `impl` will be `T?`, where `None` indicates that the user did not supply the argument.

- Operator Overloading via `#alias`

  Added support for using `#alias` to overload operators such as `op_get`, providing better readability compared to the `op_xxx` naming convention.
  ```mbt
  // Previously `op_get`
  #alias("_[_]")
  fn[X] Array::get(self : Array[X], index : Int) -> X { ... }

  // Previously `op_set`
  #alias("_[_]=_")
  fn[X] Array::set(self : Array[X], index : Int, elem : X) -> Unit { ... }

  // Previously `op_as_view`
  #alias("_[_:_]")
  fn[X] Array::view(
    self : Array[X],
    start? : Int = 0,
    end? : Int = self.length(),
  ) -> ArrayView[X] { ... }
  ```

  Currently, the following operators are supported. The actual implementation names (e.g., `get`, `set`, `view`) can be freely chosen — simply attach the corresponding `#alias` to enable operator overloading.
  It is recommended to use `#alias` instead of `op_xxx` for method-based operator overloading.
  *(Note: Operators like `+` are overloaded through traits and are not affected by this change.)*

- Removal of Long-Deprecated Syntax and Behaviors

  Several language features that had been deprecated for a long time have now been **officially removed**:

  Previously, methods defined in the form `fn meth(self : T, ..)` were both methods and regular functions, allowing them to be called directly as standalone functions. This behavior had long been deprecated (with compiler warnings) and is now removed.
 The declaration `fn meth(self : T, ..)` is now equivalent to `fn T::meth(self : T, ..)`. In the future, the `self`-form method definition itself may also be deprecated.

  The `direct_use` field in moon.pkg.json has been officially removed and replaced by `using`.

## Toolchain Updates
- **Wasm Toolchain Released** — The Wasm version of the MoonBit toolchain is now available for **x86 Darwin** and **ARM Linux** users. [🔗 Read more](https://www.moonbitlang.com/blog/moonbit-wasm-toolchain)

- **Experimental Build System (RR)** — A new experimental version of the build system, codenamed `RR`, has been introduced. It offers higher performance and better maintainability, and will eventually replace the current internal implementation of `moon`. You can enable it using the environment variable `NEW_MOON=1` or the command-line flag `-Z rupes_recta`. If you encounter any issues, please report them on [GitHub Issues](https://github.com/moonbitlang/moon/issues).

- `moon fmt` **Enhancements** — Now supports formatting of `.mbt.md` files.

- `moon info --no-alias` **Option** — Added a new option to hide type aliases when generating the `pkg.generated.mbti` file.

## Standard Library Updates
- **Improved Hash Security** — To mitigate potential **HashDoS attacks**, hash computation is now **randomized per process**. This change has already been implemented in the JS backend.

- **Immutable** `ArrayView` — `ArrayView` has been changed to an **immutable data structure**, providing a unified slicing interface for `Array`, `FixedArray`, and `ImmutArray`.