# 20250715 MoonBit 月报 Vol.01
2025年6月18日发布beta版本之后，Moonbit的语法将会更加稳定，重心会逐步放到性能提升以及生态建设等方面。从本次开始，Moonbit的改动将会以每月一版的节奏发布月报。但月报的主要内容仍以**语言，标准库和工具链**的更新为主。
## 语言更新
1. 支持`!expr`语法。对布尔表达式取反现在可以直接使用`!`符号，不一定要使用`not`函数。
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

2. `try .. catch .. else ..` 语法中的 `else` 关键字被替换为 `noraise`，原因是 `try .. catch .. else ..` 中的 `else` 后是模式匹配而非代码块，和其他地方的 `else` 不一致。旧的写法将被废弃，编译器会提出警告

3. 允许函数返回值标记 `noraise`，一方面可以使类型签名中提供更清晰的文档信息，另一方可以用于防止在一些情况下编译器自动插入 `raise` 标记，比如：
```moonbit
fn h(f: () -> Int raise) -> Int { ... }

fn init {
  let _ = h(fn () { 42 }) // ok
  let _ = h(fn () noraise { 42 }) // not ok
}
```
4. 允许了 `...` 对模式匹配中的代码进行省略，比如：
```moonbit
fn f(x: Int) -> Unit {
  match x {
    ...
  }
}
```
## 工具链更新
1. 更加强大的代码覆盖率测试，现在，你可以使用`moon coverage analyze`命令直接得到代码中没有被使用到的行。例如
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
上述代码运行`moon coverage analyze`后，会首先运行测试，然后将测试运行过程中没有覆盖到的行给打印出来，如下所示：
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

  这一工具对指导测试会有很大帮助。

## 标准库更新

- 提醒：下个版本中 JSON 数据定义将会发生变化，请不要直接使用构造器，改用 Json::number 等函数进行构造