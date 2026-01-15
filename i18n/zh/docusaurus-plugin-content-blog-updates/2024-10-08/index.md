# 2024-10-08

## IDE更新

- AI Codelens支持 `/generate` 和 `/fix` 命令

`/generate` 命令能够提供一个通用的用以生成代码的聊天界面。

![generate.gif](generate.gif)

`/fix` 命令能够读取当前函数的错误信息给出修复建议。

![fix.gif](fix.gif)

## MoonBit更新

- 调整中缀表达式和`if`、`match`、`loop`、`while`、`for`、`try`表达式的优先级, 后者这些控制流表达式不再能够直接出现在要求是中缀表达式的位置，嵌套使用时需要增加一层括号。

例如`if`和`match`的语法是：

```plain text
if <infix-expr> { <expression> } [else { <expression> }]
match <infix-expr> { <match-cases> }
```

因为`if`、`match`、`loop`、`while`、`for`、`try` 都不再属于`infix-expr`, 因此`if if expr {} {}`这种代码不是合法的：

```moonbit
//invalid
if if cond {a} else {b} {v} else {d}
match match expr { ... } { ... }
let a = expr1 + expr2 + if a {b} else {c} + expr3
//valid
if (if cond {a} else {b}) {v} else {d}
match (match expr { ... }) { ... }
let a = expr1 + expr2 + (if a {b} else {c}) + expr3
```

- js后端
  - 现在Array会编译到 js 的原生数组，和 js 交互更加方便

- 标准库API
  - String包增加`concat`, `from_array`函数，弃用`Array::join`
  - `immut/list`包增加`rev_concat()`
  - Buffer类型增加`length` 和 `is_empty` 函数
  - 改进了Option类型的`to_json`函数

- 实验库API
  - `x/fs`  包支持 wasm, wasm-gc, js 后端，包含以下 api
    - write_string_to_file, write_bytes_to_file
    - read_file_to_string, read_file_to_bytes
    - path_exists
    - read_dir
    - create_dir
    - is_dir, is_file
    - remove_dir, remove_file

## 构建系统更新

- `moon test -p` 支持模糊匹配功能，例如 `moon test -p moonbitlang/core/builtin` 可简写为 `moon test -p mcb` | `moon test -p builtin` 等。

- `moon.pkg.json` 中的 `source` 字段为空字符串`""`时，等价于 `"."`，表示当前目录。

## moondoc更新

文档生成器支持package层级的README文件，所有`moon.pkg.json` 同级的README.md会被一同显示在这个包的文档页面中。
