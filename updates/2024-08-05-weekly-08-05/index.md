# weekly 2024-08-05

## Language Update

- **JSON Literal Support for Array Spread**:

```bash
let xs: Array[@json.JsonValue] = [1, 2, 3, 4]
let _: @json.JsonValue = [1, ..xs]
```

- **Type Alias Support**: Added support for type aliases, primarily for gradual code refactoring and migration rather than just giving types short names. For example, if you need to rename `@stack.Stack` to `@stack.T`, doing it all at once would require modifying many places that use `@stack.Stack`, which could easily cause conflicts in large projects. If a third-party package uses `@stack.Stack`, it would result in a breaking change. With type alias, you can leave an alias for `@stack.Stack` after renaming it, so existing code won't break:

```kotlin
/// @alert deprecated "Use `T` instead"
pub typealias Stack[X] = T[X]
```

  Then, you can gradually migrate the usage of `@stack.Stack`, giving third-party users time to adapt to the new name. Once the migration is complete, you can remove the type alias. Besides type renaming, `typealias` can also be used for migrating type definitions between packages, etc.

- **Support for Defining New Methods on Trait Objects**:

```moonbit
trait Logger {
  write_string(Self, String) -> Unit
}

trait CanLog {
  output(Self, Logger) -> Unit
}

// Define a new method `write_object` for the trait object type `Logger`
fn write_object[Obj : CanLog](self : Logger, obj : Obj) -> Unit {
  obj.output(self)
}

impl[K : CanLog, V : CanLog] CanLog for Map[K, V] with output(self, logger) {
  logger.write_string("Map::of([")
  self.each(fn (k, v) {
    // Use `Logger::write_object` method for simplification
    logger
    ..write_string("(")
    ..write_object(k)
    ..write_string(", ")
    ..write_object(v)
    .write_string(")")
  })
  logger.write_string("])")
}
```

- **[Breaking Change] Error Type Constraint**: In the return type `T!E` that may return errors, the error type `E` must be a concrete error type declared with the `type!` keyword. Currently, two declaration methods are supported:

```moonbit
type! E1 Int   // error type E1 has one constructor E1 with an Integer payload
type! E2       // error type E2 has one constructor E2 with no payload
```

  In function declarations, you can use these concrete error types for annotations and return specific errors using `raise`, for example:

```moonbit
fn f1() -> Unit!E1 { raise E1(-1) }
fn f2() -> Unit!E2 { raise E2 }
```

- **Default Error Type**: Added a built-in Error type as the default error type. Functions can use the following equivalent declarations to indicate they may return an Error type error:

```moonbit
fn f1!() -> Unit { .. }
fn f2() -> Unit! { .. }
fn f3() -> Unit!Error { .. }
```

  For anonymous functions and matrix functions, you can use `fn!` to indicate the function may return an Error type error, for example:

```moonbit
fn apply(f: (Int) -> Int!, x: Int) -> Int! { f!(x) }

fn main {
  try apply!(fn! { x => .. }) { _ => println("err") }    // matrix function
  try apply!(fn! (x) => { .. }) { _ => println("err") }  // anonymous function
}
```

  Errors returned using `raise` and `f!(x)` can be cast up to the Error type, for example:

```moonbit
type! E1 Int
type! E2
fn g1(f1: () -> Unit!E1) -> Unit!Error {
  f1!()      // error of type E1 is cast to Error
  raise E2   // error of type E2 is cast to Error
}
```

  Error types can be pattern matched. When the matched type is Error, pattern matching completeness checks require adding a branch using the `_` pattern, whereas this is not needed for specific error types, for example:

```moonbit
type! E1 Int
fn f1() -> Unit!E1 { .. }
fn f2() -> Unit!Error { .. }
fn main {
  try f1!() { E1(errno) => println(errno) }  // this error handling is complete
  try f2!() {
    E1(errno) => println(errno)
    _ => println("unknown error")
  }
}
```

  In addition, if different kinds of error types are used in a try expression, the entire try expression will be handled as returning the Error type, for example:

```moonbit
type! E1 Int
type! E2
fn f1() -> Unit!E1 { .. }
fn f2() -> Unit!E2 { .. }
fn main {
  try {
    f1!()
    f2!()
  } catch {
    E1(errno) => println(errno)
    E2 => println("E2")
    _ => println("unknown error")   // currently needed to ensure completeness
  }
}
```

  We will improve this in future versions to make completeness checks more precise.

- **Error Bound**: Added Error bound to constrain generic parameters in generic functions, allowing them to appear as error types in function signatures, for example:

```moonbit
fn unwrap_or_error[T, E: Error](r: Result[T, E]) -> T!E {
  match r {
    Ok(v) => v
    Err(e) => raise e
  }
}
```

## Core Update

- **Bigint**: Changed `Bigint` to a built-in type.

## Build System Update

- **Debug Single .mbt File**: Added support for debugging a single .mbt file.

- **Parallel Package-Level Testing**: `moon test` now supports parallel testing at the package level.

- **`root-dir` Field in `moon.mod.json`**: Added `root-dir` field to specify the source directory of the module. Only supports specifying a single-level folder, not multi-level folders. `moon new` will default to setting `root-dir` to `src`. The default directory structure for exec and lib modes is now:

```bash
exec
├── LICENSE
├── README.md
├── moon.mod.json
└── src
    ├── lib
    │   ├── hello.mbt
    │   ├── hello_test.mbt
    │   └── moon.pkg.json
    └── main
        ├── main.mbt
        └── moon.pkg.json

lib
├── LICENSE
├── README.md
├── moon.mod.json
└── src
    ├── lib
    │   ├── hello.mbt
    │   ├── hello_test.mbt
    │   └── moon.pkg.json
    ├── moon.pkg.json
    └── top.mbt
```

## Toolchain Update

- **MoonBit AI**: Now supports generating documentation.

![ai file](<ai file.gif>)
