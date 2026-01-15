# 20250714 MoonBit Monthly Update Vol.01
After the beta release on June 18, 2025, Moonbit's syntax will be more stable, and our focus will gradually shift towards performance improvements and ecosystem development. Starting with this announcement, Moonbit updates will be released monthly, with the primary content still centered on language, standard library, and toolchain enhancements.
## Language Updates
- Support for `!expr` syntax. Boolean expressions can now be directly negated using the ! symbol, without needing the not function.
```moonbit
fn true_or_false(cond: Bool) -> Unit {
  if !cond {
    println("false branch")
  } else {
    println("true branch")
  }
}

fn main {
  true_or_false(true)  // true branch
  true_or_false(false) // false branch
}
```
- The `else` keyword in `try .. catch .. else ..` syntax has been replaced with `noraise`. This change was made because the `else` in `try .. catch .. else ..` is followed by pattern matching rather than a code block, which is inconsistent with `else` elsewhere. The old syntax will be deprecated, and the compiler will issue a warning.
- **Functions can now be marked `noraise` in their return type**. This provides clearer documentation in type signatures and can prevent the compiler from automatically inserting a `raise` mark in certain situations. For example:
```moonbit
fn h(f: () -> Int raise) -> Int { ... }

fn init {
  let _ = h(fn () { 42 }) // ok
  let _ = h(fn () noraise { 42 }) // not ok
}
```
- **Ellipsis (`...`) is now allowed to omit code in pattern matching.** For example:
```moonbit
fn f(x: Int) -> Unit {
  match x {
    ...
  }
}
```
## Toolchain Updates
- **More powerful code coverage testing**. You can now use the moon coverage analyze command to directly identify unused lines of code. For example:
```moonbit
fn coverage_test(i : Int) -> String {
  match i {
    0 => "zero"
    1 => "one"
    2 => "two"
    3 => "three"
    4 => "four"
    _ => "other"
  }
}

test "coverage test" {
  assert_eq(coverage_test(0), "zero")
  assert_eq(coverage_test(1), "one")
  assert_eq(coverage_test(2), "two")
  // assert_eq(coverage_test(3), "three")
  assert_eq(coverage_test(4), "four")
  assert_eq(coverage_test(5), "other")
}
```
- Running `moon coverage analyze` on the code above will first execute the tests and then print the lines not covered during test execution, as shown below:
```shell
  ❯ moon coverage analyze
Total tests: 1, passed: 1, failed: 0.

warning: this line has no test coverage
 --> main/main.mbt:6
4 |     1 => "one"
5 |     2 => "two"
6 |     3 => "three"
  |     ^^^^^^^^^^^^
7 |     4 => "four"
8 |     _ => "other"
```
- This tool will be a great help in guiding your testing efforts.
## Standard Library Updates
- Reminder: JSON data definitions will change in the next version. Please do not directly use constructors; instead, use functions like `Json::number` to construct JSON values.