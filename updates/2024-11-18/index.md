# 2024-11-18

## Language Updates

- Trait now has abstract and pub(readonly) visibility.

1. An abstract/readonly trait behaves the same as a fully public trait within the current package.
2. Outside the current package, you can't call methods in an abstract trait directly, and you can't write new implementations of an abstract trait.
3. A pub(readonly) trait cannot be implemented outside the current package, but methods can be called directly.
4. The default visibility for a trait has been changed from **private** to **abstract**. To explicitly define a private trait, use the `priv trait` keyword.
5. When implementing an abstract or readonly trait, at least one method must be implemented using the `impl Trait for Type` syntax to allow external usage of that implementation.

Example of abstract trait：

```moonbit
trait Number {
  add(Self, Self) -> Self
}

pub fn add[N : Number](x : N, y : N) -> N {
  Number::add(x, y)
}

impl Number for Int with add(x, y) { x + y }
impl Number for Double with add(x, y) { x + y}
```

Using the `moon info` command to generate a `.mbti` interface file, the exported interface is as follows:

```moonbit
trait Number
impl Number for Int
impl Number for Double

fn add[N : Number](N, N) -> N
```

Externally, the `add` function can only be called for `Int` and `Double`. The compiler ensures that the `Number` trait can only be implemented for `Int` and `Double`.

- Visibility Adjustments for Types and Traits

To encourage the use of readonly types/traits to provide more robust APIs, we plan to change the default visibility for type and trait definitions to **readonly** in the future.

To declare fully public visibility:

1. **Types:** Use `pub(all) struct/enum/type`.
2. **Traits:** Use `pub(open) trait` to allow external implementations.

**Currently:**

1. `pub` still means fully public visibility, but the compiler will issue a **warning** recommending migration to `pub(all)` or `pub(open)`.
2. The `moon fmt` formatter will automatically migrate existing `pub` to `pub(all)` or `pub(open)`.

- New Private Fields in `struct` Types:

Public structs can now have private fields by adding the `priv` keyword before specific fields.

1. External Visibility: Private fields are completely hidden from the outside world. They cannot be read or modified externally.
2. If a `struct` contains private fields, it cannot be directly constructed using literals from outside the module. ****However, the struct update syntax (`{ ..old_struct, new_field: ... }`) can be used to update public fields while maintaining the private field's state.

- New suffix-style label argument syntax

The new syntax is equivalent to moving `~` after the identifier, and the `~` can be omitted in the case of forwarded options of the form `~label?`

```moonbit
enum Foo {
  Bar(label~ : Int, Bool)
}
fn f(a~ : Int, b~ : Int = 0, c? : Int) -> Unit {...}
fn main {
  f(a=1, b=2, c=3)
  f(a=1, c?=Some(3))// b Default values are declared and can be omitted. c Forwarding option Syntax as usual
  let a = 1
  let c = Some(3)
  f(a~, c?) // Like at the declaration, punning takes the form of a suffix
}
```

The old syntax is deprecated:

```moonbit
enum Foo {
  //deprecated
  Bar(~label : Int, Bool)
}
//deprecated
fn f(~a : Int, ~b : Int = 0, ~c? : Int) -> Unit {}
fn main {
  let a = 1
  let c = Some(3)
  f(~a, ~c?) //deprecated
}
```

You can migrate code to the new syntax with `moon fmt`.

- Reserved Keywords

A series of reserved keywords have been added for future use by the compiler. Currently:

1. Using these reserved keywords will produce a **warning**, advising users to migrate.
2. These keywords may become language keywords in future versions.

Reserved keywords are:

```plain text
module
move
ref
static
super
unsafe
use
where
async
await
dyn
abstract
do
override
typeof
virtual
yield
local
method
alias
```

- Planned Changes to `Bytes` Type

The standard library's `Bytes` type will be changed to an **immutable type**. Therefore, functions that modify `Bytes` will be marked as deprecated.

Alternatives for mutable byte operations:

1. `Array[Byte]`
2. `FixedArray[Byte]`
3. `Buffer`

- Rename of `@test.is`

The `@test.is` function has been renamed to `@test.same_object`. `@test.is` is now deprecated. The `is` keyword will become a reserved word in the future.

## IDE Updates

- Fixed an issue where `moon fmt --block-style` didn't handle document comments like `////| comment` correctly.

- IDE adapted suffix label argument syntax to support gotoref and rename.

- Support code highlighting in documentation.

- Fixed an issue in LSP with `@` autocompletion when there are internal packages.

## Build system update

- The `-verbose` option now outputs the currently running command.

## MoonBit ProtoBuf

- Open source the [protoc-gen-mbt library](https://github.com/moonbit-community/protoc-gen-mbt).
