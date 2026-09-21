# 20260921 MoonBit v0.10.14

对应 moonc 版本：`v0.10.14`

## 语言更新

### 新增 `MySubError::_` 模式匹配

支持使用 `T::_` 按类型匹配子错误,无需逐一列举该类型的错误构造器。并且该特性可以用于把 `Error` 类型 narrow 到具体的子错误类型。

```moonbit
suberror ParseError {
  Empty
  InvalidChar(Char)
}

fn describe(error : Error) -> String {
  match error {
    ParseError::_ as e => use_suberror(e) // type of e is ParseError
    _ => "其他错误"
  }
}

fn use_suberror(_e: ParseError) -> String {
  "解析错误"
}

fn main {
  println(describe(ParseError::Empty)) // 解析错误
  println(describe(ParseError::InvalidChar('?'))) // 解析错误
}
```

### `for... in...` 支持模式匹配

`for... in...` 循环现在可以直接解构迭代元素:

```moonbit
fn main {
  let items = [("苹果", 2), ("梨", 3)]
  for (name, count) in items {
    println("\{name}: \{count}")
  }
  // 输出:
  // 苹果 : 2
  // 梨 : 3
}
```

### `enum` 新增 `#non_exhaustive` 标记

有 `#non_exhaustive` 标记的 `enum` 在未来可能添加新的构造器,因此匹配一个来自外部的、 有 `#non_exhaustive` 标记的 `enum` 时,在匹配完所有已知的构造器之后,还需要用 `TypeName::..` 的形式处理未来潜在的未知构造器,否则编译器会给出警告:

```moonbit
// @pkg
#non_exhaustive
enum E {
  A
  B
}

// 在另一个包内:

fn bad(x : @pkg.E) -> Unit {
  // 编译器会给出警告:匹配  `#non_exhaustive` 的  enum 需要处理未知构造器
  match x {
    A | B => ...
  }
}

fn good(x : @pkg.E) -> Unit {
  match x {
    A | B => ...
    E::.. => println("fallback")
  }
}
```

`E::..` 是一个专门用来处理未知构造器的构造。因此,使用 `E::..` 时,如果还有未匹配的已知构造器,编译器同样会给出警告。例如,如果 @pkg 给 E 加上了一个新的构造器 C,那么 good 函数内的模式匹配就会收到一个警告,告诉用户有未匹配的已知构造器 C 。这样一来,下游就可以通过警告收到上游新增构造器的通知。在运行时,`E::..` 会匹配任何值。因此在 good 适配新的构造器 C 之前,C 会由 `E::..` 的默认分支处理,而不会使程序崩溃。

如果只想匹配某个 `#non_exhaustive` 类型中的少数特殊构造器,可以使用 `_` 。_ 即使在已知构造器未全部匹配时也可以使用,表示显式忽略剩余的所有构造器。不过,如果在已知构造器已全部匹配的情况下使用 `_`,编译器会给出警告提示用户改用 `E::..`,因为上游新增构造器后, 只有 `E::..` 能收到通知

### 管道表达式改进

`lhs |> x => {...}` 右侧的匿名函数体支持调用异步函数:

`.mbtx 脚本`

```moonbit
import {
  "moonbitlang/async@0.21.3",
}

async fn main {
  let result = 21 |> value => { @async.sleep(1); double(value) }
  println(result) // 42
}
```

### 切片 `a[i:j]` 改进

切片 `a[i:j]` 改为自动限制边界的视图(clamped view),切片范围会限制在有效边界内。

```moonbit
fn main {
  let values = [10, 20, 30]
  let middle = values[1:10] // 实际范围是  [1:3] ,包含  20 、 30
  println(middle.length()) // 2
  println(middle[0]) // 20
  println(values[5:10].length()) // 0 ,得到空视图
}
```

这里的主要动机是 `a[i:j]` 确保不会在运行时 crash,包括对 String 取视图时使用位于 UTF16 surrogate 边界上的非法下标的情况。如果需要使用之前可能会 crash 版本的取视图操作,需要使用新加的 `exact_view` API

### 改进未使用包的警告。下列两种情况现在会收到警告:

- 显式 `import` 了 `moonbitlang/core` 中的包但没有使用

- 没有通过 `@xxx.xxx` 的形式显式使用一个 `import`,仅通过调用方法等形式间接地使用了 `import` 的包的内容

这两种情况里,`import` 都是不必要的,但之前编译器不会给出警告。现在编译器能对这两种情况也给出警告了。例如,普通包中的以下配置和代码会使 `moon check` 报告 `unused_package`,删除未使用的 math 导入即可消除警告。

```moonbit
import {
  "moonbitlang/core/math", // 本包没有使用它,可删除此导入
}
```

```moonbit
fn main {
  println("Hello, MoonBit!")
}
```

### 针对 `var x = 10` 的错误恢复改进

改进对 var 声明(含类型标注)的诊断,识别后给出警告,提示改用 `let mut` 。

```moonbit
fn main {
  var count = 0 // 警告:改用  let mut
  count += 1
  println(count)
}
```

### Deprecate 在 JavaScript FFI 边界上使用 `Array`

后续版本中会调整 MoonBit `Array` 在 JavaScript 后端的 ABI,不再保证其等价于 JavaScript 后端的 `Array`,所以在 FFI 边界上使用 `Array` 被 deprecate 了,需要使用 `FixedArray` 替代

## 工具链更新

### Moon 与运行时

- 新增 `moon search`,用于查询包,比如 `moon search 'html markdown'` 可以用于查找和 html markdown 相关的包

- 新增 `moon view`,用于查看包的版本、某位用户发布的包等信息,如 `moon view --my` 或 `moon view moonbitlang/async --versions`

- 新增 `moon deprecate`,用于标记某个包为弃用;暂不支持对特定版本进行处理

- `moon tree [--json]` 输出模块外部依赖,`moon tree --package [--json]` 输出包依赖

- `moonx` 将聚焦 Wasm 后端执行,`--target native` 已被废弃

- `moonx` 执行策略支持按命令前缀生成进程

- `moonx` 执行策略可在 `moonx` 调用之间继承

- `moonx` 支持运行 `.mbtx` 文件

- `.mbtx` 文件实验性支持在文件头声明所需权限,并由运行时限制,如:

```moonbit
// policy:
//   fs:
//     read: []

///|
import {
  "moonbitlang/async@0.21.3",
  "moonbitlang/async@0.21.3/fs",
}

///|
async fn main {
  // Following operation will be rejected
  println(@fs.read_file("input.txt").text())
}
```

- `moon runwasm` 已被废弃

- 实验性预构建脚本支持 `.mbtx`,并增加脚本可接收的环境变量;原有的通过 stdin 方式的输入将会移除

- 实验性预构建脚本限制在 native 后端运行。

### 编辑器支持

- 语言服务支持在同一工作区中同时处理多个后端。

- `moon ide` 支持 `.mbtx` 文件,并修复脚本同级目录存在 `moon.pkg` 时导入别名可能被覆盖的问题。

## 标准库更新

### `moonbitlang/core`

- QuickCheck 增加无偏随机数生成支持,改进标量 `Arbitrary` 的生成范围和边界值覆盖; `BigInt` 生成器不再局限于 64 位,可以生成更大范围的数值及常见边界值,并补充收缩器的统一入口。

- 新增 `derive(Shrink)`,可自动生成反例收缩逻辑,帮助找到更小、更简单的失败用例;当前尚不支持基于子项的收缩。

- 为 `BigInt` 增加使用宽位算术的 native 和 wasm1 后端实现;修复 `immut/vector` 中的多个溢出问题。

- 调整 `Array` 的遍历与清理行为:遍历时先取得底层缓冲区; `pop` 、`truncate` 、`clear` 等操作先调整长度,原槽位仍可能保留元素引用。新增 `fill_unused`,可通过填充默认值释放这些引用。

- 增加百分号编码辅助函数,将字符编码为 %XX 形式。

### moonbitlang/x

- 补全并优化 `crypto` 。

- 新增 `jwt` 包,支持 HS256 编码和解码。

- 新增密码哈希包 `bcrypt` 。

- 统一 Unicode 实现到 `moonbitlang/x/unicode`,旧 API 标记为弃用。

### `moonbitlang/async`

`moonbitlang/async` 目前最新版本为 0.22.1，自上次月报（0.21.0）以来的主要更新有：

- [breaking] 取消语义调整。之前,当一个异步任务被取消时,它会收到一个特殊的 `suberror` 作为信号,以便被取消的代码进行清理。现在,取消信号不再是一个 `suberror`,而是通过特殊的编译器原语实现,相比 `suberror`:

  - 新的取消信号依然会像错误一样,自动向上传播

  - 取消信号可以触发 `defer` 与 `errdefer`

  - 新的取消信号不能被 `catch` 捕获

用户代码的迁移方式可参考 [https://github.com/moonbitlang/async/releases/tag/v0.22.0](https://github.com/moonbitlang/async/releases/tag/v0.22.0)

- [breaking] `@async.is_cancellation_error` 现在只会返回 `false` 且被废弃。因为取消信号不再是一个特殊错误了。对于使用了 `@async.is_cancellation_error` 来特殊处理取消信号的 `catch`,如果取消相关的分支的作用是跳过对取消信号的处理,可以直接删除对应分支。否则,可以使用 `@async.handle_cancellation` 来对取消信号进行特殊处理

- 一些 API 获得了更精确的类型。由于取消不再是一个特殊错误,在类型层面,可取消与 `raise` 也不再绑定了。在最新版本中,`async` 函数默认都是可取消的,只有显式添加了 `nocancel` 标记的异步函数,例如 `@async.protect_from_cancel`,才是不可取消的。同时,一些自身不会抛出错误但可以被取消的异步函数,例如 `@async.sleep`,现在可以在签名里写上 `noraise` 了

- [breaking] `@async.TaskGroup::add_defer` 现在要求传入的回调函数必须是 `nocancel` 的

- `@async.with_cancellation_handler` 被废弃,由一个新的 API `@async.handle_cancellation` 替代。`@async.handle_cancellation` 会运行一个异步的回调函数(运行时这个异步函数依然是可取消的),并在回调函数被取消时返回 `None` 。它可以用于对取消进行特殊处理。 需要注意 `@async.handle_cancellation` 不能撤掉当前任务被取消的状态。即使捕获一次取消信号,当前任务后续的可取消异步操作依然会被马上取消

- `@fs.remove` 和 `@fs.rmdir` 变为不可取消(`nocancel`)

- `@socket.TcpServer(..)` 新增了 `reuse_port_lb?: Bool = false` 选项,开启后该 TCP 服务器可以和其他服务器共享同一个监听地址,内核会自动在共享同一个端口的服务器间进行负载均衡。该选项仅支持 Linux,在其他操作系统上会被无视

- 新增了 `@async.platform`,可以用于在运行时判断当前操作系统。由于同一份 Wasm 二进制可以在不同的操作系统上运行,对于 Wasm 后端的程序,当前操作系统只能在运行时获得, 无法在编译期判断

## 生态与开发工具更新

### mooncakes.io 包管理服务

- 搜索服务正式上线,加入包摘要索引和已有包的预索引。

- 支持通过 `moon deprecate` 弃用模块,网站会展示弃用状态及原因。

- 改进构建队列的构建速度。

### SeekMoon

- 增加 web search 和 mbtx 工具。mbtx 工具允许智能体在沙箱中运行 mbtx 脚本。改进了 edit 工具失败时的错误报告。

- 增加了 SSE 断流时候的重试功能,减少网络波动导致的智能体运行中止。

- 集成了基于 MoonBit token 和 AST 的 diff 算法,支持忽略测试和注释差异。支持块级别的跳转和标记为已查看。增加 Git 提交历史。

- 支持将 `.mbti` 渲染为 SVG,以及从 `moon.mod` 展示项目依赖图。

- 集成 rg 文本搜索和 moongrep 搜索。moongrep 查询 pattern 可通过 AI 修复。

- 增加右键菜单,Cmd+W 关闭标签,改进选中文本高亮,以及字体等 UI 上面的改进。

- 改进 Windows 支持。

- `cmd/openseek` 支持在 Wasm 上运行。

### Rabbita 与全栈开发

提供网页、桌面与后端的 MoonBit 全栈模板,调试和打包开箱即用,无需 Makefile 或其他语言脚本:[https://github.com/moonbit-community/fullstack-moonbit](https://github.com/moonbit-community/fullstack-moonbit)。

### Proton

- 桌面端开发框架 proton 以 Apache 2.0 协议开源 [https://github.com/moonbit-community/proton](https://github.com/moonbit-community/proton)

- 现已支持国际化、应用图标角标、右键菜单及无障碍。

### Moonback

Web 后端框架 Moonback 现以 Apache 2.0 协议开源,并移动到 moonbitlang/moonback。 mooncakes.io 网站后端现在 powered by moonback。

### cli 命令工具

`cli/<cmd>` 在 mooncakes 发布,收录 moonbit-jq 已迁移的命令,并持续迁移常用命令、完成跨平台验证;0.1.2〜0.1.4 更新补齐常用参数,修复与上游工具不一致的行为。

### `moonbit-community/sqlite3`

增加实验性的异步支持,包括 native 和 wasm 后端
