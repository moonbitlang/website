# 20261105 MoonBit v0.10.19

对应 moonc 版本：`v0.10.19`

## 语言更新

1、Derive 语法迁移

把写在类型定义末尾的 `derive(...)` 移到了定义上方，统一为属性的写法。已有代码可以交给 `moon fmt` 转换。

```moonbit
#derive(Debug, Eq, Hash)
pub(all) struct Point {
  x : Int32
  y : Int32
}
```

属性移除了 `#foo(qual.id)`的语法，增加`#foo(@pkg.id)`和`#foo([elem1, elem2, elem3])`的语法支持。

2、Int/UInt 类型改名为 Int32/UInt32

`Int32` 和 `UInt32` 分别表示 32 位有符号和无符号整数。在需要同时读写多种位宽的场合，例如二进制协议或 FFI 签名，显式位宽能让代码更容易读。原来的 `Int` 和 `UInt` 仍可作为别名使用，两种拼法可以在同一个项目中混用。格式化工具可以将旧拼法迁移成显式位宽的写法。

3、浮点数语义调整

运算和比较运算符(`==`, `!=`,`<=`,`<`,`>=`,`>`)依旧保持 IEEE 语义：`-0.0 == 0.0`，`NaN` 与任何值（包括自身）都不相等。主要改动在于 `compare` 函数对 `NaN` 的计算结果，目前 `compare` 不提供关于 `NaN` 的计算结果的保证，这主要影响排序，二分查找，并且哈希表之类的结构不应使用 `NaN` 作键值，如果需要对 `NaN` 有语义保证的 `compare` 版本，可以使用新提供的 `Float::total_compare` 和 `Double::total_compare`，这两者按如下顺序进行比较：

- `NaN`
- `-Infinity`
- 负数
- `-0.0` 和 `0.0` 这两者相等
- 正数
- `+Infinity`

4、extenum 的声明形式调整

旧写法支持类型声明和构造器放在一起，比如：

```moonbit
extenum E {
  A
}
```

现在应先用 `pub extenum E` 声明类型，再用 `extenum E += { ... }` 拓展构造器，比如：

```moonbit
pub extenum E

extenum E += {
  A
}
```

声明部分只支持 pub 可见性：private 的 extensible enum 下游无法拓展，可以用普通 enum 替代；pub(all) 与 pub 对下游效果相同，统一为 pub。拓展构造器的部分依然可以使用 pub(all)/pub/priv 来控制构造器的可见性。旧写法目前会给出 deprecated 警告，`moon fmt` 会自动迁移到新写法。

5、新增 bytes 正则字面量 `reb"..."`

`reb"..."` 用于在 `=~` 和 `lexmatch` 中匹配 `Bytes` / `BytesView`，用法与匹配 `String` / `StringView` 的 `re"..."` 一致，比如：

```moonbit
fn parse_request(line : Bytes) -> Unit {
  if line =~ (reb"^(GET|POST|PUT) " + (reb"[^ ]+" as path), after=rest) {
    ...
  }
}
fn content_length(header : BytesView) -> BytesView? {
  lexmatch header {
    (reb"^(?i:content-length): " + (reb"[0-9]+" as n), after=_) => Some(n)
    _ => None
  }
}
```

`reb"..."` 的匹配单位是字节而不是 Unicode 字符，不做任何编码解码，可以匹配任意字节序列。它的正则语法与 `re"..."` 基本一致，主要区别是：

- 字面量中只能写 ASCII 字符，非 ASCII 字节使用 `\xHH` 表示（也可用于字符类和范围），例如 `reb"\xef\xbb\xbf"`、`reb"[\x80-\xff]+"`；不支持 `\u{...}` 和直接写非 ASCII 字符（如 `reb"é"` 需写成 `reb"\xc3\xa9"`）。
- `.` 和 `[^...]` 匹配任意单个字节（包括 0x80–0xFF），因此 `.` 只会匹配多字节 UTF-8 序列中的第一个字节。
- `(?i:...)`、`\b`、`[[:word:]]` 只针对 ASCII，0x7F 以上的字节不做大小写折叠，也不视为单词字节。

捕获的类型由正则静态决定：确定只匹配一个字节时为 `Byte`（如 `reb"." as b`），否则为 `BytesView`；`before` / `after` 的类型为 `BytesView`。

在普通表达式中，`reb"..."` 的类型为 `BytesRegex`，可以像 `Regex` 一样定义为常量并用 `+`、`|` 组合，在模式中引用：

```moonbit
const HIGH : BytesRegex = reb"[\x80-\xff]"
const HIGH_THEN_A : BytesRegex = HIGH + reb"a"
```

`lexscan` 目前不支持 bytes 正则。

6、【Breaking change】 预告

下个版本我们将调整 js 后端下 Array 类型的运行时布局，js 后端将和其他后端一致，Array 将不再编译成 JavaScript 原生 Array。

7、顶层 `declare let`

过去，declare 主要用于函数、类型等接口。现在也可以先用 `declare let` 写出一个顶层值的名称、类型和可见性，再在同一个包内提供与之匹配的定义。这样可以先审阅包对外承诺的接口，再决定值放在哪个文件里、如何初始化。

```moonbit
///|
declare pub let default_limit : Int32

///|
pub let default_limit : Int32 = 100
```

## 工具链更新

1、Native 后端支持构建静态链接库

比如我们可以写如下的 MoonBit 程序，这里用 `#export_name` 指定对外符号。

```moonbit
let offset : Int32 = 2

#export_name("add")
pub fn add(a : Int32, b : Int32) -> Int32 {
  a + b + offset
}
```

在 `moon.pkg` 中用 `pkgtype(kind: "foreign_library")` 声明包类型后，运行 `moon build --target native` 即可生成可供宿主链接的 `.a` 文件；Windows 平台生成的则是 `.lib` 文件：

```text
$ moon build --target native                                                ~/playground/moonbit-playground/demo
Finished. moon: ran 28 tasks, now up to date
Artifacts:
  username/foreign/lib  native  path/to/_build/native/debug/build/lib/lib.a
```

在宿主侧，则需要调用 `moonbit_init()` 函数来初始化 MoonBit 程序的运行时，比如：

```c
#include "moonbit.h"
#include <stdio.h>

extern int32_t add(int32_t a, int32_t b);

int main(void) {
  moonbit_init();
  printf("add(40, 2) = %d\n", add(40, 2));
  return 0;
}
```

这之后我们可以将它和 MoonBit 生成的静态链接库一起编译，并运行：

```text
$ cc -I ~/.moon/include host.c path/to/_build/native/debug/build/lib/lib.a -lm -o host
$ ./host
add(40, 2) = 44
```

2、Mbtx 脚本模式配置迁移

脚本可以在文件开头的 `---` 之间放置配置，把依赖和运行时权限集中写在一起。文件头沿用 `moon.pkg` 和`moon.mod`的配置语法。对于需要从宿主环境读取变量的脚本，也可以在此声明要请求的权限。

导入配置的 `import`语法保持不变，仍然支持包别名和完全导入。同一个导入还可以同时写包别名和 `*`。下例中，`Queue` 可以直接调用，也可以写成 `@q.Queue`。如果只写 `*`，包的默认别名仍然可用。

```moonbit
---
import {
  "moonbitlang/core/queue" @q *,
  "moonbitlang/x/bcrypt",
}
---

fn main {
  println(Queue([1, 2]).length())
  println(@q.Queue([3, 4, 5]).length())
}
```

```text
.
├── fixture
│   └── data.json
└── script.mbtx
```

**权限声明支持对文件读写、进程创建、环境变量读写进行精细的控制，保证 AI 编写的脚本在安全的范围内工作。**

下面的`read.mbtx`声明了`permission()`表示给予最少的权限：

```moonbit
---
import {
  "moonbitlang/core/env",
  "moonbitlang/async@0.22.7",
  "moonbitlang/async@0.22.7/fs",
  "moonbitlang/async@0.22.7/process",
}
// An explicit empty policy denies host access, including further spawning.
permission()
---

async fn main {
  let text = @fs.read_file("data.json").text()
  println(text)
  let (code, stdout, stderr) = @process.collect_output("moonx", ["cli/cat", "data.json"])
  println("code: \{code}, \{stdout.text()}, \{stderr.text()}")
}

// $ moon run read.mbtx
// Sandbox policy blocked file read: "data.json"
// OSError("@fs.open(): \"data.json\": Permission denied")
```

脚本中尝试用`@async/fs`读取`data.json`并输出，运行该脚本会得到`Permission denied`的报错。调用`moonx cli/cat`来试图绕过权限控制的代码同样会被运行时拦截，因为它没有创建进程的权限。

而另一个脚本`read_with_permission.mbtx`配置了读`data.json`、创建`moonx`进程的权限。运行时允许它正常读入`data.json`并输出：

```moonbit
---
import {
  "moonbitlang/core/env",
  "moonbitlang/async@0.22.7",
  "moonbitlang/async@0.22.7/fs",
  "moonbitlang/async@0.22.7/process",
}
// An explicit empty policy denies host access, including further spawning.
permission(
  env: {
    "from_host": ["PATH"],
    "set": { "MBTX_PROBE_TOKEN": "parent-only" },
  },
  fs: { "read": ["data.json"], "write": [] },
  process: { "allow": [{ "program": "moonx" }] },
)
---

async fn main {
  let text = @fs.read_file("data.json").text()
  println(text)
  let (code, stdout, stderr) = @process.collect_output("moonx", ["cli/cat", "data.json"])
  println("code: \{code}, \{stdout.text()}, \{stderr.text()}")
}

// $ moon run read_with_permission.mbtx
// { "user": "peter", "items": [ "potato", "tudou" ] }
// code: 0, { "user": "peter", "items": [ "potato", "tudou" ] },
```

3、moon check 自动生成 .mbti

成功检查后，`moon check` 会为本次检查到的本地包更新 `pkg.generated.mbti`，前提是该包的首选后端也在检查范围内。`.mbti` 汇总了公开类型、函数和 trait，可以随源码一起审阅 API 变化。仅想做类型检查时，可以运行 `moon check --no-mbti`。

4、文档测试改进

`moon test`原先支持提取并测试文档注释`///`内的代码块：

````moonbit
///
/// ```mbt check
/// test {
///   assert_eq(greeting("alice"), "hi, alice")
/// }
/// ```
fn greeting(name : String) -> String {...}
````

为了提升 agent 使用 moonbit 进行“编程-测试”循环的效率，我们改进了工具链提取和解析文档测试的性能。

测试块不再继承函数的`#cfg`属性。对于函数只支持特定后端的情况，需要为测试块单独补充 `#cfg`标记。

5、moon test 默认并行执行测试

Moon 默认按可用 CPU 数并行调度测试可执行文件。在包含多个测试包的项目中，这可以减少等待时间。使用 `moon test -j 4` 可限制并发数。对于共享端口或外部资源的测试，可以用 `moon test --no-parallelize` 串行执行测试程序（此配置不影响单个包内部 async test 的并行），同时保留构建阶段的并行。

6、LSP 支持 mbtx

MoonBit 的语言服务现在可以处理 `.mbtx` 脚本，编写独立工具和自动化脚本时也能使用编辑器的语言服务。

7、VSCode 现已支持新 Native 后端调试

安装 CodeLLDB 插件，并将 moon.mod 中的 preferred-target 设置为 native 后，点击 main 或 test 上方的 Debug 按钮开始调试。至此，调试功能除 LLVM 和 JS 后端外，也支持新 Native 后端。

8、moon 新增实验性的`testcli` 子命令

该命令用于测试MoonBit命令行应用/mbtx 脚本，可用于替换之前的`cram`子命令。

9、模块可以用 `owner/library/v{n}` 这样的路径标识新的主版本。

发布破坏性更新时，依赖方可以通过路径区分两个主版本。导入该模块的根包时，默认别名仍为 `@library`。如果同一份代码同时导入两个主版本，可以用显式别名区分。注：语言 1.0 以前暂不支持发布版本 1.0 及以上的包。

10、条件导入：

一个包可能在 Native 上调用系统库，在 JavaScript 上使用浏览器 API。现在可以用 `#cfg` 为不同后端选择依赖，并为这些依赖设置相同的别名。下面两个实现包如果都提供 `label()`，调用处就可以统一写成 `@platform.label()`。同样的条件机制也适用于黑盒和白盒测试导入。

```moonbit
#cfg(target = "native")
import { "example/conditional/native_impl" @platform }

#cfg(target = "js")
import { "example/conditional/js_impl" @platform }
```

11、增加实验性包声明。

可以通过 `experimental = true`来声明，直接使用者会收到警告，可通过 `allow-experimental-packages = true`来消除。

12、工具链旧行为清理

- 配置格式不再接受 JSON 清单。保留 `moon fmt`迁移入口
- `moon install`不再作为依赖同步指令
- `moonx`只支持运行 wasm 程序
- `bin-deps`支持被移除。建议使用 `moonx` 代替。同步移除 `moon add --bin`
- 不再支持 `mbl` `mby`格式文件自动生成。建议使用 `moonx`与对应库代替
- 依赖声明中的版本必须真实存在
- 未显式 import 的 core 包从警告变为错误

## 标准库和运行时更新

1、新增 `moonbitlang/core/async`，包含 `moonbitlang/async` 的所有功能。

`moonbitlang/async/http` 等包也在 `moonbitlang/core/async/http` 有对应的版本。未来，`moonbitlang/core/async` 将成为默认的异步运行时，`moonbitlang/async` 将被逐步废弃。目前，`moonbitlang/core/async` 仍是实验性的，其 API 仍在不断调整，因此如果要使用 `moonbitlang/core/async`，需要在 `moon.pkg` 的 `options` 部分加上 `"allow-experimental-packages": true`

`moonbitlang/core/async`的 API 在 `moonbitlang/async` 的基础上做了大量的改进。待 `moonbitlang/core/async` 的 API 稳定后我们会提供从 `moonbitlang/async` 迁移到 `moonbitlang/core/async` 的详细指引

`moonbitlang/core/async` 可以和 `moonbitlang/async@0.22.7+` 在同一个程序中同时使用。因此从 `moonbitlang/async` 迁移到 `moonbitlang/core/async` 的过程可以渐进地完成

2、路径库合入标准库

现在可以直接导入 `moonbitlang/core/path`来进行基本的文件路径操作。

以下面的 mbtx 脚本为例，path 库支持从路径获取文件拓展名、文件名、文件夹路径。也支持使用`/`操作符进行路径拼接：

```moonbit
---
import {
  "moonbitlang/core/path",
}
---

fn main raise {
  let file1 = @path.Path("path/to/base/file1.mbt")
  assert_eq(file1.extname(), ".mbt")
  assert_eq(file1.basename(), "file1.mbt")
  let base = file1.dirname()
  let target = base / "fixture" / "file2.txt"
  assert_eq(target, "path/to/base/fixture/file2.txt")
}

```

3、`core/compress` 新增原始 DEFLATE、gzip 和 zlib 编解码

`core/archive/zip` 新增 ZIP 和 ZIP64 支持。处理 gzip 数据、生成 ZIP 文件或读取归档条目时，可以从标准库中选择对应的包。归档 API 还支持查看条目元数据，便于先了解归档内容，再决定读取哪些条目。

4、移除了 `moonbitlang/core/abort`作为虚拟库的支持。

5、`Json`类型及`ToJson`trait 被移动到 `moonbitlang/core/json`包。部分内建类型无法使用`a.to_json()`形式调用，请通过 `ToJson::to_json(a)`或`Json(a)`的方式使用。

6、`moonbitlang/x/time`完善了对 TZif（Time Zone Information）文件的读取支持，并新增了读取当前系统时区的功能（目前仅限 native 和 js 后端）。

## 生态与开发工具更新

1、mooncakes.io 改进

- 增加了注册、登录和密码找回功能；文档页新增反向依赖信息，skills 上传与模块上传分离。
- 改进搜索体验，现在以名字匹配的模块将稳定排在最前面。

2、SeekMoon：

- 新增「对话」页面，可以在不绑定工作区的情况下使用 SeekMoon 了。
- 支持云端 Agent，通过在「对话」页面新建对话即可使用。使用前需要登录。
- 支持读取图片，可以直接在输入框粘贴图片，agent 也能够调用工具读取图片。
- 增加了「定时任务」功能。可以在侧边栏新建。
- 集成了 Word、Excel、PDF 预览。现在 SeekMoon 可以通过 typst 生成 PDF 并预览。
- 内建了 `/ultrareview` 和 `/simplify` 工作流，并发启动多个 subagent 来进行 review 和代码仓库化简。
- 增加了在本地进行 PR 审阅的功能。可以在侧边栏中打开 GitHub 页面浏览仓库中的 PR ，也可以文件的对应位置查看 GitHub review comments

3、现在新增了两个命令行工具，可以通过`moonx cli/typst`和`moonx cli/rg`使用。
