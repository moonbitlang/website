# weekly 2024-06-17

## Language Update

- **Supported error handling:**

1) Functions can now specify return types with error handling using the syntax `Int!String`. The following example means the function returns an `Int` under normal conditions, and throws an error of type `String` otherwise.
```moonbit
fn div(x: Int, y: Int) -> Int!String { .. }
```

2) The `raise` keyword is used to interrupt the current control flow and throw an error. For example:
```moonbit
fn div(x: Int, y: Int) -> Int!String {
  if y == 0 { raise "divide by 0" }
  x / y
}
```

3) The expression `try { expr0 } catch { pattern1 => expr1; pattern2 => expr2; .. }` can be used to catch errors thrown in `expr0` and handle them with pattern matching. For example, the following function calls the `div` function and prints the error message if an error is thrown, then returns a default value:
```moonbit
fn div_with_default(x: Int, y: Int, default: Int) -> Int {
  try {
    div(x, y)!
  } catch {
    s => { println(s); default }
  }
}
```

4) Additionally, the suffix operators `!` and `!!` are available for error handling. These operators can only be used on function calls:
`f(x)!` rethrows any error immediately.
`f(x)!!` panics on any error, equivalent to:
```moonbit
try { f(x)! } catch { _ => panic() }
```
Function calls include method calls, infix operators, and pipeline operators, such as:
```moonbit
fn init {
  let _ = x.f()!!
  let _ = (x + y)!!
  let _ = (x |> f)!!
}
```

5) Last, functions that might throw errors but do not use any of the above error handling mechanisms will result in an "unhandled error" error.

- Support `Map` literal syntax.
```moonbit
fn init {
  // Keys must be literals
  let m1 : Map[String, Int] = { "x": 1, "y": 2 }
  let m2 : Map[Int, String] = { 1: "x", 2: "y" }
}
```

## IDE Update

- Fixed a bug where methods from the builtin package would appear twice during autocompletion.

- Fixed a bug where the Byte type was missing from autocompletion options.

## Build System Update

- Added support for internal packages. These packages are placed in a directory named `internal` and can only be imported by packages rooted in the parent directory of `internal`.

    For example, if a package is located at `username/hello/x/internal/a`, its parent directory is `username/hello/x`. Only `username/hello/x` and its subpackages (e.g., `username/hello/x/a`) can import `username/hello/x/internal/a`. However, `username/hello/y` cannot import this package.