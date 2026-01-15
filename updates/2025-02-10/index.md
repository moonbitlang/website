import FillCase from "./fill_case.webm"
import FillInMatch from "./fill_in_match.webm"

# 2025-02-10

## Language Updates

### New `is` Expression

1. The syntax for this expression is `expr is pat`. The expression is a `Bool` type and evaluates to `true` when `expr` matches the pattern `pat`. For example:

```moonbit
fn use_is_expr(x: Int?) -> Unit {
  if x is Some(i) && i >= 10 { ... }
}
```

2. The pattern can introduce new binders, which can be used in the following cases:

- In `e1 && e2`, if `e1` is an `is` expression, the binders introduced by the pattern can be used in `e2`.
- In `if e1 && e2 && ... { if_branch } else { ... }`, binders introduced by `is` expressions in the `&&`-chained conditions like `e1` & `e2` can be used in the `if_branch`.

### String Construction and Pattern Matching

1. New support for constructing strings using array spread syntax, for example:

```moonbit
fn string_spread() -> Unit {
  let s = "hello🤣😂😍"
  let sv = s[1:6]
  let str : String = ['x', ..s, ..sv, '😭']
  println(str) // xhello🤣😂😍ello🤣😭
}
```

In an array spread, individual elements are `Char` values. You can use `..` to insert a `String` or a `@string.View` segment. This syntax is equivalent to using `StringBuilder` to construct a string.

2. Support for pattern matching on strings using array patterns, which can be mixed with array literal patterns, for example:

```moonbit
fn match_str(s: String) -> Unit {
  match s {
    "hello" => ... // string literal pattern
    [ 'a' ..= 'z', .. ] => ... // array pattern
    [ .., '😭' ] => ... // array pattern with unicode
    _ => ...
  }
}
```

### New Compiler Warnings

- The compiler now warns about unused `guard` statements and missing cases in `guard let ... else ...`.

```moonbit
fn main {
  guard let (a, b) = (1, 2)
  ^^^^^^^^^ ----- useless guard let
  println(a + b)
}
```

### `moonfmt` Fixes

- Fixed formatting errors related to `async` code in `moonfmt`.
- Adjusted insertion rules for `///|` markers.

## Package Updates

- [`moonbitlang/x/sys`](https://github.com/moonbitlang/x/tree/main/sys) now supports the native backend and fixes inconsistencies across different operating systems.

- The [`fs` package](https://github.com/moonbitlang/x/tree/main/fs) in `moonbitlang/x` has been updated with improved error handling.

- String-related operations are being reorganized. The `string` package will provide more Unicode-safe APIs while deprecating some APIs that expose UTF-16 implementation details. During this transition, `string` methods may become unstable. It is recommended to use iter methods or pattern matching to access string elements.

- Refactored `ArrayView/StringView/BytesView` types by moving them from the `@builtin` package to their respective type-related packages. Their names have been updated accordingly to `@array.View/@string.View/@bytes.View`.

## IDE Updates

- Added code action support for filling in missing cases in pattern matching.

  <video autoPlay loop muted playsInline src={FillInMatch} style={{width: '100%'}}></video>

- Enabled inline autocompletion for all cases in empty pattern matches.

  <video autoPlay loop muted playsInline src={FillCase} style={{width: '100%'}}></video>

- Fixed a bug in trait method "Go to Reference".

- Fixed missing autocompletion for variables introduced in `guard let ... else ...` and improved pattern completion in `else` branches.

## Build System Updates

- Fixed a bug in `moon test` where panic tests were being skipped on the native backend.

## Documentation Updates

- Added an [Error Code Index](https://docs.moonbitlang.com/en/latest/language/error_codes/index.html) to the MoonBit documentation. Many entries are still incomplete, and we welcome contributions! You can contribute error codes by referring to [this issue](https://github.com/moonbitlang/moonbit-docs/issues/467).

- [MoonBit Language Tour](https://tour.moonbitlang.com/zh) now supports Chinese.
