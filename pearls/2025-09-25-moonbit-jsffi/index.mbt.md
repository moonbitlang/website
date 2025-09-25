---
moonbit:
  backend: js
description: 'Interacting with JavaScript in MoonBit: A First Look'
slug: moonbit-jsffi
image: cover.png
---

# Interacting with JavaScript in MoonBit: A First Look

![](./cover.png)

---

## Introduction

In today's software world, no programming language ecosystem can be an isolated island.
As an emerging general-purpose language, MoonBit's success in the vast technological landscape hinges on its seamless integration with existing ecosystems.

MoonBit provides multiple compilation backends, including JavaScript, which opens the door to the vast JavaScript ecosystem.
This integration capability greatly expands MoonBit's application scenarios for both front-end browser development and Node.js applications. It allows developers to leverage the type safety and high performance of MoonBit while reusing a wide range of existing JavaScript libraries.

In this article, using Node.js as our example, we'll explore MoonBit's JavaScript FFI step-by-step. We'll cover various topics from basic function calls to complex type and error handling, demonstrating how to build an elegant bridge between the MoonBit and JavaScript worlds.

## Prerequisites

Before we begin, let's configure our project. If you don't have an existing project, you can use the `moon new` tool to create a new MoonBit project.

To let the MoonBit toolchain know that our target platform is JavaScript, we need to add the following content to the `moon.mod.json` file in the project's root directory:

```json
{
  "preferred-target": "js"
}
```

This configuration tells the compiler to use the JavaScript backend by default when executing commands like `moon build` or `moon check`.
Of course, if you want to specify it temporarily on the command line, you can achieve the same effect with the `--target=js` option.

## Building the Project

After completing the above configuration, simply run the familiar build command in the project's root directory:

```console
> moon build
```

After the command executes successfully, since our project includes an executable entry by default, you can find the build artifacts in the `target/js/debug/build/` directory. MoonBit conveniently generates three files for us:

- `.js` file: The compiled JavaScript source code.
- `.js.map` file: A Source Map file for debugging.
- `.d.ts` file: A TypeScript declaration file, which is convenient for integration into TypeScript projects.

## First JavaScript API Call

MoonBit's FFI design is principled and consistent. Similar to calling into C or other languages, we define an external function through a declaration with the `extern` keyword:

```mbt
extern "js" fn consoleLog(msg : String) -> Unit = "(msg) => console.log(msg)"
```

This line of code is the core of enabling our FFI call. Let's break it down:

- `extern "js"`: Declares that this is an external function pointing to the JavaScript environment.
- `fn consoleLog(msg : String) -> Unit`: This is the function's type signature in MoonBit. It accepts a parameter of type `String` and returns a unit value (`Unit`).
- `"(msg) => console.log(msg)"`: The string literal on the right side of the equals sign is the essence of this declaration, containing the native JavaScript function to be executed.

  Here, we use a concise arrow function.
  The MoonBit compiler will embed this code as is into the final generated `.js` file, enabling the call from MoonBit to JavaScript.

  > **Tip**
  > If your JavaScript code snippet is relatively complex, you can use the `#|` syntax to define multi-line strings to improve readability.

Once this FFI declaration is ready, we can call `consoleLog` in our MoonBit code just like a normal function:

```mbt
test "hello" {
  consoleLog("Hello from JavaScript!")
}
```

Run `moon test`, and you will see the message printed by JavaScript's `console.log` in the console. Our first bridge is successfully built!

## Interfacing with JavaScript Types

Establishing the call flow is just the first step. The real challenge lies in handling type differences between the two languages.
MoonBit is a statically typed language, while JavaScript is dynamically typed. Establishing a safe and reliable type mapping between them is a key consideration in FFI design.

Below, we'll cover how to interface with different JavaScript types in MoonBit, starting from the easiest cases.

### JavaScript Types Requiring No Conversion

The simplest case involves types in MoonBit whose underlying compiled representation in JavaScript corresponds directly to a native JavaScript type. In this case, we can pass them directly without any conversion.

The common "zero-cost" interface types are shown below:

| MoonBit Type                     | Corresponding JavaScript Type |
| -------------------------------- | ----------------------------- |
| `String`                         | `string`                      |
| `Bool`                           | `boolean`                     |
| `Int`, `UInt`, `Float`, `Double` | `number`                      |
| `BigInt`                         | `bigint`                      |
| `Bytes`                          | `Uint8Array`                  |
| `Array[T]`                       | `Array<T>`                    |
| Function Type                    | `Function`                    |

Based on these mappings, we can bind many simple JavaScript functions.
In fact, in the previous example of binding the `console.log` function, we have already used the correspondence between the `String` type in MoonBit and the `string` type in JavaScript.

> **Note: Maintaining the Internal Invariants of MoonBit Types**
>
> A crucial detail is that all of MoonBit's standard numeric types (`Int`, `Float`, etc.) map to the `number` type in JavaScript, i.e., IEEE 754 double-precision floating-point numbers.
> This means that when an integer value crosses the FFI boundary into JavaScript, its behavior will follow floating-point semantics, which may lead to unexpected results from MoonBit's perspective, such as differences in integer overflow behavior:
>
> ```mbt
> extern "js" fn incr(x : Int) -> Int = "(x) => x + 1"
>
> test "incr" {
>   // In MoonBit, @int.max_value + 1 will overflow and wrap around
>   inspect(@int.max_value + 1, content="-2147483648")
>   // In JavaScript, it is treated as a floating-point number and does not overflow
>   inspect(incr(@int.max_value), content="2147483648") // ???
> }
> ```
>
> This is essentially illegal because, according to the internal invariant of the `Int` type in MoonBit, its value cannot be `2147483648` (which exceeds the maximum value allowed by the type).
> This may cause unexpected behavior in other MoonBit code downstream that relies on this point.
> Similar issues may arise when handling other data types across the FFI boundary, so please be sure to pay attention to this when writing related logic.

### External JavaScript Types

Of course, the JavaScript world is much richer than these basic types.
We will quickly encounter `undefined`, `null`, `symbol`, and various complex host objects, which have no direct counterparts in MoonBit.

For this situation, MoonBit provides the `#external` annotation.
This annotation acts as a contract, telling the compiler:
"Please trust me, this type actually exists in the external world (JavaScript).
You don't need to care about its internal structure, just treat it as an opaque handle."

For example, we can define a type that represents JavaScript's `undefined` like this:

```mbt skip
#external
type Undefined

extern "js" fn Undefined::new() -> Self = "() => undefined"
```

However, a standalone `Undefined` type isn't very useful, as `undefined` typically appears as part of a union type, like `string | undefined`.

A more practical approach is to create an `Optional[T]` type that precisely maps to `T | undefined` in JavaScript, and which can be easily converted to and from MoonBit's built-in `Option[T]` (aliased as `T?`).

To achieve this, we first need a type to represent _any_ JavaScript value, similar to TypeScript's `any`. This is where `#external` is useful:

```mbt
#external
pub type Value
```

Consequently, we need methods to get the `undefined` value and to check if a given value is `undefined`:

```mbt
extern "js" fn Value::undefined() -> Value =
  #| () => undefined

extern "js" fn Value::is_undefined(self : Self) -> Bool =
  #| (n) => Object.is(n, undefined)
```

For easier debugging, we'll implement the `Show` trait for our `Value` type, allowing it to be printed:

```mbt
pub impl Show for Value with output(self, logger) {
  logger.write_string(self.to_string())
}

pub extern "js" fn Value::to_string(self : Value) -> String =
  #| (self) =>
  #|   self === undefined ? 'undefined'
  #|     : self === null ? 'null'
  #|     : self.toString()
```

Next comes the 'magic' of the conversion process. We'll define two special conversion functions:

```mbt
fn[T] Value::cast_from(value : T) -> Value = "%identity"

fn[T] Value::cast(self : Self) -> T = "%identity"
```

> **What is `%identity`**
>
> `%identity` is a special intrinsic provided by MoonBit for zero-cost type casting.
> It performs type checking at compile time, but has **no effect at runtime**.
> It essentially tells the compiler: "Trust me, I know the real type of this value; just treat it as the target type."
>
> This is a double-edged sword: it provides powerful expressiveness at the FFI boundary, but misuse can break type safety.
> Therefore, its use should be strictly limited to a FFI-related scope.

With these building blocks, we can construct `Optional[T]`:

```mbt
#external
type Optional[_] // Corresponds to T | undefined

/// Create an undefined Optional
fn[T] Optional::undefined() -> Optional[T] {
  Value::undefined().cast()
}

/// Check if an Optional is undefined
fn[T] Optional::is_undefined(self : Optional[T]) -> Bool {
  self |> Value::cast_from |> Value::is_undefined
}

/// Unwrap T from Optional[T], panic if it is undefined
fn[T] Optional::unwrap(self : Self[T]) -> T {
  guard !self.is_undefined() else { abort("Cannot unwrap an undefined value") }
  Value::cast_from(self).cast()
}

/// Convert Optional[T] to MoonBit's built-in T?
fn[T] Optional::to_option(self : Optional[T]) -> T? {
  guard !Value::cast_from(self).is_undefined() else { None }
  Some(Value::cast_from(self).cast())
}

/// Create Optional[T] from MoonBit's built-in T?
fn[T] Optional::from_option(value : T?) -> Optional[T] {
  guard value is Some(v) else { Optional::undefined() }
  Value::cast_from(v).cast()
}

test "Optional from and to Option" {
  let optional = Optional::from_option(Some(3))
  inspect(optional.unwrap(), content="3")
  inspect(optional.is_undefined(), content="false")
  inspect(optional.to_option(), content="Some(3)")
  let optional : Optional[Int] = Optional::from_option(None)
  inspect(optional.is_undefined(), content="true")
  inspect(optional.to_option(), content="None")
}
```

With this setup, we've successfully crafted a safe and ergonomic representation for `T | undefined` within MoonBit's type system.
The same method can also be used to interface with other JavaScript-specific types like `null`, `symbol`, `RegExp`, etc.

## Handling JavaScript Errors

A robust FFI layer must handle errors gracefully.
By default, if JavaScript code throws an exception during an FFI call, it won't be caught by MoonBit's `try-catch` mechanism. Instead, it will crash the entire program:

```mbt skip
// This is an FFI call that will throw an exception
extern "js" fn boom_naive() -> Value raise = "(u) => undefined.toString()"

test "boom_naive" {
  // This code will directly crash the test process instead of returning a `Result` via `try?`
  inspect(try? boom_naive()) // failed: TypeError: Cannot read properties of undefined (reading 'toString')
}
```

The correct approach is to wrap the call in a `try...catch` block on the JavaScript side, and then pass either the successful result or the caught error back to MoonBit.
While we could do this directly in the JavaScript code of our `extern "js"` declaration, a more reusable solution exists:

First, let's define an `Error_` type to encapsulate JavaScript errors:

```mbt
suberror Error_ Value

pub impl Show for Error_ with output(self, logger) {
  logger.write_string("@js.Error: ")
  let Error_(inner) = self
  logger.write_object(inner)
}
```

Next, we'll define a core FFI wrapper function, `Error_::wrap_ffi`.
Its role is to execute an operation (`op`) in the JavaScript realm and, depending on the outcome, call either a success (`on_ok`) or error (`on_error`) callback:

```mbt
extern "js" fn Error_::wrap_ffi(
  op : () -> Value,
  on_ok : (Value) -> Unit,
  on_error : (Value) -> Unit,
) -> Unit =
  #| (op, on_ok, on_error) => { try { on_ok(op()); } catch (e) { on_error(e); } }
```

Finally, using this FFI function and MoonBit closures, we can create a more idiomatic `Error_::wrap` function that returns a `T raise Error_`:

```mbt
fn[T] Error_::wrap(
  op : () -> Value,
  map_ok~ : (Value) -> T = Value::cast,
) -> T raise Error_ {
  // Define a variable to pass the result in and out of the closure
  let mut res : Result[Value, Error_] = Ok(Value::undefined())
  // Call the FFI, passing two closures that will modify the value of res based on the JS execution result
  Error_::wrap_ffi(op, fn(v) { res = Ok(v) }, fn(e) { res = Err(Error_(e)) })
  // Check the value of res and return the corresponding result or throw an error
  match res {
    Ok(v) => map_ok(v)
    Err(e) => raise e
  }
}
```

Now, we can safely call the function that previously threw an exception, and we can handle possible errors with pure MoonBit code:

```mbt
extern "js" fn boom() -> Value = "(u) => undefined.toString()"

test "boom" {
  let result = try? Error_::wrap(boom)
  inspect(
    (result : Result[Value, Error_]),
    content="Err(@js.Error: TypeError: Cannot read properties of undefined (reading 'toString'))",
  )
}
```

## Interfacing with External JavaScript APIs

Having mastered the key techniques for bridging types and handling errors, it's time to turn our attention to the wider world: the Node.js and NPM ecosystem.
The entry point to all of it is a binding for the `require()` function:

```mbt
extern "js" fn require_ffi(path : String) -> Value = "(path) => require(path)"

/// A more convenient wrapper that supports chained property access, e.g., require("a", keys=["b", "c"])
pub fn require(path : String, keys~ : Array[String] = []) -> Value {
  keys.fold(init=require_ffi(path), Value::get_with_string)
}

// ... where the definition of Value::get_with_string is as follows:

fn[T] Value::get_with_string(self : Self, key : String) -> T {
  self.get_ffi(Value::cast_from(key)).cast()
}

extern "js" fn Value::get_ffi(self : Self, key : Self) -> Self = "(obj, key) => obj[key]"
```

With this `require` function, we can easily load Node.js's built-in modules, such as the `node:path` module, and call its methods:

```mbt
// Load the basename function of the node:path module
let basename : (String) -> String = require("node:path", keys=["basename"]).cast()

test "require Node API" {
  inspect(basename("/foo/bar/baz/asdf/quux.html"), content="quux.html")
}
```

More excitingly, we can use the same method to call the vast collection of third-party libraries on NPM. Let's take a popular statistical calculation library `simple-statistics` as an example.

First, we need to initialize `package.json` and install dependencies, just like in a standard JavaScript project. Here we use `pnpm`, you can also use `npm` or `yarn`:

```console
> pnpm init
> pnpm install simple-statistics
```

Once the preparation is complete, we can directly `require` this library in our MoonBit code and get the `standardDeviation` function from it:

```mbt
let standard_deviation : (Array[Double]) -> Double = require(
  "simple-statistics",
  keys=["standardDeviation"],
).cast()
```

Now, whether we use `moon run` or `moon test`, MoonBit can correctly load dependencies via Node.js and execute the code, returning the expected result.

```mbt
test "require external lib" {
  inspect(standard_deviation([2, 4, 4, 4, 5, 5, 7, 9]), content="2")
}
```

This is quite powerful: with just a few lines of FFI code, we've connected MoonBit's type-safe world with NPM's vast and mature ecosystem.

## Conclusion

In this article, we've explored the fundamentals of interacting with JavaScript in MoonBit, from the most basic type interfacing to complex error handling, and finally to the easy integration of external libraries.
These features bridge the gap between MoonBit's static type system and JavaScript's dynamic typing, reflecting a modern approach to cross-language interoperability,
while allowing developers to enjoy the type safety and modern features of MoonBit while seamlessly accessing the vast JavaScript ecosystem, opening up immense application prospects.

Of course, with great power comes great responsibility. While the FFI is powerful, we must handle type conversions and error boundaries carefully to ensure program robustness.

Mastering these FFI techniques is a crucial skill for developers wanting to extend MoonBit applications with JavaScript libraries.
By applying these techniques, we can build high-quality applications that leverage both the strengths of MoonBit and the rich resources of the JavaScript ecosystem.

To learn more about MoonBit's ongoing progress in JavaScript interoperability, please check out the web frontend of [`mooncakes.io`] and its underlying UI library, [`rabbit-tea`], both built with MoonBit.

[`mooncakes.io`]: https://github.com/moonbitlang/mooncakes.io
[`rabbit-tea`]: https://github.com/moonbit-community/rabbit-tea
