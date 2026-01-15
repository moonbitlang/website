# 2025-04-21

## Language Updates

- **Async function syntax**: The call syntax for async functions has changed to match the `error` style: `f!(...)`. The old `f!!(...)` syntax will now trigger a warning.

- **Operator overloading migration to traits**: Operator overloading is moving from method-based to `trait`-based. Going forward, to overload an operator, you must `impl` the corresponding `trait` from `@moonbitlang/core/builtin`. You can find the list of operator-related traits in the language docs and `operators.mbt`.

  Migration details:
  - Old method-based operator overloading still works, but will raise a compiler warning.
  - Migrate by replacing `op_xxx` methods with the appropriate `impl` of the trait.
    - Operator traits enforce stricter type signatures—for example, the `-` operator requires the return type to be the same as the input type. If an operator doesn’t match the expected signature, it must be rewritten as a regular method instead of using operator syntax.
  - If a trait defines `op_xxx` methods, they can be removed and replaced by adding the operator trait to the `super trait` list. For example:

    ```moonbit
    // Old version
    trait Number {
      from_int(Int) -> Self
      op_add(Self, Self) -> Self
      op_sub(Self, Self) -> Self
    }

    // Migrated version
    trait Number : Add + Sub {
      from_int(Int) -> Self
    }
    ```

- **New `= _` syntax for traits**: You can now mark whether a method in a `trait` has a default implementation using `= _`:

  ```moonbit
  trait Hash {
    hash_combine(Self, Hasher) -> Unit
    hash(Self) -> Int = _ // indicates that `hash` has a default implementation
  }
  ```

  a. If a method is marked with `= _`, a matching default `impl Trait with some_method(..)` must exist. If a method has a default `impl` but is *not* marked with  `= _`, the compiler will warn you.

  b. This is mainly for readability: now you can see from the `trait` definition which methods have defaults. Why not include the default code directly in the `trait`? To keep the trait definition short and focused on method signatures.

- **Implicit conversion from `String` to `@string.View`** is now supported. Also, slicing with `[:]` now returns a full view again. General slicing like `[i:j]` is still under design.

  ```moonbit
  fn f(v : @string.View) -> Unit {
    ignore(v)
  }

  fn main {
    f("hello")
    f("world"[:])
  }
  ```

- **Pattern matching on `@string.View`/`@bytes.View`** now supports directly matching against string/byte literals:

  ```moonbit
  test {
    let s = "String"
    inspect!(s.view(end_offset=3) is "Str", content="true")
    let s : Bytes = "String"
    inspect!(s[:3] is "Str", content="true")
  }
  ```

- **[Breaking Change] Updates to the `@string` core package**:
  - Many APIs now use `@string.View` instead of `String` for parameters.
  - Some return types also changed from `String` to `View`.

  Notable changes:

  | Old Signature | New Signature |
  | ------------- | ------------- |
  | `self.replace(old~: String, new~: String) -> String` | `self.replace(old~: View, new~: View) -> String` |
  | `self.trim(charset: String) -> String` | `self.trim(charset: View) -> View` |
  | `self.split(substr: String) -> Iter[String]` | `self.split(substr: View) -> Iter[View]` |
  | `self.index_of(substr: String, from~: Int) -> Int` | `self.find(substr: View) -> Option[Int]` |
  | `self.last_index_of(substr: String, from~: Int) -> Int` | `self.rev_find(substr: View) -> Option[Int]` |
  | `self.starts_with(substr: String) -> Bool` | `self.has_prefix(substr: View) -> Bool` |
  | `self.ends_with(substr: String) -> Bool` | `self.has_suffix(substr: View) -> Bool` |

- **Core `Json` type will become read-only**: In the future, enum constructors for `Json` will no longer be available. Instead, helper functions are provided as replacements:

  ```moonbit
  test {
    let num = Json::number(3.14)
    let str = Json::string("Hello")
    let obj = Json::object({ "hello": num, "world": str })
  }
  ```

## Toolchain Updates

- IDE drops support for `moonbit: true` front matter in Markdown:
  - Now, only files with the `.mbt.md` extension will be treated as MoonBit Markdown files in the IDE.

- IDE supports setting debug breakpoints in `.mbt.md` directly:
  - You no longer need to enable `Debug: Allow Breakpoint Everywhere` in VSCode settings.

- New `scripts` field in `moon.mod.json` for build scripts:
  - Currently supports a `postadd` script: if a module contains a `postadd` field, it will be automatically executed after `moon add`.
    - To skip execution, set the `MOON_IGNORE_POSTADD` environment variable.

  Example:

  ```json
  {
    "scripts": {
      "postadd": "python3 build.py"
    }
  }
  ```

- Improvements to `.mbt.md` Markdown support in the `moon` CLI:
  - `moon check` now includes Markdown checking automatically.
  - `moon test` now includes Markdown tests by default. (The `--md` flag will be removed in the future.)
