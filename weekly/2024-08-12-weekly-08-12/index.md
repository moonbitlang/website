# weekly 2024-08-12

## Language Update

- **Added support for `for .. in` loops based on `Iter` and `Iter2` types:**

  ```moonbit
  fn main {
    for x in [1, 2, 3] {
      println(x)
    }
    for k, v in {"x": 1, "y": 2} {
      println("\{k} => \{v}")
    }
  }
  ```

  You can bind one or two variables between `for` and `in` to iterate over elements in `Iter`. A single-variable loop `for x in expr1` iterates over `expr1.iter() : Iter[_]`, while a two-variable loop `for x, y in expr2` iterates over `expr2.iter2() : Iter2[_, _]`. Underscores can be used to ignore elements, but pattern matching is not allowed between `for` and `in`.

  The loop body in `for .. in` can use control flow statements like `return`/`break`/`raise`:

  ```moonbit
  test "for/in" {
    // `iter2` for arrays iterates over index + elements
    for i, x in [1, 2, 3] {
      assert_eq!(i + 1, x)
    }
  }
  ```

-**Introduced new string interpolation syntax `\{}`, deprecating the old `\()`.** This allows embedding more complex expressions directly into strings. Future updates will relax syntax restrictions within string interpolations, such as supporting `\{1 + 2}` and `\{x.f(y)}`.

  ```moonbit
  "hello, \(name)!" // warning: deprecated
  "hello, \{name}!" // new syntax
  ```

- **Expanded numerical handling**: Added a new built-in `BigInt` type for managing large values beyond the range of regular integers.

```moonbit
// BigInt literals end with N
let num = 100000000N

// Like Int literals, underscores are allowed between digits. Hexadecimal, octal, and binary formats are also supported.
let n2 = 0xFFFFFFFFN
let n3 = 0o77777777N
let n4 = 0b1111111100000000N
let n5 = 1234_4567_91011N

// If the type is explicitly BigInt, the N suffix is not required
let n6 : BigInt = 1000000000000000000

// Pattern matching also supports BigInt
match 10N {
  1N => println(1)
  10N => println(10)
  100 => println(100)
}
```

- **Added support for declaring error types using enums.** For example, errors in the Json package can be declared as follows:

  ```moonbit
  pub type! ParseError {
    InvalidChar(Position, Char)
    InvalidEof
    InvalidNumber(Position, String)
    InvalidIdentEscape(Position)
  } derive(Eq)
  ```

  You can also use labeled and mutable arguments within error types using enums, the same as how you would use them in regular enum types.

```moonbit
type! Error1 {
  A
  B(Int, ~x: String)
  C(mut ~x: String, Char, ~y: Bool)
} derive(Show)

fn f() -> Unit!Error1 {
  raise Error1::C('x', x="error2", y=false)
}

fn g() -> Unit!Error1 {
  try f!() {
    Error1::C(_) as c => {
      c.x = "Rethrow Error2::C"
      raise c
    }
    e => raise e
  }
}

fn main {
  println(g?()) // Err(C(x="Rethrow Error2::C", 'x', y=false))
}
```

- **Introduced `catch!` syntax to rethrow errors that are not handled within an error handler.** By using `catch!`, you can more easily manage and propagate errors through your code, simplifying the process of error handling. For example, the function `g` above can be rewritten as:

```moonbit
fn g() -> Unit!Error1 {
  try f!() catch! {
    Error1::C(_) as c => {
      c.x = "Rethrow Error2::C"
      raise c
    }
  }
}
```

- **The generated JavaScript code no longer relies on the  `TextDecoder` API.** If Node.js support for `TextDecoder` improves in the future, we might consider adding it back.

## IDE Update

- Fixed an issue where the source code in the core library couldn't load in web-based VSCode plugin while debugging. Debugging features in [MoonBit IDE](https://try.moonbitlang.com) are now functional.

- **MoonBit IDE now supports auto-completion for constructors in pattern matching based on type:**

```moonbit
match (x : Option[Int]) {

// ^^^^ Auto-completes `None` and `Some`
}
```

## Core Update

- **Added a new `Iter2` type for iterating over collections with two elements**, like Map, or iterating over arrays with an index:

```moonbit
fn main {
  let map = {"x": 1, "y": 2}
  map.iter2().each(fn (k, v) {
    println("\{k} => \{v}")
  })
}
```

  Compared to `Iter[(X, Y)]`, `Iter2[X, Y]` offers better performance and native support for `for .. in` loops.

- **Moved `@json.JsonValue` to the `@builtin` package and renamed it to `Json`.** `@json.JsonValue` is now an alias for `Json`, so this change is backward compatible.

- **Added a `ToJson` interface in `@builtin`** to represent types that can be converted to `Json`.

## Build System Update

- **Added `-C/--directory` commands to `moon check|build|test`**, equivalent to `--source-dir`, to specify the root directory of a MoonBit project, i.e., where `moon.mod.json` is located.

- **Updated the `root-dir` in `moon.mod.json` to `source`.** This field specifies the source directory for modules, and the value of the `source` field can be a multi-level directory but must be a subdirectory of the directory containing `moon.mod.json`, e.g., `"source": "a/b/c"`.

  This field is introduced because package names in MoonBit modules are related to file paths. For example, if the current module name is `moonbitlang/example` and a package is located at `lib/moon.pkg.json`, you would need to import the package using its full name `moonbitlang/example/lib`. Sometimes, to better organize the project structure, we may want to place the source code in the `src` directory, such as `src/lib/moon.pkg.json`. In this case, you would need to use `moonbitlang/example/src/lib` to import the package. However, generally, we do not want `src` to appear in the package path, so you can specify `"source": "src"` to ignore this directory level and still import the package as `moonbitlang/example/lib`.

## Toolchain Update

- **MoonBit AI supported generating code explanations**: In MoonBit IDE, click the MoonBit logo and select `/explain` to get code explanations which will appear on the right side. Don't forget to click 👍 or 👎 to give us your feedback.

![ai explain](./ai%20explain.gif)
