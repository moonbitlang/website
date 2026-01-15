import FillCase from "./fill_case.webm"
import FillInMatch from "./fill_in_match.webm"

# 2025-02-10

## MoonBit更新

### 新增 is 表达式

1. 这个表达式的语法形式为 `expr is pat`，这个表达式为 `Bool` 类型，当 `expr` 符合 `pat` 这个模式的时候返回 `true`，比如：

```moonbit
fn use_is_expr(x: Int?) -> Unit {
  if x is Some(i) && i >= 10 { ... }
}
```

2. Pattern 中可以引入新的 binder，这个 binder 可以以下两种情况中使用：

- `e1 && e2` 中当 `e1` 是个 is 表达式的时候，其中通过 pattern 引入的 binder 可以在 `e2` 中使用

-  `if e1 && e2 && ... { if_branch } else { ... }` 中 `e1`，`e2` 等由 `&&` 链接的判断中的 is 表达式引入的 binder，可以在 `if_branch` 这个分支中使用

### String 的构造和模式匹配

1. 新增了使用 array spread 的形式构造字符串，比如：

```moonbit
fn string_spread() -> Unit {
  let s = "hello🤣😂😍"
  let sv = s[1:6]
  let str : String = ['x', ..s, ..sv, '😭']
  println(str) // xhello🤣😂😍ello🤣😭
}
```

其中 array spread 中的单个元素为 `Char` 类型的值，可以使用 `..` 插入 `String` 或者 `@string.View` 类型的一段字符串，这个表达式等价于使用 `StringBuilder` 构建字符串。

2. 支持了使用 array pattern 对字符串进行模式匹配，并且允许其与 array literal pattern 进行混用，比如：

```moonbit
fn match_str(s: String) -> Unit {
  match s {
    "hello" => ... // string literal pattern
    [ 'a' ..= 'z', .. ] => ... // array pattern
    [ .., '😭' ] => ... // array pattern with unicode
    _ => ...
  }
}
```

### 新增编译器警告

- 现在编译器会对无用的 guard 语句和 `guard let ... else ...` 中的 missing case 产生警告

```moonbit
fn main {
  guard let (a, b) = (1, 2)
  ^^^^^^^^^ ----- useless guard let
  println(a + b)
}
```

### moonfmt 修复

- 修复 moonfmt 处理 async 相关代码的格式化错误。调整 `///|` 标记的插入规则。

## 相关包更新

- [moonbitlang/x/sys](https://github.com/moonbitlang/x/tree/main/sys) 包增加对native后端的支持。修复了这个实现在不同操作系统上行为不一致的问题。

- 在 moonbitlang/x 中的 [fs 包](https://github.com/moonbitlang/x/tree/main/fs)接口调整，增加了错误处理。

- 字符串相关操作正在进行重新整理，`string` 包将会提供更多 unicode-safe 的 API，同时会 deprecated 一些暴露 UTF16 实现细节的 API，这期间 `string` 的方法将会变得不稳定，推荐使用 iter 方法或者模式匹配对来访问字符串中的元素

- 将 `ArrayView/StringView/BytesView` 这些类型从 `@builtin` 包中分别挪到了各自类型相关的包中，类型名相对应地改为了 `@array.View/@string.View/@bytes.View`。

## IDE 更新

- 支持了自动补全模式匹配中 missing case 的 code action

  <video autoPlay loop muted playsInline src={FillInMatch} style={{width: '100%'}}></video>

- 支持了空模式匹配中所有 case 的行内代码补全

  <video autoPlay loop muted playsInline src={FillCase} style={{width: '100%'}}></video>

- 修复 trait method goto reference 的 bug 。

- 修复了 `guard let ... else ...` 中引入的变量没有补全支持的问题，修复 else 分支模式匹配部分 pattern 的补全。

## 构建系统更新

- 修复 moon test 在 native 后端跳过 panic test 时的 bug。

## 文档更新

- 我们在 MoonBit 文档里面增加了[错误代码的索引](https://docs.moonbitlang.com/en/latest/language/error_codes/index.html)。目前很多索引的内容写的很简陋，我们会逐步补充内容，也非常欢迎大家做贡献！贡献 error code 可以[参考这个issue](
https://github.com/moonbitlang/moonbit-docs/issues/467)。

- [MoonBit 语言导览](https://tour.moonbitlang.com/zh)支持中文。
