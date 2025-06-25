# 2025-05-06

## Language Updates

* **\[Breaking Change]** The way traits are implemented will change. In the future, traits must be explicitly implemented for a type `A` using `impl T for A { ... }`. Simply defining methods on `A` with the same signature as those in `trait T` will no longer be considered as implementing the trait `T` for `A`. This change was previously accompanied by a compiler warning and will soon take effect officially.

* A new syntactic sugar has been introduced to allow the use of `_` as a placeholder for omitted parameters when creating anonymous functions, simplifying their syntax. For example, `f(a, _, c, _)` is equivalent to `fn(b, d) { f(a, b, c, d) }`. Supported usage scenarios include:

  * `Constructor(args, _)`, `lhs |> Constructor(args, _)`
  * `function(args, _)`, `lhs |> function(args, _)`
  * `object.method(args, _)` (Note: `_.method(args)` is not supported yet)

* `fnalias` now supports creating aliases for types and trait methods:

  ```moonbit
  trait Floating {
    sin(Self) -> Self
    cos(Self) -> Self
  }

  // You can now use `sin` and `cos` directly without qualifying with `Floating::`
  pub fnalias Floating::(sin, cos)
  ```

* All pragmas have been removed and will be completely replaced by attributes going forward.

* The `#internal` attribute has been implemented to provide warnings for external users of a public API:

  ```moonbit
  /// in moonbitlang/core
  #internal(unsafe, "message")
  pub fn unsafe_get(args){...}

  /// in user/module
  fn main {
    unsafe_get(...) // warning!
  }
  ```

  Users can disable these warnings by setting the `alert` option in `moon.pkg.json`.

* A new warning has been added for potentially ambiguous use of loop arguments inside a `loop` block:

  ```moonbit
  fn main {
    let a = "asdf"
    loop a {
      [k, .. b] => continue a // warning
      [k, .. b] as a => continue a // suggested
      [] => ()
    }
  }
  ```

* Implicit type conversions are now supported from `Array` to `ArrayView`, and from `Bytes` to `@bytes.View`.

## Toolchain Updates

* The `moon` CLI now supports the `bench` subcommand for running performance benchmarks.

  Use a `test` block with a `b : @bench.T` parameter to define a benchmark. You can use `b.keep()` to prevent the compiler from optimizing away side-effect-free computations:

  ```moonbit
  fn fib(n : Int) -> Int {
    if n < 2 {
      return n
    }
    return fib(n - 1) + fib(n - 2)
  }

  test (b : @bench.T) {
    b.bench(fn() { b.keep(fib(20)) })
  }
  ```

  Run benchmarks using:

  ```shell
  $ moon bench
  [..]
  time (mean ± σ)         range (min … max)
    21.67 µs ±   0.54 µs    21.28 µs …  23.14 µs  in 10 ×   4619 runs
  ```

  For more detailed usage instructions, refer to [https://docs.moonbitlang.com/en/latest/language/benchmarks.html](https://docs.moonbitlang.com/en/latest/language/benchmarks.html).
