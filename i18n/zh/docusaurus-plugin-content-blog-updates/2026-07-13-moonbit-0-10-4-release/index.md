# 20260713 MoonBit v0.10.4

对应 moonc 版本：`v0.10.4`

## 语言更新

1. 新增 `extend` 语法，废弃 `impl` 隐式变为方法的行为

   原本，对于每个 `impl Trait for Type` 声明，如果 `Type` 是在当前包定义的，编译器会自动把 `Trait` 中的所有方法挂载到 `Type` 上，变为 `Type` 的方法，方便用户手动调用 `impl` 中的方法。但这一行为有诸多问题：
   - 破坏重构安全性：上游向 `Trait` 中添加一个新的、带默认实现的方法后，下游代码可能因为 dot syntax 的歧义而无法通过类型检查
   - 隐式且无法控制：如果不想把某些 `impl` 以方法的形式暴露、只想暴露 `impl Trait for Type` 这一关系，在原先的语义中无法做到

   因此，我们计划废弃这一自动挂载方法的行为。作为替代，我们提供了一个新的语法 `extend Type with Trait::{f, g}`，语义是把 `impl Trait for Type` 中的方法 `f`、`g` 手动挂载到 `Type` 上。在 `extend` 前添加 `pub` 即可将 `f`、`g` 以公开方法的形式挂载。下面是 `extend` 语法在语义上一些需要注意的点：
   - 如果 `f`、`g` 是没有显式实现，而是采用的默认实现，挂载成方法时会把 `Self` 特化成 `Type`
   - 即使 `Type` 是私有的，也依然可以为其添加私有的 `extend` 声明，此时会将 `f`、`g` 以 local method 的形式挂载，可以在当前包内用 dot syntax 调用
   - `extend` 是一个新关键字，因此目前它是以软关键字的形式实现的：用户依然把 `extend` 当作变量名使用，但编译器会在用 `extend` 做变量名的地方报警告。后续 `extend` 将成为保留字并最终成为一个真正的关键字，届时 `extend` 将不再能当作变量名使用

   相比旧有语义，`extend` 语法可以显式控制哪些方法要挂载，因此没有旧语义的重构安全性和不可控问题。

   对于库作者，预期的迁移方式是：为每一个触发了之前的隐式挂载行为的 `impl` 添加对应的 `extend` 声明。如果不希望用户以方法的形式调用某些 `impl`，可以在 `extend` 声明上添加 `#deprecated` 等标记来帮助下游用户迁移。我们提供了一个新的警告 `implicit_impl_as_method (79)` 来帮助库的作者迁移，这个警告会在所有触发了旧的隐式挂载行为的地方提供警告信息。这个警告目前是默认关闭的，有需要可以手动开启。下个版本中，该警告将默认开启。

   除了普通的 `impl`，在 trait object 类型 `&Trait` 和类型参数上调用方法的语义也有相应的调整，以配合 `impl` 的语义调整：
   - 之前，可以在 `&Trait` 类型上用 dot syntax 调用 `Trait` 的 super trait 的方法。这一行为现在被废弃，未来只有 `&Trait` 自身的方法可以直接用方法形式调用。采用这种调用方式在本次更新中会收到警告。用户需要迁移成 `Trait::f(..)` 的调用形式，或者手动为 `&Trait` 类型添加 `extend` 声明
   - 对于只有一个约束的类型参数，例如 `X : Hash`，`Hash` 自身的方法依然可以直接用 dot syntax 调用，但 super trait 中的方法未来不再能用 dot syntax 调用，调用处目前会收到警告。用户应当将有警告的位置迁移成 `Trait::f(..)` 的调用形式
   - 对于有多个约束的类型参数，例如 `X : Eq + Hash`，由于不同约束之间可能有重名方法，未来将不能用 dot syntax 调用任意一个约束中的方法，调用处目前会收到警告。用户同样需要迁移至 `Trait::f(..)` 的调用形式

2. or pattern 支持用 `with` 提供默认值

   or pattern 要求各分支绑定完全相同的变量。这导致一些处理逻辑相同的情况，需要重复编写代码或者提取一个局部函数：

   ```moonbit
   fn f(x : Int) {
     ... // 处理 x
   }

   match s {
     Some(x) => f(x)
     None => f(0)
   }
   ```

   现在可以用 `with` 为没有绑定某个变量的分支提供默认值，合并重复的处理逻辑：

   ```moonbit
   match s {
     Some(x) | None with x = 0 => ... // 处理 x
   }
   ```

   多个变量需要用括号:

   ```moonbit
   match t {
     A(a, b) | B with (a = 0, b = 0) => ...
   }
   ```

3. 新增显式 `Iter` 字面量语法 `[| .. |]`：

   ```moonbit
   // 显式构造 Iter
   let xs : Iter[Int] = [| 1, 2, 3 |]
   // 内部可以使用 spread、list comprehension 等形式
   let ys = [| ..xs, 4, 5 |]
   ```

   `Iter` 字面量的求值顺序如下：
   - 对于普通字面量 `[| x, y, z |]`，元素 `x`、`y`、`z` 会在构造字面量时就求值，和普通数组字面量一样
   - 对于插值 `..xs`，`xs` 自身会在构造字面量时当场求值，但求值 `xs` 得到的迭代器内部的计算，会在外层迭代器 `[| .. |]` 遍历到对应的元素时才被计算
   - 列表插值语法 `[| for .. |]` 中，`[| .. |]` 内的所有计算都是惰性的：只有外层迭代器遍历到对应的元素时才会被计算

   之前，spread 字面量 `[ x, ..xs, y ]` 在预期类型为 `Iter[_]` 时，会基于类型进行重载自动构造 `Iter`。这一行为现在被废弃，使用该行为的代码会收到编译器警告，提示用户改用 `[| .. |]`。这一修改的动机是：我们不希望程序的求值顺序会由于类型隐式地发生改变

4. 数组插值现在支持条件展开 `..if cond { expr }`

   ```moonbit
   let xs = [1, 2, ..if cond { extra }, 3]
   // cond 为 true 时等价于 [1, 2, ..extra, 3]
   // cond 为 false 时等价于 [1, 2, 3]
   ```

5. 新增 Bytes 字符串插值 `b"...\{x}"`

   Bytes 字符串插值的语义是将字符串插值的结果转换成 UTF-8 编码的 `Bytes`：

   ```moonbit
   let x = 42
   let b : Bytes = b"value=\{x}" // 相当于 @utf8.encode("value=\{x}")

   // 模板写入语法同样支持 Bytes
   buf <+ b"value=\{x}"
   ```

6. 任意类型均可定义自定义构造器

   之前，仅有 `struct` 类型可以自定义构造器。现在，所有类型都可以用 `fn Type::Type(..)` 语法定义自定义构造器，标准库也借此统一了各容器类型的构造 API（见标准库更新）。需要注意的是，自定义构造器不能和类型已有的构造器重名。例如 `struct Tuple(..)` 就不能有自定义构造器，因为会和自带的 `Tuple(..)` 构造器冲突

7. 空 `{}` 字面量将会触发歧义警告

   空的 `{}` 既可能是空 map 也可能是空 JSON object，现在编译器会对这种写法产生歧义警告，并给出建议的写法：

   ```moonbit
   let json : Json = { "object": {} }
                             //  ^^---- 推荐使用 `Json::empty_object()`
   let dict : Map = {}
                 // ^^--- 推荐使用 `Map([])`
   let result = { stmt1(); {} }
                        // ^^--- 推荐使用 todo 语法 `...` 或者移除这里的空 block
   let record = {}
             // ^^--- 推荐使用 `Record::{}`
   ```

8. 实验性的 lexmatch 表达式升级为 lexscan 表达式

   ```moonbit
   fn find_eol(s : StringView) -> Int? {
     lexscan s {
       (re"\r?\n", before=line, after=_) => Some(line.length())
       _ => None
     }
   }

   enum Token {
     IDENT(String)
     NUMBER(String)
   }

   fn tokenize(s : String) -> Array[Token] {
     let tokens = []
     for curr = s {
       lexscan s with longest {
         (re"^[ \t\r\n]+", after=rest) => continue rest
         (re"^[A-Za-z][A-Za-z0-9_]*" as t, after=rest) => {
           tokens.push(IDENT(t.to_owned()))
           continue rest
         }
         (re"^[0-9]+" as t, after=rest) => {
           tokens.push(NUMBER(t.to_owned()))
           continue rest
         }
         _ => break
       }
     }
     tokens
   }
   ```

   Lexscan 表达式的 case patterns 和 regex match 表达式的右侧基本一致，但 lexscan 表达式额外支持 longest 匹配策略。

   原有的 lexmatch 表达式已被弃用，编译器会给出迁移提示。新的 lexscan 表达式不支持 `Bytes`/`BytesView` 和 guards，对于此情况需要手动改写。

   _（lexscan 表达式即将支持 streaming 模式，敬请期待）_

9. 旧的 moon.pkg.json / moon.mod.json 支持即将移除

   我们计划在下个版本移除构建系统、编译器对 moon.pkg.json / moon.mod.json 的支持，推荐迁移到 moon.pkg / moon.mod。moon fmt 对旧格式的迁移仍然会保留。

10. Warnings 配置的 @ 符号即将弃用

    我们计划简化 warnings 配置字符串的语法，移除 @ 开关。推荐在 CI 使用 moon 的 --deny-warn 代替。

## 工具链更新

1. 新 MoonBit native 后端扩展平台支持。上月发布时新后端仅支持 macOS Apple Silicon，本月新增：
   - x86-64 Linux (gnu) 支持
   - x86_64-pc-windows-msvc 支持，已进入 nightly。Windows 用户需要手动安装 MSVC Build Tools。
   - 构建策略调整为：debug 构建使用新 native 后端（编译更快），release 构建使用 C 后端并调用系统 C 编译器做 -O2 优化（运行更快）

2. 新 MoonBit native 后端在 MacOS Apple Silicon 平台的 debug 模式下默认开启。设置环境变量 MOONBIT_NEW_NATIVE=0 时，禁用 MoonBit 新 Native 后端，debug 构建和 release 构建均使用 C 后端。其它平台，默认模式仍然为 C 后端，只在 MOONBIT_NEW_NATIVE=1 开启时，debug 构建使用新 Native 后端。

3. Windows 开发体验改进
   - native 后端构建不再要求在 MSVC 环境中启动终端，moon 会自动查找 cl.exe / clang-cl.exe

4. moon.pkg 新增 `pkgtype` 声明，配套新增 `#export_name` attribute

   ```moonbit
   // moon.pkg
   pkgtype(kind: "executable")      // 替代原先的 options("is-main": true)
   pkgtype(kind: "foreign_library") // 替代原先的 options(link: true)
   pkgtype(kind: "library")         // 缺省值
   ```

   `#export_name` 用于指定一个函数在生成代码中的名称，比如：

   ```moonbit
   #export_name("attr_add")
   pub fn add_by_attr(n : Int) -> Int {
     n + 42
   }
   ```

   在生成的 Wasm/JS/C 目标产物中会将该函数以指定的符号进行导出，`#export_name` 限制只能在 foreign library 的包中使用，并且只有 foreign library 中的函数会被导出，其上游依赖中的符号不会被导出。目前在 native 后端编译成静态/动态链接库的功能还在完善，所以该功能目前主要适用于 Wasm/JS 后端。

5. `source`、`formatter` 等已稳定的配置项提升到 moon.mod / moon.pkg 顶层：

   ```moonbit
   // moon.pkg
   formatter(ignore: ["file1", "file2"])

   // moon.mod
   source = "src"
   ```

6. 修复了若干 LSP 崩溃与偶发失败的问题

7. moon 行为修复与改进
   - prebuild 与 test 的工作目录统一为模块根目录，prebuild 路径改为相对路径
   - macOS 文件监听切换到 FSEvents，修复 `moon check --watch` 崩溃问题
   - `moon run` 现在会正确传递被运行程序的退出码
   - `moon bench` 支持路径过滤
   - workspace 级的 preferred-target 被废弃，`moon run` 现在遵守模块自身的 preferred-target

8. skills.mooncakes.io 市场

   页面链接现在可以直接被 `npx skills` 工具识别并安装，例如 `npx skills@latest add https://mooncakes.io/skills/Milky2018/pptz@0.2.4`

9. 解析器错误恢复改进

   改进了解析器在处理语句时的错误恢复。

## 标准库更新

1. `moonbitlang/async` 目前最新版本为 0.20.2，自上次月报（0.19.2）以来的主要更新有：
   - 新增实验性的 Wasm1 后端支持，具体 API 的签名和行为均和 native 后端一致。使用了 `moonbitlang/async` 的项目构建出的 `.wasm` 文件目前必须使用最新的 `moonrun` 运行，暂不兼容其他 Wasm 运行时

     使用 `moonbitlang/async` 的程序构造出的 `.wasm` 二进制是跨平台的：同一份 `.wasm` 程序可以在任何有 `moonrun` 可用的硬件架构、操作系统上运行，无需重新构建

     目前 `moonbitlang/async` 的 Wasm1 支持暂处于实验性阶段，在**未来**我们将保证 `.wasm` 二进制的向后兼容性：使用旧版 `moonbitlang/async` 构建出的 `.wasm` 依然可以在最新的 `moonrun` 上运行

     目前 `moonbitlang/async` 的 Wasm1 暂不支持下列功能：
     - `@websocket`
     - `@fs.Watcher` 和 `@fs.realpath`

     但相关支持都会在近期添加

   - `@fs.Watcher` 新增了 `.wait()` 方法，能够返回一系列描述文件系统实际发生的变动的事件。`@fs.Watcher(..)` 构造器中也新增了一些控制事件汇报相关行为的选项，具体系列详见 API 文档。`@fs.Watcher` 提供的文件系统监视支持依然是完全跨平台的：相同的文件系统操作在所有支持的操作系统上都会得到相同的事件序列

   - 调整了 `@fs.File` 的读写语义，不再依赖语义操作系统维护的 file pointer，因为其语义在不同平台不一致且在部分平台有 bug。调整后的 `@fs.File` 的语义是：
     - 通过 `@io.Reader`/`@io.Writer` 进行的顺序读写现在是两个完全独立的流，互不干涉。基于 `read_at` 和 `write_at` 的随机读写和顺序读写完全独立，且可以在多个任务中并行进行（只要写入的区间不重叠）
     - 对于以 append 模式打开的文件（在 `@fs.open` 时提供 `append=true`），基于 `@io.Reader` 的顺序读取的语义不受影响，依然会从文件开头开始读取。基于 `@io.Writer` 的顺序写入则总是会在文件的最后追加内容。基于 `read_at` 的随机读取同样不受 append 模式影响，但对于 append 模式的文件，基于 `write_at` 的随机写入现在会立刻抛出错误。因为在 Linux 上相关系统调用有 bug，无法实现正确的语义

     这一改动是不兼容原有行为的。但大部分程序应该不会受到影响

   - 如果程序引用了 `@stdio.stdin`、`@stdio.stdout` 等标准输入输出，且 `moonbitlang/async` 内部初始化标准输入输出的处理时失败了（例如在 Windows 上，标准输入输出可能不存在），之前，程序会在初始化时直接崩溃。在最新版本中，程序遇到这种情况时不再会崩溃，而是会在第一次使用对应的标准输入输出管道时抛出错误。`@stdio.{Input,Output}::fd` 因此现在可能抛出错误了，这是一个不兼容的改动

   - `@fs.open` 的 `sync` 选项在 Windows 上也会生效了，`sync=Data` 和 `sync=Full` 都会映射到 Windows 的 `FILE_FLAG_WRITE_THROUGH` 选项，保证文件写入操作返回时，内容已经被同步到实际的文件系统，而不是只停留在缓存里

   - `@fs.symlink` 在创建的符号链接的对象是一个现有目录时，会在 Windows 上首先尝试创建 NTFS junction 而非 symbolic link，因为 Windows 上创建 symbolic link 需要管理员权限。这一行为可以通过 `force_symlink=true` 显式关闭（默认为 `false`）

   - 大量 bugfix 和一些性能优化

2. `moonbitlang/core`
   - 新增实验性的 v128 SIMD package，并利用 SIMD 优化了多处热点：Bytes 查找与比较、UTF-16 解码等。此外 StringBuilder 写入、Array/FixedArray 常用操作、BigInt、strconv、JSON 解析等也做了大量性能优化
   - immut 各容器（HashMap / HashSet / SortedMap / SortedSet 等）新增与类型同名的构造器，`from_array` 被弃用，与语言层面的自定义构造器风格保持统一
   - argparse：解析错误时会给出子命令拼写建议，并支持默认子命令分发
   - 新增 `Json::empty_object()`；String 新增 `all` / `any` / `contains_code_unit` 等便捷 API；Int16 / UInt16 新增 `lnot`
   - 取 view 操作符移除了负数索引支持
   - 清理弃用 API：移除了集合类型的 `#alias(T)`、`IterResult` 等
   - 修复了 `@env` 中的环境变量、命令行参数、当前目录等 API 在 Windows 下无法正确处理 unicode 字符串的问题
