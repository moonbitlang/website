# weekly 2024-06-03

## Language Update
- A new syntax `T?` has been added for type annotations to represent `Option[T]`.
```moonbit
struct Cell[T] {
  val: T
  next: Cell[T]?
}

fn f(x : Cell[T]?) -> Unit { ... }
```
This is equivalent to
```moonbit
struct Cell[T] {
  val: T
  next: Option[Cell[T]]
}

fn f(x : Option[Cell[T]]) -> Unit { ... }
```
The old `Option[T]` is still compatible, but it is recommended to use the shorter new syntax. moonfmt will also format `Option[T]` as `T?`.

- The core library API restructuring continues
  - The Iter package has been merged into the builtin package. Now `Iter[T]` can be used without the `@iter.` prefix.
```moonbit
pub fn any[T](xs : Iter[T], predicate : (T) -> Bool) -> Bool {
                // ^no @iter. is required
  match xs.find_first(predicate) {
    None => false
    Some(_) => true
  }
}
```
  - The `Stack` package has been moved to `moonbitlang/x`
  - The List package has been removed, along with the `to_list` and `from_list` functions for various data structures. It is recommended to use `Iter[T]` and `Array[T]` for data structure conversion and intermediate representation.
- Performance improvements
  - The compiler will now perform partial closure conversion during the separate compilation phase, improving compilation performance. Closure conversion has also been applied to code generated for the JavaScript backend in specific situations.
  - The types `Option[Bool]`, `Option[Char]`, `Option[Byte]`, and `Option[Unit]` are now represented using 32-bit integers, where `None` is represented by -1 and `Some(x)` by `x`. The type `Option[Int]` is represented by a 64-bit integer in the wasm backend, where `None` is represented by `0x1_0000_0000`, and `Some(x)` by `x`. In the JavaScript backend, `Option[Int]` is represented as `int | undefined` , where `undefined` represents `None`.
- `abort` behavior change
  - To remove the dependency of Wasm programs on the non-standard `spectest.print_char`, the error output functionality is being restructured.
  - `abort` will no longer use `spectest.print_char` to print error messages. Its behavior will be the same as `panic` until the functionality is further improved.

  ## Plugin Update

- [Language Server] Fixed a memory leak issue.