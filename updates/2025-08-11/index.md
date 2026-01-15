# 20250811 MoonBit Monthly Update Vol.02
## Language updates
1. New conditional compilation attribute `cfg`. 
- You can now compile specific sections of code based on conditions such as the target backend.
    ```moonbit
    #cfg(any(target="js", target="wasm-gc"))
    let current_target = "js | wasm-gc"
    ```
2. New `#alias` attribute. 
- You can now create aliases for methods or functions and attach annotation information. More scenarios will be supported in the future.。
  ```moonbit
  #alias(combine, deprecated="use add instead")
  fn Int::add(x : Int, y : Int) -> Int {
    x + y
  }

  test {
    let _ = Int::add(1, 2)
    let _ = Int::combine(1, 2)
  }
  ```
3. New `defer` statement.
- Provides a scope-based resource cleanup feature. When any form of `defer expr; body` appears in the body of a block, the `expr` will always be executed when the body ends.
  ```moonbit
  fn main {
    defer println("End of main")
    {
      defer println("End of block1")
      println("block1")
    }
    for i in 0..<3 {
      defer println("End of loop \{i}")
      if i == 2 {
        break // `break` and similar statements can also trigger `defer`
      }
      println("Looping \{i}")
    }
    return
  }
  ```
  ```moonbit
  block1
  End of block1
  Looping 0
  End of loop 0
  Looping 1
  End of loop 1
  End of loop 2
  End of main
  ```
  Currently, the `expr` in a `defer expr `cannot contain expressions or calls to async functions, and `expr` cannot use control flow constructs such as `return` / `break` / `continue`.

4. Native Backend Bytes Terminator Update
- In the Native backend, the `Bytes` representation used to always have an extra trailing `'\0'` character. Now, `Bytes` can be directly used to pass C strings in FFI calls without this extra trailing `'\0'` character being counted in the `Bytes` length, so the current code behavior will remain unchanged. 

5. Optional Parameter Syntax Enhancement and Unification
- Adjusted the syntax for optional parameters: default arguments can now depend on preceding parameters *(this behavior was previously removed due to incompatibility with virtual packages, but we have now found a way to support such complex defaults while remaining compatible)*.We have also unified optional parameters with default values (`label: T = ...`) and those without (`label?: T`). From the caller’s perspective, there is no longer any difference between them, and both now support the following call styles:
  - Omit the argument to use the default value.
  - Pass explicitly using `label=value`.
  - Use `label?=opt`, meaning: if `opt` is `Some(value)`, it is equivalent to `label=value`; if `opt` is `None`, it is equivalent to omitting the argument.

6. Use `#callsite(autofill(...))` as a shorthand for default arguments.

- When calling functions with default arguments, the `#callsite(autofill(...))` attribute can be used as a shorthand:

  ```moonbit
    // Original code
    pub fn[T] fail(msg : String, loc~ : SourceLoc = _) -> T raise Failure { ... }
    // new code
    #callsite(autofill(loc))
    pub fn[T] fail(msg : String, loc~ : SourceLoc) -> T raise Failure { ... }
  ```

7. Removed `newtype`
- added support for `tuple struct`.

  ```moonbit
    // Old syntax, accessing the wrapped Int
    type A Int
    fn get(a : A) -> Int {
      a.inner()
    }

    // New syntax, accessing the wrapped Int
    struct A(Int)
    fn get(a : A) -> Int {
      a.0
    }

    struct Multiple(Int, String, Char)
    fn use_multiple(x: Multiple) -> Unit {
      println(x.0)
      println(x.1)
      println(x.2)
    }
    fn make_multiple(a: Int, b: String, c: Char) -> Multiple {
      Multiple(a, b, c)
    }
  ```

- For a tuple struct with **one field**, it is equivalent to the original newtype. If the underlying type is not a tuple, the formatter will auto-migrate old access syntax. In this case, an `.inner()` method is provided for migration and will be deprecated later.

- For a tuple struct with **multiple fields**, differences from the original tuple newtype are:
  - Cannot be constructed directly with tuple syntax.
  - No `.inner()` method to retrieve the tuple.
  
  For tuple structs that support conversion to a tuple, you can use:
  
  ```moonbit
  struct T((Int, Int))

  fn make_t(x: Int, y: Int) -> T {
    (x, y)
  }

  fn use_t(t: T) -> (Int, Int) {
    t.0
  }
  ```

- In this case, to access specific elements, you need to use `t.0.0` or `t.0.1`.

8. Since the primary purpose is for data storage and functions such as `@json.inspect`, `derive(FromJson, ToJson)` will no longer provide advanced format adjustment parameters. 
  - The currently retained format parameters are: `rename` for each field, batch renaming, and the `style` option for `enum` format selection; all other parameters will be removed.
    - The optional values for `style` are `legacy` and `flat`. The latter simplifies representation and is suitable for scenarios such as `@json.inspect`. All enums must currently choose one of these styles.
    - If you need to customize the JSON format, please implement the `FromJson` and `ToJson` traits yourself.
  
    ```moonbit
    ///| Flat
    test {
      @json.inspect(Cons(1, Cons(2, Nil)), content=["Cons", 1, ["Cons", 2, "Nil"]])
    }

    ///| Legacy
    test {
      @json.inspect(Cons(1, Cons(2, Nil)), content={
        "$tag": "Cons",
        "0": 1,
        "1": { "$tag": "Cons", "0": 2, "1": { "$tag": "Nil" } },
      })
    }
    ```

## Toolchain update

1. Added `moon coverage analyze` for clearer coverage reports.

```moonbit
Total: 1 uncovered line(s) in 2 file(s)

1 uncovered line(s) in src/top.mbt:

   | fn incr2(x : Int, step? : Int = 1) -> Int {
12 |   x + step
   |   ^^^^^^^^         <-- UNCOVERED
   | }
   …

Total: 1 uncovered line(s) in 2 file(s)
```

2. `moon test --target js` now shows original source locations on panic via sourcemap.
```bash
test username/hello/lib/hello_test.mbt::hello failed: Error
    at $panic ($ROOT/target/js/debug/test/lib/lib.blackbox_test.js:3:9)
    at username$hello$lib_blackbox_test$$__test_68656c6c6f5f746573742e6d6274_0 ($ROOT/src/lib/hello_test.mbt:3:5)
    at username$hello$lib_blackbox_test$$moonbit_test_driver_internal_execute ($ROOT/src/lib/__generated_driver_for_blackbox_test.mbt:41:9)
```