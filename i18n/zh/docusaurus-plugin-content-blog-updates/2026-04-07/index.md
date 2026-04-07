# 20260407 MoonBit v0.9

发布于: 2026年4月7日

**对应 moonc 版本：**`v0.9.0+9f1423bcb`

## 语言更新

1. **废弃 `derive(Show)`**

   调试数据结构的接口已经迁移到 `Debug` 特征。`Show` 特征将专注于提供 `Json::stringify` 等自定义输出格式的接口，不再只对 `String` 和 `Char` 做特殊处理。手动实现 `Show` 特征仍然受支持。

2. **增加形式化验证支持**

   例如，我们可以通过 `proof_ensure` 写明函数运行结果应该满足的条件：

   ```moonbit
   // Int is assumed to be unbounded integers
   // We will provide a config option to change it to 32-bit machine integers
   // in later releases
   pub fn abs(x : Int) -> Int where {
     proof_ensure: result => result >= 0,
     proof_ensure: result => (result == x) || (result == -x)
   } {
     if x >= 0 {
       x
     } else {
       -x
     }
   }
   ```

   并且在 `moon.pkg` 文件中启用证明功能：

   ```moonbit
   options(
     "proof-enabled": true
   )
   ```

   再执行 `moon prove` 即可看到证明结果。更多关于验证的支持可以参考另一篇文章。

3. **废弃 `loop` 语法**

   为了简化语言，`loop` 语法已被废弃。对于已经使用 `loop` 的代码，可以使用 `for` + `match` 替代：

   ```moonbit
   loop value {
     Pattern1 => continue value1
     Pattern2 => ...
   }
   ```

   ```moonbit
   for x = value {
     match x {
       Pattern1 => continue value1
       Pattern2 => { ...; break }
     }
   }
   ```

4. **新增稳定的 `regex` 支持，以及新的 regex match 表达式 `s =~ re"..."`**

   新的 regex match 表达式和之前实验性的 `lexmatch?` 有一些相似之处，但语义上并不完全相同。具体使用方式请参考 [regex literal expression](https://docs.moonbitlang.com/en/latest/language/fundamentals.html#regex-literal-expression) 和 [regex match expression](https://docs.moonbitlang.com/en/latest/language/fundamentals.html#regex-match-expression)。

   我们计划之后废弃实验性的 `lexmatch` 和 `lexmatch?` 表达式。

   ```moonbit
   const PREFIX = re"a"
   const ALT = re"b"
   const SUFFIX = re"bc"

   fn main {
     let s = "==abc=="
     let _ = s =~ re"abc"
     let _ = s =~ (PREFIX + SUFFIX, )
     let _ = s =~ (((re"x" as x) | ALT) + SUFFIX, before=y, after~)
   }
   ```

5. **JavaScript 后端下，`Int64` 和 `UInt64` 现在会被编译成 `BigInt`**

   `UInt64` 和对应的 JavaScript `BigInt` 值保持一致。对于 `Int64`，需要使用 `BigInt.asIntN(64, x)` 来获取对应的有符号 64 位值。

   改用 `BigInt` 的主要原因有两个：

   - 由于 JavaScript 引擎的持续优化，基于 `BigInt` 的 `Int64` 性能已经明显超过此前基于两个 `Int` 字段模拟的实现。
   - 这也和现代 JavaScript 中处理 64 位整数的自然方式对齐。

6. **新增反向 pipeline 语法 `div(id="...") <| []`**

   反向 pipeline 为 UI 库提供了新的 DSL 写法，并通过减少嵌套括号提升了可读性：

   ```moonbit
   fn view() -> Html {
     div([
       text("hello"),
       ul([
         li("item 1"),
         li("item 2"),
       ]),
       h1(id="...", [
         a(href="..."),
       ]),
     ])
   }
   ```

   ```moonbit
   fn view() -> Html {
     div <| [
       text("hello"),
       ul <| [
         li("item 1"),
         li("item 2"),
       ],
       h1(id="...") <| [
         a(href="..."),
       ],
     ]
   }
   ```

   反向 pipeline 的右侧也支持 lambda，因此可以更自然地编写类似 Compose UI / SwiftUI 风格的界面 DSL：

   ```moonbit
   list(album.songs) <| song => {
     hstack <| () => {
       image(album.cover)
       vstack(alignment=Leading) <| () => {
         text(song.title)
         text(song.artist.name)
           .foreground_style(Secondary)
       }
     }
   }
   ```

7. **统一返回值为 `Unit` 的 FFI 函数 ABI**

   现在，在 native / wasm / wasm-gc 后端，返回值为 `Unit` 的 FFI 函数在 ABI 层面统一变为“不返回值”。例如在 native 后端，一个返回 `Unit` 的 MoonBit `extern "C"` 声明现在会对应 C 中一个返回 `void` 的函数。

8. **增加 `impl` 的 `#deprecated` 支持**

   目前，`#deprecated` 只能标在没有 `with` 的 `impl Trait for Type` 声明上。所有使用了 `#deprecated` 的 `impl` 的地方，包括调用多态函数、直接调用该 `impl` 中的方法，都会产生警告：

   ```moonbit
   struct T(Int)

   #deprecated
   impl Eq for T

   impl Eq for T with equal(x, y) {
     x.0 == y.0
   }

   test {
     let _ = T(1) == T(2) // deprecated warning
   }
   ```

9. **`using` 和 `#alias` 现在会自动创建构造器别名**

   对于 tuple struct、带构造器的 `struct` 以及只有一个构造器的 error，现在都可以自动创建构造器别名，使得对应类型可以通过别名构造或匹配：

   ```moonbit
   using @ref {type Ref}

   test {
     let _ = Ref(42) // 现在可以这样写，不再需要写成 `@ref.Ref(42)`
   }

   #alias(Alias)
   struct MyType(Int)

   test {
     let _ = Alias(42) // 现在可以这样写，不再需要写成 `MyType(42)`
   }
   ```

   这一改动使得上述三种构造可以更自然地通过 `using` 重新导出，或通过 `#alias` 进行改名。

## 工具链更新

1. **增加工作区支持**

   包括用于创建和管理工作区的 `moon work init` 与 `moon work use`。`moon work sync` 用于同步工作区内包的版本。

   `check`、`test`、`format` 等命令现在都支持工作区。`publish` 仍只支持模块级发布，需要使用 `moon -C module publish` 对单模块进行发布。

2. **废弃 `moon doc` 中的符号查找功能**

   这一能力已经统一收敛到 `moon ide doc`。

3. **下载脚本增加 Windows aarch64 支持**

4. **下线 `try.moonbitlang.cn` 和 `oj.moonbitlang.com`**

5. **调整 pre-1.0 版本的解析策略**

   在 1.0 正式版发布前，pre-1.0 版本现在会被视为兼容版本。也就是说，依赖图中的 `moonbitlang/async@0.15.0` 和 `moonbitlang/async@0.16.0` 现在会解析为 `moonbitlang/async@0.16.0`。

6. **改进 `mooncakes.io` 的界面和文档浏览体验**

## 标准库更新

1. **新增 `immut/vector`**

   `immut/vector` 替换了原有的 `immut/array`，同时性能更优。

2. **调整 `SourceLoc` 的 `Show` 输出格式**

   文件名从相对于包变为相对于模块。这一改动使得项目的 `source` 设置能够体现在 `SourceLoc` 中。如果测试中输出了 `SourceLoc`，可能需要通过 `moon test -u` 更新预期输出。

3. **`moonbitlang/async` 更新（最新版本 `v0.17.0`）**

   - 新增 `@async.Timer` 类型，可以用于实现空闲超时等抽象。
   - 许多类型如 `@async.Queue` 提供了 `struct` 构造器 API，可以通过 `@async.Queue(..)` 的方式创建。
   - 为了适应上游的类型变动，`@async.spawn_loop` 的签名有一些 breaking changes。
   - 允许直接获取 socket 的 fd，便于高级用户自行绑定一些平台相关的 socket API。
