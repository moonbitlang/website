---
moonbit:
  backend: js
description: '初探 MoonBit 中的 JavaScript 交互'
slug: moonbit-jsffi
image: cover.png
---

# 初探 MoonBit 中的 JavaScript 交互

![](./cover.png)

---

## 引言

在当今的软件世界中，任何一门编程语言都无法成为一座孤岛。
对于 MoonBit 这样一门新兴的通用编程语言而言，若想在庞大的技术生态中茁壮成长，与现有生态系统的无缝集成便显得至关重要。

MoonBit 提供了包括 JavaScript 在内的多种编译后端，这为其对接广阔的 JavaScript 生态敞开了大门。
无论是对于浏览器前端开发，还是对于 Node.js 环境下的后端应用，这种集成能力都极大地拓展了 MoonBit 的应用场景，让开发者可以在享受 MoonBit 带来的类型安全与高性能的同时，复用数以万计的现有 JavaScript 库。

在本文中，我们将以 Node.js 环境为例，一步步探索 MoonBit JavaScript FFI 的奥秘，从基础的函数调用到复杂的类型与错误处理，向你展示如何优雅地搭建连接 MoonBit 与 JavaScript 世界的桥梁。

## 预先准备

在正式启程之前，我们需要先为项目做好基础配置。如果还没有现成的项目，可以使用 `moon new` 工具创建一个新的 MoonBit 项目。

为了让 MoonBit 工具链知晓我们的目标平台是 JavaScript，我们需要在项目根目录的 `moon.mod.json` 文件中添加以下内容：

```json
{
  "preferred-target": "js"
}
```

此项配置会告知编译器，在执行 `moon build` 或 `moon check` 等命令时，默认使用 JavaScript 后端。
当然，如果你希望在命令行中临时指定，也可以通过 `--target=js` 参数达到同样的效果。

## 编译项目

完成上述配置后，只需在项目根目录下运行我们所熟悉的构建命令：

```console
> moon build
```

命令执行成功后，由于我们的项目默认包含一个可执行入口，你可以在 `target/js/debug/build/` 目录下找到编译产物。MoonBit 非常贴心地为我们生成了三个文件：

- `.js` 文件：编译后的 JavaScript 源码。
- `.js.map` 文件：用于调试的 Source Map 文件。
- `.d.ts` 文件：TypeScript 类型声明文件，便于在 TypeScript 项目中集成。

## 第一个 JavaScript API 调用

MoonBit 的 FFI 设计在原则上保持了一致性。与调用 C 或其他语言类似，我们通过一个带有 `extern` 关键字的函数声明来定义一个外部调用：

```mbt
extern "js" fn consoleLog(msg : String) -> Unit = "(msg) => console.log(msg)"
```

这行代码是 FFI 的核心。让我们来分解一下：

- `extern "js"`：声明这是一个指向 JavaScript 环境的外部函数。
- `fn consoleLog(msg : String) -> Unit`：这是该函数在 MoonBit 中的类型签名，它接受一个 `String` 类型的参数，并且返回一个单位值 (`Unit`)。
- `"(msg) => console.log(msg)"`：等号右侧的字符串字面量是这段 FFI 的“灵魂”，其中需要包含一段原生 JavaScript 函数。

  在这里，我们使用了一个简洁的箭头函数。
  MoonBit 编译器会按原样将这段代码嵌入到最终生成的 `.js` 文件中，从而实现从 MoonBit 到 JavaScript 的调用。

  > **提示**
  > 如果你的 JavaScript 代码片段比较复杂，可以使用 `#|` 语法来定义多行字符串，以提高可读性。

一旦这个 FFI 声明就绪，我们就可以在 MoonBit 代码中像调用普通函数一样调用 `consoleLog` 了：

```mbt
test "hello" {
  consoleLog("Hello from JavaScript!")
}
```

运行 `moon test`，你将会在控制台看到由 JavaScript `console.log` 打印出的信息。我们的第一座桥梁已经成功搭建！

## JavaScript 类型的对接

打通调用流程只是第一步，真正的挑战在于如何处理两种语言之间的类型差异。
MoonBit 是一门静态类型语言，而 JavaScript 则是动态类型语言。如何在这两者之间建立安全可靠的类型映射，是 FFI 设计中需要重点考虑的问题。

下面，我们从易到难，分情况介绍如何在 MoonBit 中对接不同的 JavaScript 类型。

### 无需转换的 JavaScript 类型

最简单的情况是，MoonBit 中的某些类型在编译到 JavaScript 后端时，其底层实现本身就是对应的原生 JavaScript 类型。在这种情况下，我们可以直接进行传递，无需任何转换。

常见的“零成本”对接类型如下表所示：

| MoonBit 类型                     | JavaScript 对应类型 |
| -------------------------------- | ------------------- |
| `String`                         | `string`            |
| `Bool`                           | `boolean`           |
| `Int`, `UInt`, `Float`, `Double` | `number`            |
| `BigInt`                         | `bigint`            |
| `Bytes`                          | `Uint8Array`        |
| `Array[T]`                       | `Array<T>`          |
| 函数类型                         | `Function`          |

基于这些对应关系，我们已经能够对许多简单的 JavaScript 函数进行绑定了。
事实上，在之前绑定 `console.log` 函数的例子中，我们已经使用了 MoonBit 中 `String` 类型与 JavaScript 中 `string` 类型的对应关系。

> **注意：维持 MoonBit 类型的内部不变量**
>
> 一个非常重要的细节是，MoonBit 的所有标准数值类型（`Int`, `Float` 等）在 JavaScript 中都对应于 `number` 类型，即 IEEE 754 双精度浮点数。
> 这意味着当整数值越过 FFI 边界进入 JavaScript 后，其行为将遵循浮点数语义，这可能会导致在 MoonBit 看来非预期的结果，例如整数溢出行为的差异：
>
> ```mbt
> extern "js" fn incr(x : Int) -> Int = "(x) => x + 1"
>
> test "incr" {
>   // 在 MoonBit 中，@int.max_value + 1 会溢出并回绕
>   inspect(@int.max_value + 1, content="-2147483648")
>   // 在 JavaScript 中，它被当作浮点数处理，不会溢出
>   inspect(incr(@int.max_value), content="2147483648") // ???
> }
> ```
>
> 而这本质上是不合法的，因为根据 MoonBit 中 `Int` 的值的内部不变量，其值不可能是 `2147483648`（超出了类型允许的最大值）。
> 这可能导致下游依赖这一点的其他 MoonBit 代码出现意料之外的行为。
> 在跨越 FFI 边界处理其他数据类型时也有可能出现类似的问题，因此请在编写相关逻辑时务必留意这一点。

### 外部 JavaScript 类型

当然，JavaScript 的世界远比上述基本类型要丰富。
我们很快就会遇到 `undefined`、`null`、`symbol` 以及各种复杂的宿主对象（Host Object）。这些类型在 MoonBit 中没有直接的对应物。

对于这种情况，MoonBit 提供了 `#external` 注解。
这个注解好比一个契约，它告诉编译器：
“请相信我，这个类型在外部世界（JavaScript）中是真实存在的。
你不需要关心它的内部结构，只需把它当作一个不透明的句柄来处理即可。”

例如，我们可以这样定义一个代表 JavaScript `undefined` 的类型：

```mbt skip
#external
type Undefined

extern "js" fn Undefined::new() -> Self = "() => undefined"
```

然而，单独的 `Undefined` 类型意义不大，因为在实际应用中，`undefined` 往往是作为联合类型（Union Type）的一部分出现的，例如 `string | undefined`。

一个更实用的方案是创建一个 `Optional[T]` 类型来精确对应 JavaScript 中的 `T | undefined`，并让它能与 MoonBit 内置的 `T?`（`Option[T]`）类型方便地互相转换。

为了实现这个目标，我们首先需要一个能够代表“任意” JavaScript 值的类型，类似于 TypeScript 中的 `any`。这正是 `#external` 的用武之地：

```mbt
#external
pub type Value
```

相应地，我们还需要提供获取 `undefined` 值和判断某值是否为 `undefined` 的方法：

```mbt
extern "js" fn Value::undefined() -> Value =
  #| () => undefined

extern "js" fn Value::is_undefined(self : Self) -> Bool =
  #| (n) => Object.is(n, undefined)
```

为了方便调试，我们再为 `Value` 类型实现 `Show` 特质，让它可以被打印出来：

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

接下来是整个转换过程中的“魔法”所在。我们定义两个特殊的转换函数：

```mbt
fn[T] Value::cast_from(value : T) -> Value = "%identity"

fn[T] Value::cast(self : Self) -> T = "%identity"
```

> **何为 `%identity`**
>
> `%identity` 是 MoonBit 提供的一个特殊内建函数（intrinsic），它是一个“零成本”的类型转换操作。
> 它在编译时会进行类型检查，但在运行时**不会产生任何效果**。
> 它仅仅是告诉编译器：“作为开发者，我比你更清楚这个值的真实类型，请直接将它当作另一种类型来看待。”
>
> 这是一把双刃剑：它为 FFI 边界层的代码提供了强大的表达能力，但如果滥用，则可能破坏类型安全。
> 因此，它的使用场景应当被严格限制在 FFI 相关代码范围内。

有了这些积木，我们就可以开始搭建 `Optional[T]` 了：

```mbt
#external
type Optional[_] // 对应 T | undefined

/// 创建一个 undefined 的 Optional
fn[T] Optional::undefined() -> Optional[T] {
  Value::undefined().cast()
}

/// 检查一个 Optional 是否为 undefined
fn[T] Optional::is_undefined(self : Optional[T]) -> Bool {
  self |> Value::cast_from |> Value::is_undefined
}

/// 从 Optional[T] 中解包出 T，如果为 undefined 则 panic
fn[T] Optional::unwrap(self : Self[T]) -> T {
  guard !self.is_undefined() else { abort("Cannot unwrap an undefined value") }
  Value::cast_from(self).cast()
}

/// 将 Optional[T] 转换为 MoonBit 内置的 T?
fn[T] Optional::to_option(self : Optional[T]) -> T? {
  guard !Value::cast_from(self).is_undefined() else { None }
  Some(Value::cast_from(self).cast())
}

/// 从 MoonBit 内置的 T? 创建 Optional[T]
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

通过这套组合拳，我们成功地在 MoonBit 的类型系统中为 `T | undefined` 找到了一个安全且人体工学良好的表达方式。
同样的方法也可以用于对接 `null`、`symbol`、`RegExp` 等其他 JavaScript 特有的类型。

## 处理 JavaScript 错误

一个健壮的 FFI 层必须能够优雅地处理错误。
默认情况下，如果在 FFI 调用中，JavaScript 代码抛出了一个异常，这个异常并不会被 MoonBit 的 `try-catch` 机制捕获，而是会直接中断整个程序的执行：

```mbt skip
// 这是一个会抛出异常的 FFI 调用
extern "js" fn boom_naive() -> Value raise = "(u) => undefined.toString()"

test "boom_naive" {
  // 这段代码会直接让测试进程崩溃，而不是通过 `try?` 返回一个 `Result`
  inspect(try? boom_naive()) // failed: TypeError: Cannot read properties of undefined (reading 'toString')
}
```

正确的做法是在 JavaScript 层用 `try...catch` 语句将调用包裹起来，然后找到一种办法将成功的结果或捕获到的错误传递回 MoonBit。
当然，我们可以直接在 `extern "js"` 声明的 JavaScript 代码中这么做，但也存在更可复用的解决办法：

首先，我们定义一个 `Error_` 类型来封装来自 JavaScript 的错误：

```mbt
suberror Error_ Value

pub impl Show for Error_ with output(self, logger) {
  logger.write_string("@js.Error: ")
  let Error_(inner) = self
  logger.write_object(inner)
}
```

接着，我们定义一个核心的 FFI 包装函数 `Error_::wrap_ffi`。
它的作用是在 JavaScript 领域执行一个操作（`op`），并根据成功与否，调用不同的回调函数（`on_ok` 或 `on_error`）：

```mbt
extern "js" fn Error_::wrap_ffi(
  op : () -> Value,
  on_ok : (Value) -> Unit,
  on_error : (Value) -> Unit,
) -> Unit =
  #| (op, on_ok, on_error) => { try { on_ok(op()); } catch (e) { on_error(e); } }
```

最后，我们利用这个 FFI 函数和 MoonBit 的闭包，就可以封装出一个符合 MoonBit 风格、返回 `T raise Error_` 的 `Error_::wrap` 函数：

```mbt
fn[T] Error_::wrap(
  op : () -> Value,
  map_ok~ : (Value) -> T = Value::cast,
) -> T raise Error_ {
  // 定义一个变量，用于在闭包内外传递结果
  let mut res : Result[Value, Error_] = Ok(Value::undefined())
  // 调用 FFI，传入两个闭包，它们会根据 JS 的执行结果修改 res 的值
  Error_::wrap_ffi(op, fn(v) { res = Ok(v) }, fn(e) { res = Err(Error_(e)) })
  // 检查 res 的值，并返回相应的结果或抛出错误
  match res {
    Ok(v) => map_ok(v)
    Err(e) => raise e
  }
}
```

现在，我们可以安全地调用之前那个会抛出异常的函数了，并且能以纯 MoonBit 代码来处理可能发生的错误：

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

## 对接外部 JavaScript API

至此，我们已经掌握了处理类型和错误的关键技术，是时候将目光投向更广阔的天地了——整个 Node.js 和 NPM 生态系统。
而这一切的入口，就是对 `require()` 函数的绑定。

```mbt
extern "js" fn require_ffi(path : String) -> Value = "(path) => require(path)"

/// 一个更方便的包装，支持链式获取属性，例如 require("a", keys=["b", "c"])
pub fn require(path : String, keys~ : Array[String] = []) -> Value {
  keys.fold(init=require_ffi(path), Value::get_with_string)
}

// ... 其中 Value::get_with_string 的定义如下：

fn[T] Value::get_with_string(self : Self, key : String) -> T {
  self.get_ffi(Value::cast_from(key)).cast()
}

extern "js" fn Value::get_ffi(self : Self, key : Self) -> Self = "(obj, key) => obj[key]"
```

有了这个 `require` 函数，我们就可以轻松加载 Node.js 的内置模块，例如 `node:path` 模块，并调用它的方法：

```mbt
// 加载 node:path 模块的 basename 函数
let basename : (String) -> String = require("node:path", keys=["basename"]).cast()

test "require Node API" {
  inspect(basename("/foo/bar/baz/asdf/quux.html"), content="quux.html")
}
```

更令人兴奋的是，使用同样的方法，我们还能调用 NPM 上的海量第三方库。让我们以一个流行的统计学计算库 `simple-statistics` 为例。

首先，我们需要像在一个标准的 JavaScript 项目中那样，初始化 `package.json` 并安装依赖。这里我们使用 `pnpm`，你也可以换成 `npm` 或 `yarn`：

```console
> pnpm init
> pnpm install simple-statistics
```

准备工作就绪后，我们就可以在 MoonBit 代码中直接 `require` 这个库，并获取其中的 `standardDeviation` 函数：

```mbt
let standard_deviation : (Array[Double]) -> Double = require(
  "simple-statistics",
  keys=["standardDeviation"],
).cast()
```

现在，无论是 `moon run` 还是 `moon test`，MoonBit 都能正确地通过 Node.js 加载依赖并执行代码，返回我们期望的计算结果。

```mbt
test "require external lib" {
  inspect(standard_deviation([2, 4, 4, 4, 5, 5, 7, 9]), content="2")
}
```

这无疑是激动人心的。仅仅通过几行 FFI 代码，我们就将 MoonBit 的类型安全世界与 NPM 庞大、成熟的生态系统连接在了一起。

## 结语

通过本文的探索，我们初步了解了如何在 MoonBit 语言中与 JavaScript 进行交互，从最基础的类型对接到复杂的错误处理，再到外部库的轻松集成。
这些功能在 MoonBit 的静态类型系统与作为动态类型语言的 JavaScript 之间架起了一座桥梁，这体现了 MoonBit 作为现代编程语言在跨语言互操作性方面的思考。
它让开发者既能享受到 MoonBit 的类型安全与现代化的语言特性，又能无缝访问 JavaScript 的庞大生态，为 MoonBit 拓宽了不可估量的应用前景。

当然，能力越大，责任也越大：FFI 虽然强大，但在实际开发中仍需谨慎处理类型转换和错误边界，确保程序的健壮性。

对于希望利用 JavaScript 库来扩展 MoonBit 应用功能的开发者来说，掌握这些 FFI 技术将是一项至关重要的技能。
通过合理运用这些技术，我们可以构建出既具有 MoonBit 语言优势，又能充分利用 JavaScript 生态资源的高质量应用程序。

如果希望了解关于 MoonBit 在 JavaScript 互操作方面的探索进展的更多内容，欢迎关注基于 MoonBit 构建的 Web 应用前端 [`mooncakes.io`] 及其背后的界面库 [`rabbit-tea`]。

[`mooncakes.io`]: https://github.com/moonbitlang/mooncakes.io
[`rabbit-tea`]: https://github.com/moonbit-community/rabbit-tea
