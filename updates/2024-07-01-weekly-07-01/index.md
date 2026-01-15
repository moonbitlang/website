# weekly 2024-07-01

## Language Update

- Enabled simplifying the type prefix for enum constructor:
When there is no ambiguity, you can omit the type prefix for enum constructors. For example, you can now write `Some(42)` instead of `Option::Some(42)`. If there are two types `T1` and `T2` that both define a constructor `C`, you need to specify `T1::C` or `T2::C` by the type or type prefix in the context while using, otherwise the compiler will throw an error.

- New `UInt64` built-in type:
Added a built-in `UInt64` type that supports addition, subtraction, multiplication, division, modulus, and conversion between `UInt64` and `Int64`.
```moonbit
fn main {
  let a = 0UL
  let b : UInt64 = 1UL
  println(a - b) //18446744073709551615
}
```

- Support for error handling with `!!` suffix:
The semantics of the `!!` suffix have been modified to capture potential errors in function calls and return a `Result` type.
```moonbit
fn f() -> Int!String { .. }
fn main {
  let res = f()!! // res: Result[Int, String]
  println(res)
}
```

- `moon test` now supports using error types to represent test failures. For example:
```moonbit
fn eq[T : Debug + Eq](a : T, b : T, ~loc : SourceLoc = _) -> Unit!String {
  if a != b {
    let a = debug_string(a)
    let b = debug_string(b)
    raise ("FAILED: \(loc) `\(a) == \(b)`")
  }
}

test "test_eq" {
  eq(1+2, 3)!
}
```

- The standard library now retains only `println` for I/O operations. Other operations will be provided in the `io` package.

## Core Update

- Unified the function style for creating container objects, like `T::new()`/`T::make()`, and removed `T::with_capacity`.

- Renamed `iter` and `iteri` to `each` and `eachi`, and `iter_rev` and `iter_revi` to `each_rev` and `eachi_rev`.

- Renamed `as_iter` to `iter`.

## Build System Update

- The build system will be open source this week.

## Toolchain Update

- Support for out-of-box debugging for better tooling experience. Users can now run `moon run --target js --debug` in the JavaScript Debug Terminal for debugging.

- `moon info` and coverage tools now accommodate error types and error handling.