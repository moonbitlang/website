---
description: "MoonBit 0.8.0 正式发布，带来语言、工具链与 AI 工作流的关键升级。"
slug: moonbit-0-8-0-release
image: /img/blogs/zh/2026-02-09-moonbit-0-8-0-release/cover.jpg
tags: [MoonBit]
---

# MoonBit 0.8.0发布

![](./cover.jpg)


我们很高兴正式发布 MoonBit 0.8.0。
MoonBit是一门AI原生的编程语言，它的主要特点是**高可靠，易读和高性能**。0.8 版本是MoonBit 迈向稳定、可用于生产环境的重要里程碑版本。

这次发布并非一系列零散改动的简单集合。MoonBit 0.8 标志着项目从实验性语言，明确迈入工程级语言与工具链阶段：在调试能力、错误处理、包管理以及开发者工具等方面都有了显著提升，尤其更适合支撑大规模代码库和以 Agent 为核心的开发工作流。

## 为什么 MoonBit 0.8 很重要？

正如许多开发者所观察到的，Rust 通过其严格的语义和可验证性，为 AI 辅助开发提供了坚实的基础。MoonBit 在继承类似可靠性目标的同时，更加注重 显著更快的编译速度（在实际使用中通常比rust快一个到两个数量级），以及 面向 Agent 工作流深度集成的开发工具体系。

随着 0.8 版本的发布，这些设计目标已不再停留在抽象理念层面，而是 在语言、编译器、运行时以及 IDE 等各个层面得到一致体现。

## 0.8版本重点更新：
**WasmGC/LLVM/Native 后端 Backtrace 支持**

  MoonBit 的 wasmGC/native/LLVM 后端现支持在程序崩溃时，自动打印崩溃处的调用栈。并且能直接输出对应的 MoonBit 源码的位置，极大改善了调试体验（以下是Native后端的调用栈示例）：
  ```plain text
  RUNTIME ERROR: abort() called
  /path/to/moonbitlang/core/array/array.mbt:187 at @moonbitlang/core/array.Array::at[Int]
  /path/to/pkg/main/main.mbt:3 by @username/hello/out_of_idx.demo
  /path/to/pkg/main/main.mbt:9 by main
  ```

**AI 原生的面向 specification 支持**

  MoonBit 新增了 `declare` 关键字，可以用于声明需要实现的类型、函数、方法等。如果 `declare` 的声明没有对应的实现，MoonBit 编译器会报一个警告。declare 关键字提供了面向 AI 的原生 specification 支持：可以用 `declare` 的形式指定需要 AI 实现的接口，并根据接口提前编写测试。只需要把 `declare` 和测试所在的文件标记为只读，就能防止 AI “作弊”。随后，MoonBit 编译器的警告信息能辅助 AI 正确地实现所有必要的接口。由于没有实现 `declare` 只是一个警告，AI 可以渐进式地编写、测试代码。

**社区动向**
- MoonBit 社区正在在快速增长，目前核心用户数接近**20万**（以VS Code+Open VSX 为统计指标），生态包的数量达到 **4295** 个，并且最近几周增速都超过 10%。
- MoonBit 软件工厂受到关注：[《Cursor 浏览器翻车后，这个团队做出AI规模化高可靠软件工厂》](https://mp.weixin.qq.com/s/K07k8F-WatoHkqljBGj_dA)，我们正在发起 [「MoonBit 大型软件合成挑战赛」](https://www.moonbitlang.cn/2026-scc)，期待社区用户可以做出优质的大型软件。
- 我们持续招募 MoonBit 大使，特别期待拥有多语言背景的国际地区大使。

## MoonBit 0.8 完整技术更新一览
### 语言更新
1. `suberror Err PayloadType` 语法被废弃，用户需要将这种定义修改成类似 enum 的形式：

    ```moonbit
    suberror Err {
      Err(PayloadType)
    }
    ```
    这一改动的动机是 `suberror Err PayloadType` 语法容易产生 `Err` 和 `PayloadType` 有相同 ABI 的误解，但实际上 error type 都有自己特殊的 ABI。这一改动可以通过 `moon fmt` 自动完成迁移。

2. 废弃了推导内建 error 构造器（目前主要是 `Failure`）的行为。

    类型未知时，需要将 `raise Failure(..)` 替换成 `raise Failure::Failure(..)`，`catch` 时同理。

3. 支持了在 MoonBit 中直接调用 `FuncRef[_]` 类型的值。
这一功能可以用于在 native 后端实现动态加载函数或 JIT。

4. WasmGC/LLVM/Native 后端 Backtrace 支持：现在，使用wasm-gc，native后端或者llvm后端时，如果触发panic，例如数组下标越界，对为`None`的`Option[T]`进行`unwrap`，`try!`一个会抛出错误的函数，或者手动调用panic函数时，在debug模式下会打印出调用栈，例如下方的函数：
    ```moonbit
    fn demo(a: Array[Int], b: Array[Int]) -> Unit {
      let _ = a[1]
      let _ = b[2]
    }
    ```moonbit
    fn main {
      let a = [1, 2]
      let b = [3]
      demo(a, b)
    }
    ```
    以native后端为例，使用`moon run main --target native`，将会看到下面的调用栈：
    ```plain text
      RUNTIME ERROR: abort() called
      /path/to/moonbitlang/core/array/array.mbt:187 at @moonbitlang/core/array.Array::at[Int]
      /path/to/pkg/main/main.mbt:3 by @username/hello/out_of_idx.demo
      /path/to/pkg/main/main.mbt:9 by main
    ```
    注：目前Windows系统上native和LLVM后端暂不支持此项功能。

5. 新增了 `declare` 关键字，用于替代原本的 `#declaration_only` 属性。`declare` 新增了 trait 实现的支持。比如：
    ```moonbit
    declare type T // declare a type to be implemented
    declare fn T::f(x : T) -> Int // declare a method to be implemented

    struct S(Int)
    declare impl Show for S // declare an impl relation
    ```
    `declare impl` 和直接写 `impl` 的主要区别在于 `declare impl` 在缺少 implementation 的情况下只会报警告，不影响代码执行，所以可以跑其他功能的测试。

6. 新增了反向的 range 表达式 `x>..y` 和 `x>=..y`，用于在 `for .. in` 循环中进行反向的迭代：
    ```moonbit
    ///|
    test "reversed range, exclusive" {
      let result = []
      for x in 4>..0 {
        result.push(x)
      }
      debug_inspect(result, content="[3, 2, 1, 0]")
    }

    ///|
    test "reversed range, inclusive" {
      let result = []
      for x in 4>=..0 {
        result.push(x)
      }
      debug_inspect(result, content="[4, 3, 2, 1, 0]")
    }
    ```
    为了让语法更一致，正向的两侧闭合的 range 表达式的语法从 `x..=y` 迁移至 `x..<=y`。这一改动可以通过 `moon fmt` 自动迁移。

7. 禁用了在外部使用 `{ ..old_struct, field: .. }` 语法更新一个带有 `priv` 字段的结构体的行为。

8. `lexmatch` 表达式 first match 下新增 guard 支持。
  包含 guard 的 lexmatch 性能会有损失，因此推荐在快速开发过程中使用，之后再考虑是否改写。其语法和 match 表达式中的 guard 一致，可查看 https://github.com/moonbitlang/lexmatch_spec 了解更多：
    ```moonbit
    lexmatch input {
      ("#!" "[^\n]+") if allow_shebang => ...
      ...
    }
    ```
9. `struct` 新增了自定义构造器的支持，语法如下：
    ```moonbit
    struct S {
      x : Int
      y : Int

      // 为 `struct` 声明一个构造器
      fn new(x~ : Int, y? : Int) -> S
    }

    // 实现 `struct` 的构造器
    fn S::new(x~ : Int, y? : Int = x) -> S {
      { x, y }
    }

    // 使用 `struct` 的构造器
    test {
      let s = S(x=1)
    }
    ```
  语义上：
  - `struct` 中声明 fn new 即可给这个 `struct` 定义自动构造器。除了必须返回 `struct` 自身之外，自定义构造器的签名没有其他限制。可以使用 optional argument、抛出错误等。`struct` 中的 `fn new(..)` 的参数不能写默认值，但可以省略参数名字
  - 对于有类型参数的 `struct`，`fn new `可以特化类型参数，也可以给类型参数添加 `trait` 约束。语法和普通的顶层函数声明一样
  - 如果在 `struct` 中声明了 `fn new`，则必须定义一个方法 `fn S::new` 来实现这个构造器。S::new 的签名必须和 `struct` 中的 `fn new` 完全相同
  - 使用 `struct` 构造器的方式和使用一个 `enum` 构造器完全一样。比如，在类型已知的时候，可以直接写 `S(..)`，无需写成  `@pkg.S(..)` 或者 `@pkg.S::S(..)`。不过，`struct` 的构造器不能用于模式匹配
  - `struct` 构造器的可见性和 `struct` 字段相同。也就是说，`pub struct` 和 `pub(all) struct`的构造器可以在当前包外调用，`struct` 和 `priv struct` 的构造器则是私有的。

10. `using` 声明上现在可以添加 `#deprecated` 标注来废弃 `using` 创建的别名。

11. 增加了 `Debug` 特征和自动 derive 相关支持。 Debug 特征是Show 特征的改进版本，用于提供更结构化和可读的打印信息。
    ```moonbit
    ///|
    struct Data {
      pos : Array[(Int, Int)]
      map : Map[String, Int]
    } derive(Debug)

    ///|
    test "pos" {
      debug_inspect(
        {
          pos: [(1, 2), (3, 4), (5, 6)],
          map: { "key1": 100, "key2": 200, "key3": 300 },
        },
        content=(
          #|{
          #|  pos: [(1, 2), (3, 4), (5, 6)],
          #|  map: {
          #|    "key1": 100,
          #|    "key2": 200,
          #|    "key3": 300,
          #|  },
          #|}
        ),
      )
    }
    ```
    `derive(Debug)` 支持额外的 ignore 参数，它接受一个或者多个类型构造器名。在实现类型本身的打印逻辑时，它会过滤语法上相同的类型构造器，相关部分将会打印成`...`。这在内部类型来自第三方包，并且没有提供 Debug 特征的实现时非常有用。
    ```moonbit
    ///|
    struct Data1 {
      field1 : Data2
      field2 : Double
      field3 : Array[Int]
    } derive(Debug(ignore=[Data2, Array]))

    ///|
    struct Data2 {
      content : String
    }

    ///|
    test "pos" {
      debug_inspect(
        { field1: { content: "data string" }, field2: 10, field3: [1, 2, 3] },
        content=(
          #|{
          #|  field1: ...,
          #|  field2: 10,
          #|  field3: ...,
          #|}
        ),
      )
    }
    ```
     `@moonbitlang/core/debug`包还提供了专门的`assert_eq(a,b)`，在断言失败时，找出 a 和 b 的差异并打印在命令行中。
  在未来我们将逐步迁移到`Debug`并弃用`derive(Show)`，Show 特征则专注于手动实现特殊的打印逻辑，如`Json::stringify`。

12. 移除了将带参数的构造器直接当作高阶函数使用的行为，如果需要把构造器用作高阶函数，需要写一个匿名函数：
    ```moonbit
    test {
      let _ : (Int) -> Int? = Some // 已被移除
      let _ : (Int) -> Int? = x => Some(x) // 正确的写法
      let _ : Int? = 42 |> Some // 管道不受影响
    }
    ```
    这一行为之前已通过警告的形式废弃。注意管道运算符右侧依然可以直接写构造器，不受影响 。

13. 废弃了 `fn` 上的副作用推导。
如果一个 `fn` 实际上可能抛出错误或者调用 `async` 函数，就必须加上 `raise` / `async` 标记，否则编译器会报一个警告。箭头函数语法 `(..) => ..` 不受影响。因此，未来对于回调函数类的匿名函数，建议使用箭头函数而非 `fn`。`fn` 可以在需要显式标注以改善可读性的时候使用

14. 调整了 `x..f()` 的语义，将其调整回最简单的语义：`x..f()` 等价于 `{ x.f(); x }`。
之前，`x..f()` 表达式的结果（`x`）可以被直接忽略。现在，编译器会对这种情况报一个警告，需要把最后一个 `..f()` 替换成 `.f()` 或者显式忽略结果。

15. 循环的 `else` 块关键字改为 `nobreak`，for/foreach/while 循环中此前可以用 `else` block 来写明在循环正常退出时的计算结果，为了更加直观，这一关键字被改成了 `nobreak`，比如：
    ```moonbit
    fn f() -> Int {
      for i = 0; i < 10; i = i + 1 {

      } nobreak {
        i
      }
    }
    ```
    这一改动可以使用 `moon fmt` 自动迁移。

16. 新增了一个默认关闭的警告 `unnecessary_annotation`，它会标记出代码中的结构体字面量和构造器上不必要的类型标注，即那些编译器可以通过上下文推断出正确的类型、无需显式指定类型的代码。

### 工具链更新
1. 正式启用 moon.pkg，在对 moon.pkg 进行了一段时间的测试和改进后，我们正式启用了 moon.pkg。旧的项目在执行 moon fmt 时将会被自动迁移到新的格式。新的项目也会直接使用 moon.pkg 作为包的配置。下面是常用配置的例子：
    ```moonbit
    import {
      "path/to/pkg1",
      "path/to/pkg2" @alias,
    }

    warnings = "+deprecated-unused_value"
    ```
     更多详细信息请见 moonbit 语言文档。
2. `moon test` 支持通过 `-j` 参数并行地运行测试。

3. `moon test` 支持通过 `--outline`列出所有待运行的测试。

4. `moon test --index`支持指定特定范围的测试（左闭右开），如`moon test --index 0-2`会运行前两个测试（`--index`需事先指定测试的文件）。

5. `moon install`支持从MoonBit 项目全局安装可执行程序"，因为 `moon check` 与 `moon build`都可以自动安装依赖。
  `moon install`的新行为类似 `cargo install` 或 `go install`，支持用户从包管理平台、git 源或者本地安装一个或多个二进制文件到全局（对应包需要支持 native 后端且 is-main 为 true），如：
    ```plain text
    moon install username/package (root 为 package 时)
    moon install username/cmd/main (安装某一个包)
    moon install username/... (前缀开始所有的包)
    moon install ./cmd/main (local path)
    moon install https://github.com/xxx/yyy.git (自动识别 git 链接)
    ```
    更多用法可以使用 `moon install --help`查看。

6. 现在可以在 moon.pkg 中配置`regex_backend`选项来指定 lexmatch 表达式的正则使用什么后端：
    ```moonbit
    options(
      // 默认为 "auto"，其他可选项分别为 "block", "table", "runtime"
      // auto 由编译器自主决定采用哪个后端
      // block 后端性能最好，但代码体积可能产生膨胀
      // table 后端生成查表解释执行的代码，兼顾代码体积和性能
      // runtime 后端生成依赖标准库中 regex_engine 的代码，在大量使用正则的情况下，能大幅减少生成的代码体积
      regex_backend: "runtime",
    )
    ```
7. `moon -C <path>`以前会从对应路径开始查找 MoonBit 项目，但是不会改变工作目录；这与一般构建系统传统不符。现在`moon -C <path>`会改为改变工作目录，并且需要出现在任何子命令或参数前；同时添加了`--manifest-path`指向`moon.mod.json`用于运行路径与源代码路径不同的情况.

8. `moon run` 和 `moon build` 默认使用 `--debug`。
9. 更新了 `.mbt.md` 文件在 front matter 声明依赖的形式。之前在 front matter 中只能声明 module dependency，并且会将被依赖的 module 中的 package 全部导入，这会导致无法更细粒度地写明 import 以及 package alias 会冲突的问题。在新版本中，front matter 声明依赖的形式改成了直接写明具体依赖的包，并且可以声明 alias，并且需要在 module 后面写明版本号，多次出现的 module 只需写一次版本号即可，对标准库的依赖不需要写版本号。
    ```yaml
    ---
    moonbit:
      import:
        - path: moonbitlang/async@0.16.5/aqueue
          alias: aaqueue
      backend:
        native
    ---
    ```
10. `moon new`简化了模板，更新了关于 skills 的简单介绍。
11. `moon fetch`提供了一个简单的获取已发布包源代码的方式，默认会保存至项目根目录或当前路径下的`.repos`，方便 Agent 阅读源代码学习使用方式。
12. `moon fmt`支持保留和折叠`{ statement1; statement2 }`语句之间的空行。例如：
    ```moonbit
    // 格式化前
    fn main {
      e()

      // comment
      f()


      g()
      h()
    }
    ```
    ```moonbit
    // 格式化后
    fn main {
      e()

      // comment
      f()

      g()
      h()
    }
    ```
13. ```moonbit  现在会被自动格式化成 ```moonbit nocheck
  在 *.mbt.md文件或者文档注释中，对于被设置为跳过检查的 ```moonbit  代码块，格式化器会自动加上更显式的 nocheck 标记 。

### 标准库和实验库更新
1. `moonbitlang/async` 改动：
  - 新增了 `@process.spawn`，可以直接在一个 `TaskGroup` 中创建一个外部进程，并获取该进程的 PID。`TaskGroup` 在默认状态下会等待该外部进程结束，在需要提前退出时会自动中止这个外部进程
  - 新增了 `@fs.File::{lock, try_lock, unlock}` 方法，提供文件锁的支持。普通的文件 IO 不受文件锁的影响
  - 新增了 `@fs.tmpdir(prefix~)` ，提供创建临时文件夹的支持
  - 新增了 `@async.all` 和 `@async.any`，语义类似 `Promise.all` 和 `Promise.any`
  - 在 `examples` 文件夹下新增了更多简单示例和对每个示例的介绍
2. `@json.inspect` 迁移至 `json_inspect`

### IDE 更新
1. 优化alias定义跳转：查找alias定义时，现在除了会显示alias定义的位置外，还会一并显示 alias target 定义的位置：
![alt text](./image-2.png)

2. `moon ide hover`：`moon ide`新增 `hover` 子命令，用于显示源代码中某个符号的类型和文档：
    ````plain text
    $ moonide hover -no-check filter -loc hover.mbt:14
    test {
      let a: Array[Int] = [1]
      inspect(a.filter((x) => {x > 1}))
                ^^^^^^
                ```moonbit
                fn[T] Array::filter(self : Array[T], f : (T) -> Bool raise?) -> Array[T] raise?
                ```
                ---

                Creates a new array containing all elements from the input array that satisfy
                the given predicate function.

                Parameters:

                * `array` : The array to filter.
                * `predicate` : A function that takes an element and returns a boolean
                indicating whether the element should be included in the result.

                Returns a new array containing only the elements for which the predicate
                function returns `true`. The relative order of the elements is preserved.

                Example:

                ```mbt check
                test {
                  let arr = [1, 2, 3, 4, 5]
                  let evens = arr.filter(x => x % 2 == 0)
                  inspect(evens, content="[2, 4]")
                }
                ```
    }
    ````
3. `moon ide rename`: `moon ide`新增 `rename` 子命令，用于生成符合codex apply_patch 工具格式的重命名patch，方便agent更准确快速地重构代码。例如：

    ```plain text
    $ moon ide rename TaskGroup TG
    *** Begin Patch
    *** Update File: /Users/baozhiyuan/Workspace/async/src/async.mbt
    @@
    /// and will result in immediate failure.
    #deprecated("use `async fn main` or `async test` instead")
    #cfg(target="native")
    -pub fn with_event_loop(f : async (TaskGroup[Unit]) -> Unit) -> Unit raise {
    +pub fn with_event_loop(f : async (TG[Unit]) -> Unit) -> Unit raise {
      @event_loop.with_event_loop(() => with_task_group(f))
    }

    *** Update File: /Users/baozhiyuan/Workspace/async/src/task_group.mbt
    @@
    ///
    /// The type parameter `X` in `TaskGroup[X]` is the result type of the group,
    /// see `with_task_group` for more detail.
    -struct TaskGroup[X] {
    +struct TG[X] {
      children : Set[@coroutine.Coroutine]
      parent : @coroutine.Coroutine
      mut waiting : Int
    @@
    pub suberror AlreadyTerminated derive(Show)

    ///|
    -fn[X] TaskGroup::spawn_coroutine(
    +fn[X] TG::spawn_coroutine(
    -  self : TaskGroup[X],
    +  self : TG[X],
      f : async () -> Unit,
    ...
    ```