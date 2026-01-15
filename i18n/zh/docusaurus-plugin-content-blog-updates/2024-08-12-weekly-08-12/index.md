# weekly 2024-08-12

## MoonBit更新

- 添加了基于 `Iter` 和 `Iter2` 类型的 `for .. in` 循环支持：

```moonbit
fn main {
  for x in [ 1, 2, 3 ] {
    println(x)
  }
  for k, v in { "x": 1, "y": 2 } {
    println("\{k} => \{v}")
  }
}
```

  `for` 与 `in` 之间可以使用 1～2 个变量来绑定 `Iter` 中的元素。有一个变量的 `for x in expr1` 循环会遍历 `expr1.iter() : Iter[_]`，有两个变量的 `for x, y in expr2` 循环会遍历 `expr2.iter2() : Iter2[_, _]` 中的元素。可以使用下划线代替变量来忽略元素，但不能在 `for` 与 `in` 之间使用模式匹配。

  `for .. in` 循环的循环体中，可以使用 `return`/`break`/`raise` 等控制流：

```moonbit
test "for/in" {
  // 数组的 `iter2` 方法会遍历 index + 元素
  for i, x in [ 1, 2, 3 ] {
    assert_eq!(i + 1, x)
  }
}
```

- 引入新的字符串插值语法：`\{}`，旧的语法`\()`已弃用，允许更复杂的表达式直接嵌入字符串。
    未来会放松字符串插值内的语法限制，例如支持`\{1 + 2}` 和 `\{x.f(y)}`。

```moonbit
"hello, \(name)!" // warning: deprecated
"hello, \{name}!" // new syntax
```

- 数值处理拓展：增加了新的内建类型`BigInt`，用于处理超出普通整数范围的大数值。

```moonbit
// BigInt 字面量以 N 结尾
let num = 100000000N

// 与 Int 字面量类似，数字间允许下划线。同样支持 16 进制、8 进制、2 进制表示
let n2 = 0xFFFFFFFFN
let n3 = 0o77777777N
let n4 = 0b1111111100000000N
let n5 = 1234_4567_91011N

// 当明确是一个 BigInt 类型时，字面量不用加 N 后缀
let n6 : BigInt = 1000000000000000000

//模式匹配也支持`BigInt`：

match 10N {
  1N => println(1)
  10N => println(10)
  100 => println(100)
}
```

- 支持了 `enum` 形式的错误类型声明，比如 `Json` 包中的错误类型可以如下声明：

```moonbit
pub type! ParseError {
  InvalidChar(Position, Char)
  InvalidEof
  InvalidNumber(Position, String)
  InvalidIdentEscape(Position)
} derive(Eq)
```

  此外，`labeled argument` 和 `mutable argument` 也可以在 `enum` 形式的错误类型中使用，使用方式与普通的 `enum` 类型一致，比如：

```moonbit
type! Error1 {
  A
  B(Int, ~x: String)
  C(mut ~x: String, Char, ~y: Bool)
} derive(Show)

fn f() -> Unit!Error1 {
  raise Error1::C('x', x="error2", y=false)
}

fn g() -> Unit!Error1 {
  try f!() {
    Error1::C(_) as c => {
      c.x = "Rethrow Error2::C"
      raise c
    }
    e => raise e
  }
}

fn main {
  println(g?()) // Err(C(x="Rethrow Error2::C", 'x', y=false))
}
```

- 添加了 `catch!` 语法，用于在 `error handler` 中将未处理的错误重新抛出，以简化错误处理，比如上面例子中的函数 `g` 可以重写为：

```moonbit
fn g() -> Unit!Error1 {
  try f!() catch! {
    Error1::C(_) as c => {
      c.x = "Rethrow Error2::C"
      raise c
    }
  }
}
```

- 移除了 JavaScript 后端生成的代码对 `TextDecoder API` 的依赖。随着 Node.js 对 `TextDecoder` 的支持变得更完善，我们未来仍然可能会考虑在项目中引入和使用 `TextDecoder`。

## IDE 更新

- 修复在 web 版 vscode 插件上调试时无法加载核心库 core 中的源码问题，现在 [MoonBit IDE](https://try.moonbitlang.cn)上的调试功能已恢复可用。

- IDE 支持在模式匹配中根据类型对构造器进行补全：

```moonbit
match (x : Option[Int]) {

// ^^^^ 这里会补全 `None` 和 `Some`
}
```

## 标准库更新

- 新增 `Iter2` 类型，用于遍历有两个元素的集合，例如 `Map`，或是带着 `index` 遍历数组：

```moonbit
fn main {
  let map = { "x": 1, "y": 2 }
  map.iter2().each(fn (k, v) {
    println("\{k} => \{v}")
  })
}
```

  和 `Iter[(X, Y)]` 相比，`Iter2[X, Y]` 有更好的性能，并且有 `for .. in` 循环的原生支持。

- `@json.JsonValue` 类型被移动到 `@builtin` 包中，并重命名为 `Json`。`@json.JsonValue` 现在是以 `Json` 的一个类型别名，所以这一改动是向后兼容的。

- 在 `@builtin` 中添加了 `ToJson` 接口，用于表示可以被转换为 `Json` 的类型。

## 构建系统更新

- `moon check|build|test` 添加 `-C/--directory` 命令，与 `--source-dir` 参数等价，用于指定 MoonBit 项目的根目录，也即 `moon.mod.json` 所在目录。

- 修改 `moon.mod.json` 中的 `root-dir` 为 `source`，这个字段用于指定模块的源码目录，`source` 字段的值也可以是多层目录，但是必须为 `moon.mod.json` 所在目录的子目录，例如："source": "a/b/c"。

  引入该字段的目的是因为 MoonBit 模块中的包名与文件路径相关。例如，如果当前模块名为 `moonbitlang/example`，而其中一个包所在目录为 `lib/moon.pkg.json`，那么在导入该包时，需要写包的全名为 `moonbitlang/example/lib`。有时，为了更好地组织项目结构，我们想把源码放在 `src` 目录下，例如`src/lib/moon.pkg.json`，这时需要使用 `moonbitlang/example/src/lib` 导入该包。但一般来说我们并不希望 `src` 出现在包的路径中，此时可以通过指定"source": "src"来忽略`src`这层目录，便可仍然使用 `moonbitlang/example/lib` 导入该包。

## 工具链更新

- MoonBit AI 增加`explain`新功能：点击 MoonBit 图标，选择 `/explain` 来解释代码。代码的解释会出现在右侧。代码生成完以后，可以通过点击👍/👎给我们关于生成质量上的反馈。

![ai explain](./ai%20explain.gif)
