# 20260819 MoonBit v0.10.9

对应 moonc 版本：`v0.10.9`

## 语言更新

- `with` pattern 现在要求使用 `with` 的分支显式加上括号，便于读者理解 `with` pattern 的优先级。可以使用 `moon fmt` 自动迁移：

    ```moonbit
    fn main {
      let a = Some("hello")
      match a {
        Some(x) | (None with x = "") => println(x)
        //        ^~~~~~~~~~~~~~~~~~ 需要加上括号
      }
    }
    ```

- bitstring pattern 支持 `v128le`，可以从字节序列中一次提取 16 个字节，构造成一个 `V128` 值。目前只支持以字节为单位的小端序，即输入的第 0 个字节对应结果的最低位字节：

    ```moonbit
    fn main {
      let bits = Bytes::makei(16, i => i.to_byte())
      guard! bits is [v128le(bits), ..]
      println(bits) // 输出 V128(0x0706050403020100, 0x0f0e0d0c0b0a0908)
    }
    ```

- `lexscan` 正式进入稳定状态。

    - `lexscan` 支持 `@lexbuf.Lexbuf`、`@lexbuf.AsyncLexbuf` 和 `@lexbuf.StringScanner`。其中 `Lexbuf` 和 `AsyncLexbuf` 采用流式模式；我们优化了它们的内存占用，可以放心用于无限流。

    - 此前作用于 `String`/`StringView` 的 `lexscan` 已迁移为 `lexmatch` 关键字。

    - 现在，当 catch-all 分支明确不可达时无需再添加；编译器也会对不可达分支报告警告。

    ```moonbit
    ///|
    async fn wordcount(
      input : @lexbuf.AsyncLexbuf,
      lines : Int,
      words : Int,
      chars : Int,
    ) -> (Int, Int, Int) {
      lexscan input {
        re"^\n" => wordcount(input, lines + 1, words, chars + 1)
        re"^[^ \t\r\n]+" as word =>
          wordcount(input, lines, words + 1, chars + word.length())
        re"^." => wordcount(input, lines, words, chars + 1)
        re"^" => (lines, words, chars)
      }
    }

    ///|
    async fn main {
      let utf8_reader = Utf8Reader(() => @stdio.stdin.read_some())
      let lexbuf = @lexbuf.AsyncLexbuf::from_fn(() => utf8_reader.read())
      let (lines, words, chars) = wordcount(lexbuf, 0, 0, 0)
      println("lines: \{lines}, words: \{words}, chars: \{chars}")
    }
    ```

    具体请参考文档：

    - https://docs.moonbitlang.com/en/latest/language/fundamentals.html#lexmatch
    - https://docs.moonbitlang.com/en/latest/language/fundamentals.html#lexscan

- 引入了新的 `errdefer` 语法：

    ```moonbit
    errdefer expr
    rest
    ```

    如果 `rest` 抛出了错误或者作为一段异步代码被取消了，`errdefer` 就会被触发，执行 `expr`，然后把错误继续向上抛出。`errdefer` 对于构造器类的函数尤其实用，例如：

    ```moonbit
    async fn connect_to(addr : @socket.Addr) -> Tcp {
      let socket = make_tcp_socket()
      errdefer socket.close()
      connect_socket(socket)
      socket
    }
    ```

    当 `connect_to` 成功返回时，`socket` 的所有权会随返回值转移至调用方，因此当前作用域无需释放该资源。若 `connect_socket(socket)` 执行失败或被取消，`socket` 会被丢弃，此时若不释放 `socket`，就会导致资源泄漏。`errdefer` 适用于此类仅在错误路径上执行清理的场景，可用于确保资源得到可靠释放。

    使用 `return`/`break`/`continue` 跳出 `errdefer` 的范围不会触发 `errdefer`。和 `defer` 一样，`errdefer` 是结构化的：它只会在程序离开整个 `errdefer` 表达式的范围时触发。所以，下面的程序是错误的：

    ```moonbit
    let result = []
    for x in xs {
      let res = make_resource(x)
      errdefer res.close()
      do_something_with_res(res)
      result.push(res)
    }
    result
    ```

    这里，每个 `errdefer` 仅在其所在的单次循环作用域内有效。第一次循环正常结束后，对应的 `errdefer` 即不再生效。当后续循环发生错误时，只会执行当前循环对应的清理逻辑，此前循环中已成功创建的资源无法得到释放，进而导致资源泄漏。正确的写法是：

    ```moonbit
    let result = []
    errdefer result.each(res => res.close())
    for x in xs {
      let res = make_resource(x)
      do_something_with_res(res)
      result.push(res)
    }
    result
    ```

- `defer` 和 `errdefer` 支持 `raise` 与 `async`。之前，`defer expr` 的 `expr` 中不能抛出错误或调用异步代码。这一限制现在已被解除。如果 `defer`/`errdefer` 中抛出错误，新的错误会替代旧的错误。有多条 `defer`/`errdefer` 语句时，如果其中某处 `defer`/`errdefer` 抛出了错误，剩下的 `defer`/`errdefer` 依然会按顺序执行，不会被丢弃。

- 新增将 `catch` 迁移至 `defer`/`errdefer` 的警告。

    目前，在 `moonbitlang/async` 中，被取消的异步程序会抛出一个特殊的错误作为被取消的信号，以方便被取消的程序释放资源。但这个特殊错误有可能被意外捕获、转换，从而导致程序在被取消时出现错误。未来，我们计划不再使用特殊错误来表示取消信号，并让 `catch` 不再捕获取消信号。但如果程序依赖于 `catch` 来执行资源清理，这一改动会导致程序在被取消时无法正确释放资源。因此，我们引入了 `errdefer` 并解除了 `defer` 的副作用限制，以保证几乎所有资源释放代码都可以用 `defer`/`errdefer` 表达（取消信号未来也依然会触发 `defer` 和 `errdefer`）。

    为了帮助用户迁移现有的、基于 `catch` 的资源释放代码，我们提供了一个新的警告 `fragile_catch_all`。它会识别可能可以改写成 `defer`/`errdefer` 的 `catch` 表达式，并给出警告提示用户迁移。除了在未来能正确处理异步取消之外，`defer`/`errdefer` 本身相比 `catch` 也更加可读和健壮。

    这一新警告可能会出现误报的情况。如果发生了误报，可以通过 `#warnings("-fragile_catch_all")` 对当前函数临时关闭警告。

- `guard` 现在会进行完备性检查，对于不完备的 pattern 会报警告。对于希望使用之前的 `guard` 无法匹配则 panic 的语义的用户应该迁移到 `guard!` 来更加明确地表达自己的意图。

    ```moonbit
    fn main {
      let string = Some("content")
      guard string is Some(content)
      //    ^~~~~~ Warning (guard_inexhaustive):
      //               This `guard` pattern is not exhaustive and will panic when
      //               it does not match. Missing cases:
      //               None
      //               To fix: add an `else { ... }` clause after the condition to
      //               handle those cases, or write `guard!` if the panic is intended.
      guard! string is Some(content) // 推荐的新写法
      println(content)
    }
    ```

- 支持 labelled block，给代码块加上标签后,块内可以用 `break` 携带一个值提前退出,该值就是整个块的求值结果。

    ```moonbit
    fn absolute(n : Int) -> Int {
      result~: {
        if n < 0 {
          break result~ (-n)
        }
        n
      }
    }
    ```

    Labelled block 不存在匿名形式：不带 label 的 `break` 始终以最近的循环为目标，而不会作用于某个 block。为了避免阅读代码时的歧义，**直接出现在 labelled block 内的不带 label 的 `break` 会被视为错误**，即使外层存在可作为跳转目标的循环。此时必须显式指定 label，以明确需要退出的控制流层级。

    ```moonbit
    fn f() -> Int {
      for ;; {
        label~: {
          break 1
    //    ^^^^^^^ An unlabelled `break` is not allowed directly inside a labelled block.
        }
      }
    }
    ```

- 增加了新的保留字 `nocancel`

- `#warnings` 现可作用于语法警告。此前，它仅支持屏蔽类型检查阶段的警告，`deprecated_syntax` 等语法警告不受影响。现在，`#warnings` 已可局部屏蔽大多数警告，包括语法警告；部分跨顶层定义的警告和词法警告仍不支持。

## 工具链更新

- 默认后端改为 wasm

- 现在 `moon prove` 只需要用户安装至少一个支持的求解器 (Z3 / Alt-Ergo / CVC5) 即可直接使用，不再需要单独安装 Why3。相应的, 现在 Why3 的 `data-dir` 和 `lib-dir` 不支持通过环境变量指定，始终读取 `~/.moon/share/why3/` 和 `~/.moon/lib/why3/`。

- 现在可以通过 `moonx username/example[@version]` 的方式来执行 mooncakes.io 上面的 WASM executable （默认以 WASM 后端执行，可以通过 `--target native` 的方式以 native 后端执行）：

    ```bash
    $ moonx moonbit-community/moongrep
    error: the following required argument was not provided: 'subcommand'

    Usage: moongrep <command>

    Scan MoonBit source files with structural and taint rules.

    Commands:
      scan  Scan MoonBit source files.
      lint  Scan MoonBit source files with embedded builtin rules.
      docs  Print embedded moongrep documentation.
      dump  Parse a MoonBit impl or expression and print untyped_ast debug output.
      help  Print help for the subcommand(s).

    Options:
      -h, --help  Show help information.
    ```

- 支持 `.moonignore` 文件

    - 之前如果用户需要显式指定某些文件是否应包含在通过 `moon publish` 发布到 mooncakes.io 的模块中，需要通过 `.gitignore` 配合 `moon.mod` 中的 `exclude` 和 `include` 字段来配置，修改起来不方便。

    - 现在打包时遵守通行的 ignore 文件规则：使用文件夹中的 `.moonignore`，若不存在则使用 `.gitignore`。

    - 默认忽略以 `.` 开头的文件和文件夹（可通过 ignore 文件覆写规则），以及 `_build` 文件夹（不可覆写规则）。

    - `exclude` 和 `include` 字段将被废弃。

- mooncakes.io 现已禁止上传仅大小写不同的包。此前，如 `user/pkga` 与 `user/pkgA` 这样的包可以同时存在，但可能在大小写不敏感的平台上产生冲突，因此现在会对这类包名进行限制。

## 标准库更新

- `moonbitlang/core`

    - QuickCheck 更新

        - 支持 `@qc.check` （失败会 raise 一个错误，成功则不打印其他东西） 和 `@qc.report` （返回结构化的测试报告）两种主要测试函数，用户可以传递函数 `(A) -> Bool raise?` 来进行基于属性的测试

        - 可以向测试函数传递 `filter?: (A) -> Bool` 参数来过滤 Generator 一些不满足要求的值，利用参数 `discard_ratio` 可以控制测试在丢弃多少比例的时候会失效

        - `@qc.Generator[T]` 类型和相关的函数提供了一套常用的组合子，可用于辅助构建 `Arbitrary` 实例

        - `core/quickcheck/shrink` 包提供了大部分常用类型的 Shrinker （收缩器），可在找到反例的时候进行收缩，以寻找更小更简单的反例

        - 支持统计分析功能，可以通过 `observe?` 参数给 check / report 传递一个观测组合 `(A) -> Observation`，其中 `Observation` 可以使用如下函数构造：

            - `@qc.label(val: String)` 标注一个字符串标签

            - `@qc.classify(cond: Bool, val: String)` 在条件 `cond` 成立的时候打上标签 `val`

            - `@qc.collect(val : T)` 把一个值的 Debug Repr 作为标签

        - 更多具体细节可以参考文档：https://mooncakes.io/docs/moonbitlang/core/quickcheck

    - 新增 `moonbitlang/core/diff` 包

        - 提供 Myers 和 Patience 两种通用的序列 diff 算法。用户可以通过 `@diff.Diff(old~, new~).edits()` 获取两个序列的编辑脚本。

        - 提供多个计算不同序列编辑距离的函数，如 `edit_distance(ArrayView[T])`、`edit_distance_str(StringView)`，以及对应的限制最大编辑距离的版本。

    - 新增 `moonbitlang/core/lexbuf` 包，提供 `StringScanner`、`Lexbuf` 和 `AsyncLexbuf`，以配合 `lexscan` 使用。

        - `StringScanner`：基于 `String` 的同步扫描器，由 `lexscan` 维护扫描器上的 `cursor` 字段。

        - `Lexbuf`/`AsyncLexbuf`：流式扫描器，由 `Lexbuf::from_fn` 定义数据源，并在 `lexscan` 过程中自动补充数据。两者的区别是，对 `AsyncLexbuf` 执行 `lexscan` 的整个表达式需要异步上下文。

    - `immut/array` 包已弃用很长一段时间，现在正式移除，应改用 `immut/vector`。

    - `@debug.to_repr(x)` 弃用，可改用 `@debug.Repr(x)`。

- `moonbitlang/async` 目前最新版本为 0.21.0，自上次月报（0.20.2）以来的主要更新有：

    - **[breaking]** `@http` 包中，HTTP headers 的类型从 `Map[String, String]` 变成了大小写不敏感的 `type @http.Headers = Map[@http.CaseInsensitiveString, String]`，因此构造和读取 HTTP header 时不再需要手动注意大小写问题。`@http.CaseInsensitiveString` 可以从 `String` 隐式构造，因此直接使用 `Map` 字面量构造 header 和读取 header 的代码无需修改。但对 header 写了类型标注的代码需要将类型改为 `@http.Headers`

    - **[breaking]** `@fs.open` 等 API 的 `create` 和 `truncate` 参数已被废弃一段时间，由 `create_mode` 和 `permission` 代替。这次更新中，`create` 和 `truncate` 被正式移除。此外，`@fs.write_file` 和 `@process.redirect_to_file` 的默认 `create_mode` 从 `OpenExisting` 变成了 `CreateOrTruncate`。`@fs.open` 的默认 `create_mode` 则依然是 `OpenExisting`

    - **[breaking]** `@async.protect_from_cancel` 的默认行为变为 `resume_on_cancel=true`，`resume_on_cancel=false` 选项被废弃。未来只会有 `resume_on_cancel=true` 的行为

        `protect_from_cancel(resume_on_cancel=false)` 在被取消时，会保证内部的代码完整运行，然后丢弃其结果并抛出取消信号。这里被丢弃的结果可能导致资源泄露，因此是不安全的

        对大部分用户的代码来说，这一行为变动不会产生实质性的影响

    - `moonbitlang/async` 现在会在程序陷入死锁状态（例如两个任务互相等待）时，自动检测到死锁并强行终止程序，防止事件循环无限空转。可以通过 `@async.set_deadlock_handler` 控制死锁时的行为或是关闭死锁检测

    - 之前，`moonbitlang/async` 必须在主线程中运行自己的事件循环，因此无法与其他外部事件循环，例如 GUI 框架自带的事件循环整合。本次更新新增了 `@async.set_external_event_loop` API，可以用于设置一个外部事件循环。`moonbitlang/async` 会将自己的事件循环运行在单独的线程里，并和主线程的外部循环整合。所有 MoonBit 代码依然会运行在主线程里。关于外部事件循环的实现需要为 `moonbitlang/async` 提供哪些 API，详见 `@async.set_external_event_loop` 的文档

    - 新增了 `@process.pipe` API，可以用于将一个子进程的输出重定向到另一个子进程的输入

    - `@process.read_from_process` 和 `@process.redirect_to_file` 新增了 `shared? : Bool = false` 参数。如果 `shared=true`，用于重定向的输出管道可以被同时传给多个子进程，但必须在最后一个子进程启动后通过 `.close()` 手动关闭。如果 `shared=false`（默认行为，和之前相同），用于重定向的输出管道只能被传给一个子进程（但可以同时传给同一个子进程的 `stdout` 和 `stderr`），不过无需手动关闭

    - 新增辅助函数 `@http.request`，可以用于执行任意方法的单次 HTTP 请求

    - Wasm1 后端新增了 `@websocket` 和 `@fs.realpath` 支持，现已支持除 `@fs.Watcher` 外的所有功能

    - 在 Linux/macOS 上，当子进程被某个信号终止，而非正常退出时，`@process.run` 等 API 能识别这种情况并返回 `-signal`

    - 当一个 `async fn main` 程序被信号取消时，之前 `async fn main` 会在程序释放完资源后以 `128 + signal` 作为返回值退出（bash convention）。但这一行为对父进程来说是有歧义的。现在，`async fn main` 在被信号取消时，会在程序完成清理后，重新模拟出当前进程被信号强制中止的状态作为程序的退出状态

- `moonbitlang/x`

    - 弃用了 `moonbitlang/sys`，应该改用 `moonbitlang/core/env`

    - `moonbitlang/x/path` 现在可以在浏览器环境正常使用，Windows 的路径比较现在可以正确处理非 ASCII 且有大小写形式的字符。

    - `moonbitlang/x/rational` 现在不会出现溢出误判和分母零问题。
