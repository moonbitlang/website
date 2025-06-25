# weekly 2024-01-02
## MooBit Update

### 1. Supported recursive newtype

Supported recursive newtype, which allows the implementation of a type-safe Y combinator in MoonBit.

```
type R[X] (R[X]) -> X

fn y[X, Y](f : ((X) -> Y) -> (X) -> Y) -> (X) -> Y {
  fn ff (x: R[(X) -> Y]) -> (X) -> Y {
    fn(a) { f(x.0(x))(a) }
  }
  ff(R::R(fn(x) { fn (a) { f(x.0(x))(a) } }))
}

fn factx(f: ((Int) -> Int)) -> (Int) -> Int {
  fn(n: Int) -> Int {
    if n <= 1 { 1 } else { n * f(n-1)}
  }
}

fn init {
  let fact = y(factx)
  let n = fact(10)
  println(n)
}
```

### 2. Add a new built-in function `sqrt`, used to calculate square roots.

```
fn init {
  // The type of sqrt is Double -> Double
  println(sqrt(4.0)) // 2.0
}
```

### 3. Add a new operator `===` to determine if two values are referentially equal.

```
fn init {
  let x = [1, 3]
  let y = [1, 3]
  let z = x
  if x === y {
    println("x === y")
  } else if x === z {
    println("x === z")
  }
  // Output: x === z
}
```

### 4. method/trait system update:

In the past few weeks, we have made many design adjustments to MoonBit's method/trait system to make it more robust and well-behaved. The current behavior of MoonBit's method system is as follows:

- methods are functions associated with a type. Methods can be defined as follows:

```
fn T::method(...) -> ... { ... }

// for example
type MyInt Int
fn MyInt::default() -> MyInt { MyInt(0) }

enum MyList[X] {
  Nil
  Cons(X, MyList[X])
}

fn MyList::map2[X, Y, R](
  f: (X, Y) -> R,
  xs: MyList[X],
  ys: MyList[Y]
) -> MyList[R] {
  ...
}
```

As a convenient syntax to define methods, when the first parameter of a function is named `self`, MoonBit will automatically define the function as a method for the type of `self`:

```
fn add(self: MyInt, other: MyInt) -> MyInt { ... }
// equivalent to
fn MyInt::add(x: MyInt, y: MyInt) -> MyInt { ... }
```

- Methods are just special functions owned by a type. So when there is no ambiguity, methods can be called with regular function call syntax directly:

```
enum MyList[X] { ... }
fn MyList::length[X](xs: MyList[X]) -> Int {
  ...
}

fn init {
  let xs: MyList[_] = ...
  debug(length(xs)) // called directly
}
```

When there is ambiguity (i.e. there are multiple methods of the same name in scope), methods can still be called explicitly by `T::method(...)`:

```
struct Type1 { ... } derive(Debug)
fn Type1::default() -> Type1 { ... }

struct Type2 { ... } derive(Debug)
fn Type2::default() -> Type2 { ... }

fn init {
  // debug(default()): ambiguity！
  debug(Type1::default()) // ok
  debug(Type2::default()) // ok
}
```

- Whe the type of the first parameter of a method happens to be the owner type of that method, you can call the method conveniently via the dot syntax `x.method(...)` . Calling methods using dot syntax does not require writing out the package name, even when the method comes from a foreign package. MoonBit will automatically find the correct method based on the type of `x`:

```
// a package named @list
pub enum List[X] { ... }
pub fn map[X](self: List[X], f: (X) -> Y) -> List[Y] {
  ...
}

// using @list in another package
fn init {
  let xs: @list.List[_] = ...
  // the following three lines are equivalent
  xs.map(...)
  @list.map(xs, ...) // when there is no ambiguity
  @list.List::map(xs, ...)
}
```

- **_Only the package that defines a type can define methods for that type._** This makes MoonBit's trait system coherent, and prevents third-party packages from modifying the behavior of an existing type.

Behavior change on MoonBit's trait system is as follows:

- Method declarations in trait definition no longer need a `Self::` prefix in all circumstances. Whether the first parameter of a method has type `Self` is no longer significant.

- Types can implement a trait automatically and implicitly using its methods. However, if a type does not implement a trait, or if the corresponding method does not have desired behavior, this type can still be extended (outside its package) by defining special _extension methods:_

```
// implement method [op_equal] of trait [Eq] for type [T]
fn Eq::op_equal(x: T, other: T) -> { ... }
```

These extension methods can **_only_** be used to implement the specified trait. For example, the extension method `Eq::op_equal` above can only be used to implement `Eq`. It cannot be called via `T::op_equal` or `t.op_equal(...)`. When searching for the implementation of a trait, extension methods have a higher priority than ordinary methods.

- **_Only the package of the type or the package of the trait can define extension methods_**. So the implementations provided by some type to implement a trait is always globally unique. This makes MoonBit's trait system coherent, and ensures that third party packages cannot modify behavior of existing program by accident.

The biggest breaking change of the new behavior is: users can no longer define methods for foreign and built-in types. However, the functionality of foreign and built-in types can still be extended by implementing new traits using extension methods.

## Build System Update

### 1. The `import` field in `moon.pkg.json` now includes array representation Each item in the array is either a string or an object `{ "path": ..., "alias": ...}`, for example:

```
{
  "is_main": true,
  "import": [
    { "path": "moonbitlang/import004/lib", "alias": "lib" },
    "moonbitlang/import004/lib2", // Use the default alias: "lib2"
    { "path": "moonbitlang/import004/lib3", "alias": "lib3" },
    { "path": "moonbitlang/import004/lib4", "alias": "" } // Use the default alias: "lib4"
  ]
}
```

### 2. `moon new` now supports creating projects through an interactive method.

- Create an executable project.

```
$ moon new
Enter the path to create the project (. for current directory) > myproject
Enter the create mode (exec or lib) > exec
Enter your username > moonbitlang
Enter the package name > hello
```

The above command is equivalent to:

```
 moon new --path myproject --user moonbitlang --name hello
```

This will create a project named `moonbitlang/hello` in the folder `./myproject`, with the following directory structure:

```
.
├── lib
│   ├── hello.mbt
│   ├── hello_test.mbt
│   └── moon.pkg.json
├── main
│   ├── main.mbt
│   └── moon.pkg.json
└── moon.mod.json
```

- Create a package.

```
$ moon new
Enter the path to create the project (. for current directory) > mylib
Enter the create mode (exec or lib) > lib
Enter your username > moonbitlang
Enter the package name > hello
```

The above command is equivalent to:

```
 moon new --path mylib --lib --user moonbitlang --name hello
```

This will create a package named `moonbitlang/hello` in the folder `./mylib`, with the following directory structure:

```
.
├── lib
│   ├── hello.mbt
│   ├── hello_test.mbt
│   └── moon.pkg.json
├── moon.mod.json
├── moon.pkg.json
└── top.mbt
```
