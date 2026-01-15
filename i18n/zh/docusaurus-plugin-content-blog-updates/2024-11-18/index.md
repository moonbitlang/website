# 2024-11-18

## MoonBit更新

- trait 新增 abstract 和 pub(readonly) visibility

1. 在当前包内，abstract/readonly trait 和一个完全公开的 trait 表现相同；
2. 在当前包外不能直接调用 abstract trait 里的方法，且不能给 abstract trait 写新的实现；
3. pub(readonly) 的 trait 在外部不能实现，但可以直接调用方法；
4. trait 的默认可见性从私有变成 abstract。定义一个私有 trait 要写 `priv trait`；
5. 实现一个 abstract/readonly trait 时，如果想要外部也可以使用这个实现，至少有一个方法需要用 `impl Trait for Type` 的形式实现。

下面是一个 abstract trait 的例子：

```moonbit
trait Number {
  add(Self, Self) -> Self
}

pub fn add[N : Number](x : N, y : N) -> N {
  Number::add(x, y)
}

impl Number for Int with add(x, y) { x + y }
impl Number for Double with add(x, y) { x + y}
```

使用 `moon info` 生成 `.mbti` 接口文件，可以看到上述定义对外的接口是：

```moonbit
trait Number
impl Number for Int
impl Number for Double

fn add[N : Number](N, N) -> N
```

因此，外部只能对 `Int` 和 `Double` 调用 `add` 函数。编译器会保证 `Number` 在任何时候都只能被 `Int` 和 `Double` 实现。

- 调整类型和 trait 的可见性

为了鼓励使用 readonly 的类型/trait、提供更健壮的 API，我们计划在未来将类型定义和 trait 的 `pub` 可见性的语义修改为默认 readonly。如果想要获得完全公开的可见性，类型定义需要写 `pub(all) struct/enum/type`，trait 需要写 `pub(open) trait`（表示这个 `trait` 可以接受外部的实现）。

目前，`pub` 的语义依然是完全公开的可见性，但编译器会输出一个警告提示用户将 `pub` 迁移至 `pub(all)`/`pub(open)`。已有的代码可以通过 `moon fmt` 自动迁移，formatter 会把 `pub` 自动变成 `pub(all)`/`pub(open)`。

- `struct` 类型新增 private field 功能，可以在一个公开的 `struct` 的某些 field 前用 `priv` 关键字隐藏它：

1. 在外部，`priv` field 是完全不可见的。不能读也不能修改
2. 如果一个 `struct` 有 private field，它在外部不可以用字面量直接构造。但可以使用 struct update 语法 `{ ..old_struct, new_field: ... }` 来更新公开的 field
3. 迁移到后缀风格的 label argument 语法。新的语法相当于把`~`移动到了标识符之后，如果是`~label?`这种形式，波浪号可以省略。

```moonbit
enum Foo {
  Bar(label~ : Int, Bool)
}
fn f(a~ : Int, b~ : Int = 0, c? : Int) -> Unit {...}
fn main {
  f(a=1, b=2, c=3)
  f(a=1, c?=Some(3))//b 声明了默认值可以省略，c 转发 option 语法照旧
  let a = 1
  let c = Some(3)
  f(a~, c?) //和声明处一样，punning 也变成了后缀的形式
}
```

旧的语法将在未来移除：

```moonbit
enum Foo {
  //deprecated
  Bar(~label : Int, Bool)
}
//deprecated
fn f(~a : Int, ~b : Int = 0, ~c? : Int) -> Unit {}
fn main {
  let a = 1
  let c = Some(3)
  f(~a, ~c?) //deprecated
}
```

已有的代码可以通过 `moon fmt` 进行迁移。

- 添加了一系列保留字，供编译器未来使用。目前，使用保留字会得到一个警告，提示用户进行迁移。未来这些保留字可能会变成语言关键字。本次新增的保留字为：

```plain text
module
move
ref
static
super
unsafe
use
where
async
await
dyn
abstract
do
override
typeof
virtual
yield
local
method
alias
```

- 我们计划将标准库中的 `Bytes` 类型改为不可变类型，因此会将一些对 `Bytes` 类型进行修改的函数标记为 deprecate，如果需要使用可以修改的 `Bytes` 类型，可以考虑使用 `Array[Byte]`, `FixedArray[Byte]` 或者 `Buffer` 进行替代。

- `@test.is` 函数被重命名为 `@test.same_object`，旧的名字被 deprecate。未来我们将把 `is` 设为保留字。

## IDE更新

- 修复了`moon fmt --block-style`没有正确处理`///| comment`的问题。

- IDE 适配后缀 label argument 语法，支持 gotoref 和 rename。

- 文档中支持代码高亮。

- 修复 lsp 在`@`补全时有 internal package 的问题。

## 构建系统更新

- `-verbose`选项现在会输出当前运行的命令。

## MoonBit ProtoBuf

- 已开源[protoc-gen-mbt库](https://github.com/moonbit-community/protoc-gen-mbt)。
