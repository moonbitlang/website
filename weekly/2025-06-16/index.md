# 2025-06-16

## Language Updates

1. **Error Function Syntax Updated to  `raise`**

- The `!` syntax for representing errors has been replaced with the keyword `raise`. The specific mappings are as follows:

  - ` (..) -> T ! SomeErr` => `(..) -> T raise SomeErr`
   - `(..) -> T !` => `(..) -> T raise`
  - `(..) -> T ? Error` => `(..) -> T raise?` (This is a recently added error polymorphism syntax; it can be ignored if unfamiliar.)
  - `fn f!(..) { .. }` => `fn f(..) raise { .. }`
  - `fn!( ..) { .. } `=> `fn (..) raise { .. }`

  > The above changes can be auto-migrated using code formatting.

2. **Error Type Declaration Syntax Changed**

- The syntax for defining error types, `type! T ..`, has been changed to `suberror T ..`. This change can also be automatically migrated using code formatting.


3. **Deprecation of `f!(..)` and `f?(..)`**

- The `f!(..)` and `f?(..)` syntaxes have been deprecated. Continued use of them will trigger compiler warnings. Code formatting can automatically remove `!` for migration, but `f?(..)` requires manual migration to `try?`. This is because for cases like `f?(g!(..))`, a simple change to `try? f(g(..))` would alter the semantics, causing errors in `g` to also be caught. Special attention is needed during manual migration of `f?(..)`.

4. **Function Type Parameter Syntax Aligned with `impl`**

- Several weeks ago, the position of type parameters in function definitions was moved from `fn f[..](..)` to `fn[..] f(..)` to align with `impl`. Now, the old syntax is deprecated and will trigger compiler warnings. This change can be automatically migrated using code formatting.

5. **Simplified Syntax for `typealias` and `traitalias`**


  - Use `typealias B as A` and `traitalias B as A` instead of `typealias A = B` and `traitalias A = B.`
  Example:

    Old: `typealias Matrix[X] = Array[Array[X]]`

    New: `typealias Array[Array[X]] as Matrix[X]`

    >This change can be auto-migrated.


6. **Multi-parameter `loop` syntax deprecated**

- The multi-parameter `loop` syntax has been deprecated and should be replaced with a `loop` that takes a tuple as its parameter. This change aligns `loop` with `match` more consistently. The MoonBit compiler can optimize away the overhead of tuples in `loop` in release mode, so there is no need to worry about performance impacts.

7. **Trait Method Implementation Now Explicit**

- For traits where "every method has a default implementation," previously all types would automatically implement them. Now, even if all methods of a trait have default implementations, explicit implementation is still required. If no custom implementation is needed, `impl Trait for Type` can be used to indicate "implement Trait for Type using all default methods." `impl Trait for Type` can also serve as documentation or a TODO. MoonBit will automatically check whether `Type` implements `Trait` and report an error if it does not.

8. **Cannot Use Dot Syntax Call Implementation Method for External Types**

- Previously, `impl` for external types could be called within the current package using `.`. However, this feature was not refactoring-safe: upstream additions of methods could alter the behavior of downstream code. Therefore, this behavior has been deprecated. As an alternative, MoonBit now supports locally defining new methods for external types, with syntax identical to regular method definitions. Methods defined for external types have the following characteristics:

  - They cannot be `pub`. This ensures no conflicts arise during cross-package collaboration.
  - If the upstream package (where the type is defined) already has a method with the same name, the compiler will issue a warning.
  - Local methods have the highest priority during method resolution.

  > After this change, the resolution rules for x.f(..) are as follows (in order of priority):
  > 1. Local methods
  > 2. Methods from the package where `x`'s type is defined
  > 3. `impl` from the package where `x`'s type is defined

9. **Auto Insertion of `to_json` for JSON Literals**

- Within JSON literals, the compiler now automatically inserts `ToJson::to_json` calls for non-literal expressions, making JSON literals more convenient to write:

```rust
let x = 42
// Previously
let _ : Json = { "x": x.to_json() }
// Now
let _ : Json = { "x": x }
```

10. **Virtual Package Support for Abstract Types**

- The virtual package feature now supports abstract types. Abstract types can be declared in `.mbti` interfaces, and different implementations can use different concrete types to fulfill the interface's abstract types.

11. **Simplified Syntax for Error Handling**
- For handling errors in simple expressions, `try` can be omitted, and `f(..) catch { .. }` can be written directly.

12. **Reserved Words Warning Mechanism**

- A new set of reserved words has been added. These are not currently keywords but may become keywords in the future. Using these names in code will trigger compiler warnings.


## Upcoming Changes to Be Released Before the MoonBit Beta on June 18

1. **New Arrow Function Syntax `(..) => expr`**

    This syntax simplifies defining single-parameter inline functions. Example:

```rust
test {
  let arr = [ 1, 2, 3 ]
  arr
    .map(x => x + 1) // Parentheses can be omitted for single parameters
    .iter2()
    .each((i, x) => println("\{i}: \{x}"))
}

```

2.  **Matrix Function Syntax Simplified**

    Matrix functions have been deprecated to simplify the syntax. Matrix functions of the form `fn { .. => expr }` can be replaced with arrow functions, while other matrix functions should be replaced with explicit `fn` and `match`.

3.  **Deprecation of `xx._` Syntax in `new type` Definitions**

    Previously, the `xx._` syntax could be used to convert a newtype into its underlying representation. However, this syntax was visually ambiguous with partial application syntax (`_.f(..)`). Therefore, the `xx._` syntax has been deprecated. Instead, the compiler will automatically generate an `.inner()` method for each newtype to replace `._`. This change can be automatically migrated using code formatting.

4.  **Warnings on Ambiguous Precedence**

    For ambiguous or less widely known operator precedence combinations, such as `<<` and `+`, MoonBit will now issue warnings. Adding parentheses manually or via code formatting will resolve the warnings.


5. **Introduction of `letrec` and `and` for Local Mutual Recursion**

    The `letrec` and `and` keywords have been introduced for declaring locally mutually recursive functions, e.g.:

  ```rust
  fn main {
    letrec even = fn (x: Int) { ... } // Anonymous function
    and odd = x => ... // Arrow function
  }

  ```

  * The right-hand side of the equals sign must be a function-like value, such as an anonymous function or arrow function. The previous implicit mutual recursion syntax using fn will be deprecated, though self-recursive functions can still be declared with fn.*

6. **`fnalias` Cannot Be Used to Define Non-Function values**

   The `fnalias` keyword is now restricted to function definitions only. Use `let` to define other types of values.

## **Standard Library Updates**

- Leveraging the new error polymorphism feature, many higher-order functions in the standard library, such as `Array::each`, can now accept callback functions that may raise errors.

## **Toolchain Updates**

- Tests can now be written in the `main` package. `moon test` will run tests in the `main` package, while `moon run` will execute the `main` function.
- The IDE's codelens now supports running tests in documentation.
- `moon test` and `moon check` now include tests in documentation by default.


## MoonBit Beta Launch on June 18 — Developer Updates Transition to Monthly Reports
After extensive refinement and continuous improvement based on community feedback, the MoonBit Beta version will be officially released on June 18, marking the transition to a more stable stage of the language.

Starting from this milestone, the MoonBit biweekly report will shift to a monthly cadence. Please stay tuned to this column for future updates.

We also welcome community feedback and discussion — feel free to share your thoughts and suggestions with us!