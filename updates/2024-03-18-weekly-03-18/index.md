# weekly 2024-03-18
MoonBit is a Rust-like language (with GC support) and toolchain optimized for WebAssembly experience. This is our recent update:

## Language Update

### 1. Experimental support for default method in trait

```
trait MyShow {
  repr(Self) -> String
  str (Self) -> String // it has a default implementation
}

impl MyShow::str(self : Self) -> String {
  // default implementation of str
  self.repr()
}

type MyInt Int
fn repr(self:MyInt) -> String {
  self.0.to_string()
}
// Now MyInt implements MyShow now
```

### 2. The type parameters of type definitions can be `_`, which can be used to define phantom types to restrict some logically illegal operations in the program. For example, we want to prevent adding lengths of different units together:

```
type Length[_] Int

type Kilometer
type Mile

fn add[T](x: Length[T], y:Length[T]) -> Length[T] {
  Length::Length(x.0 + y.0)
}

let d_km: Length[Kilometer] = Length(10)
let d_mile: Length[Mile] = Length(16)
```

At this point, lengths with different units cannot be directly added:

```moonbit
fn init {
  add(d_km, d_mile) |> ignore
  //        ^~~~~~ Error: Expr Type Mismatch
}
```

However, lengths with the same units can be added:

```
fn init {
  add(d_km,d_km) |> ignore
  // OK
}
```

### 3. Now, a top-level function without a marked return value is an error.

```
fn print_hello() {
// ^~~~~~~~~~~ Error:
// Missing type annotation for the return value.
  println("Hello!")
}
```

### 4. Added the bitwise NOT operator.

```
fn main {
  println((1).lnot())
}
```

Output:

```
-2
```

### 5. Improved the output of `List::to_string/debug_write`.

```moonbit
fn main {
let l = List::Cons(1, Cons(2, Cons(3, Nil)))
println(l)
}
```

Output:

```moonbit
List::[1, 2, 3]
```

### 6. Added the `Byte` type.

The byte literals are prefixed by `b`. The following snippet demonstrates its usage:

```moonbit
fn init {
let b1 = b'a'
println(b1.to_int())
let b2 = b'\xff'
println(b2.to_int())
}
```

More utility methods on `Byte` type are around the corner.

## IDE Update

### 1. Added support for autocompletion of moonbitlang/core.

### 2. Formatting Update：

a. Adjust empty structs, enums, and traits to avoid blank lines.

Before：

```moonbit
struct A {

}
```

After：

```moonbit
struct A {}
```

b. Fixed incorrect indentation for `continue`
c. Fixed issues with semicolons appearing after formatting multiline statements

## Build System Update

### 1. Added the `test_import` field to `moon.mod.json`, which contains dependencies that are only used during testing.

### 2. Optimized the output of `moon test`; by default, it now only outputs information for failed test cases. Use the `moon test -v` command for complete output.
