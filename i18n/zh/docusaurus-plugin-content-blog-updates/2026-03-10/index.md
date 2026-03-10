# 20260310 MoonBit v0.8.3

## 语言更新

1. 使用 `#alias` 和 `#as_free_fn` 标记的函数，将不再继承不应该继承的属性，例如 `#deprecated`。现在，`#alias` 声明的别名和函数本体的各种属性都可以独立控制：

   ```moonbit
   // 本体和别名都不 deprecate
   #alias(g1)
   fn f1() -> Unit

   // 只 deprecate 别名
   #alias(g2, deprecated)
   fn f2() -> Unit

   // 只 deprecate 本体
   #alias(g3)
   #deprecated
   fn f3() -> Unit

   // 本体和别名都 deprecate
   #alias(g4, deprecated)
   #deprecated
   fn f4() -> Unit
   ```

2. `const` 声明支持了字符串拼接和字符串插值：

   ```moonbit
   const Hello : String = "Hello"
   const HelloWorld : String = Hello + " world"
   const Message : String =
     $|========
     $|\{HelloWorld}
     $|========
   ```

3. `for .. in` 循环支持了额外的循环变量：

   ```moonbit
   // 对数组 xs 求和
   for x in xs; sum = 0 {
     continue sum + x
   } nobreak {
     sum
   }
   ```

   利用这一新特性，`for .. in` 循环可以用函数式的方式维护额外状态，无需使用 `let mut`。

4. 废弃无方法 trait 被所有类型隐式实现的行为。之前，一个没有任何方法的 `trait` 会被所有类型隐式实现，无需显式写 `impl Trait for Type`。这一行为已被废弃，使用这种隐式实现时会收到警告。未来，这一行为将被彻底移除，届时所有 `trait` 都统一需要显式实现。

5. 废弃 `for { ... }` 无限循环的写法。之前，可以使用 `for { ... }` 来写一个没有终止条件的无限循环。现在需要将其改写为 `for ;; { ... }` 或 `while true { ... }`。这一改动可以使用 `moon fmt` 自动完成迁移。改动的动机是未来可能会为 `for .. in` 循环添加模式匹配支持，例如 `for (x, y) in array_of_tuple`，而 `for { .. }` 与 `struct` 或 `Map` 的模式语法存在冲突。

6. 无更新部分的 `for` 循环允许省略分号。`for i = 0; i < 10; { ... }` 这种没有更新部分的 `for` 循环，现在可以省略循环条件后的分号，写成 `for i = 0; i < 10 { ... }`。

7. 正式移除了当前包内的 `impl` 总是可以通过 `.` 调用的行为。在 MoonBit 中，只有当 `impl` 和类型定义在同一个包内时，`impl` 才可以通过 `x.f(..)` 语法调用。

8. FFI 参数未标注生命周期管理方式时，现在会直接报错，而不是仅给出警告。这一改动是为了配合未来将 FFI 参数默认生命周期管理方式从 `#owned` 改为 `#borrow`。

9. 修复了 `for i in x..<y` 循环的 `nobreak` 块中依然可以引用循环变量 `i` 的问题。一些意外依赖这一行为的代码可能会编译失败。

10. 改进了一些顶层函数签名不匹配时的错误信息，现在只会输出签名中不一致的部分，方便定位问题。例如：

    ```moonbit
    trait I {
      f(Self, flag1~ : Int, flag2~ : Int, flag3~ : Int) -> Unit
    }

    impl I for T with f(self, flag1~, flga2~, flag3~) {
      ...
    }
    ```

    之前的报错信息是：

    ```moonbit
    ...
      expected: (Self, flag1~ : Int, flag2~ : Int, flag3~ : Int) -> Unit
      actual:   (Self, flag1~ : Int, flga2~ : Int, flag3~ : Int) -> Unit
    ```

    改进后的报错信息是：

    ```moonbit
    ...
      expected: (.., flag2~ : _, ..) -> Unit
      actual:   (.., flga2~ : _, ..) -> Unit
    ```

11. 新增了 `#unsafe_skip_stub_check` 属性，它可以用于跳过 FFI 签名中对类型是否具有稳定 ABI 的检查。该属性可用于高级用户在 wasm 后端进行较复杂的 FFI 实验。需要注意，跳过检查后 FFI 的行为是未定义的且可能随时发生变化，因此该属性只应用于实验场景。

## 工具链更新

1. `moon ide` 新增 `analyze` 命令，用于分析一个包的公开 API 的使用情况。它会以 `mbti` 的格式打印一个包的公开 API，并在每个 API 后面附上使用情况注释，包括总使用次数、测试中的使用次数，以及该 API 是否定义在 `exports.mbt` 中：

   ```moonbit
   $ moon ide analyze . # path to packages to be analyzed
   package "username/analyze"

   import {
   "username/analyze/util",
   }

   // Values
   pub const REPORT_CONST_TAG : String = "analyze-tag"  // usage: 2 (1 in test)

   #alias(analyze_raw)                                  // usage: 2 (1 in test)
   pub fn analyze_text(String) -> @util.Token           // usage: 2 (1 in test)

   pub fn build_report(String, @util.Level) -> Report   // usage: 2 (1 in test), in exports.mbt

   pub fn never_called_pub() -> String                  // usage: 0 (0 in test), in exports.mbt

   // Errors

   // Types and methods
   pub(all) struct Report {
     title : String                                     // usage: 1 (0 in test)
     score : Int                                        // usage: 1 (0 in test)

     fn new(String, Int) -> Report                      // usage: 2 (1 in test)
   }
   #as_free_fn(make_report)                             // usage: 2 (1 in test)
   pub fn Report::new(String, Int) -> Self              // usage: 0 (0 in test)
   pub impl Analyzer for Report                         // usage: 2 (1 in test)

   // Type aliases
   pub using @util { type Token as PublicResult }       // usage: 0 (0 in test)

   // Traits
   pub trait Analyzer {
     analyze(Self, String) -> @util.Token               // usage: 2 (1 in test)
   }
   ```

   `moon ide analyze` 支持两种参数传递方式：

   - `moon ide analyze` 分析当前模块中的所有包。
   - `moon ide analyze path/to/pkg1 path/to/pkg2 ...` 分析所有传入的包，并且可以与 shell 的 glob pattern 配合使用，例如 `moon ide analyze internal/*`。

   这个命令可以配合 AI 重构快速删除模块内未使用的公开 API。不过，由于非 `internal` 包的公开 API 可能被模块外用户使用，这类重构原则上只对 `internal` 包安全。为区分非 `internal` 包中“对内使用”和“对外使用”的 API，MoonBit 引入了一项约定：凡是预期供模块外用户使用的公开 API，都应定义在 `exports.mbt` 中。`moon ide analyze` 会对这类 API 做特别标注。

2. `supported-targets` 支持进一步完善：

   - 启用新语法后，可通过 `"+js+wasm+wasm-gc"` 显式声明支持的后端，或通过 `"+all-js"` 表示排除某些后端。
   - 这一配置既可以写在 `moon.mod.json` 中，也可以写在 `moon.pkg` 中；对一个包来说，最终支持的后端是两者的交集。
   - 当无法构造依赖图时，现在会给出更好的错误信息。

3. 构建系统现在会追踪编译器本身，以减少由于编译器版本更新、缓存不匹配导致的 `segfault` 行为。

4. `mbtx` 脚本模式支持从标准输入读取代码：

   ```shell
   $ echo "fn main {println(\"hello\")}" | moon run -
   ```

   ```shell
   $ moon run - <<EOF
   import {
     "moonbitlang/core/list"
   }
   fn main {
     debug(@list.from_array([1, 2, 3]))
   }
   EOF
   ```

## 标准库更新

1. 增加 `argparse` 库，提供基础的命令行参数解析功能：

   ```moonbit
   ///|
   async fn main {
     let cmd = @argparse.Command(
       "demo",
       options=[@argparse.OptionArg("name")],
       positionals=[@argparse.PositionArg("target")],
     )
     let _ = cmd.parse()
   }
   ```

2. `moonbitlang/async` 更新：
   - JavaScript 后端添加了基于 `fetch` API 的 HTTP client 支持。`moonbitlang/async/http` 中的所有 HTTP client API（除 HTTP proxy 支持）均可在 JavaScript 后端使用，包括浏览器环境。
   - `moonbitlang/async/js_async` 增加了与 Web API `ReadableStream` 交互的支持。
