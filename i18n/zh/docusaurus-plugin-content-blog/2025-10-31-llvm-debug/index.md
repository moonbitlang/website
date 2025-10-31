---
description: "MoonBit 推出 LLVM Debugger，核心用户数破十万"
slug: llvm-debug
image: /img/blogs/zh/2025-10-31-llvm-debug/cover.png
tags: [MoonBit]
---

import Demo from './demo.mp4'

# MoonBit 推出 LLVM Debugger，核心用户数破十万

![](./cover.png)

## 前言

目前 MoonBit 编程语言已进入 Beta 版本，也在近期补全了关键语言特性的最后一块拼图：异步编程库moonbitlang/async ，预计在明年中旬 MoonBit 正式进入 1.0 版本。值得一提的是 MoonBit 用户数已突破十万（数据来源： VS Code+OpenVsx ），作为一个三岁的编程语言来说，这是值得称赞的里程碑。

此前 ，我们发布了 MoonBit 的 LLVM 后端。这是一个与 C 后端并行的原生后端，不需要使用 C 代码作为中间输出转换，即可直接生成可执行文件。这降低了 MoonBit 工具链对 C 语言工具的依赖，目前只会在编译 MoonBit 运行时和链接可执行文件时才会使用到 C 编译器。

在在开发应用程序的过程中，我们常常会遇到一些难以通过表面现象定位的问题。要真正弄清楚程序在运行时究竟发生了什么，离不开有效的调试手段。通常来说，调试主要有两种方式：
 1. 插桩调试，即在程序执行过程中打印可能出现问题的状态和变量值，也就是常说的 “printf 调试法”；
 2. 调试器（debugger），在程序运行时出现异常时暂停执行，从而跟踪程序的具体行为。

这两种调试方法在实际使用中是互补的：

- 插桩调试 善于应对较高抽象层级的应用程序问题，
 因为它需要应用程序的基本功能（如数据结构、字符串转换、输入输出等）稳定可用；
- 调试器（Debugger） 则侧重于测试程序的底层实现，它不依赖应用程序本身的正确性，只要编译器提供正确的调试符号即可运行。

  调试器尤其适用于应用程序基础功能异常或底层崩溃的情况。通过调试器，开发者可以在程序执行过程中：
  - 设置断点，随时暂停程序运行；
  - 检查变量值、调用栈等当前状态；
  - 使用单步执行，逐行跟踪代码逻辑，深入分析问题细节。

在当前的 MoonBit 开发中，我们已经通过标准库、`derive Show` 等特性提供了较为完善的插桩调试支持。但是 MoonBit 对于调试器的支持目前基本仅限于在 JS 后端通过浏览器或 Node.JS 内置的调试器进行调试。对于原生应用程序，我们只能对编译到 C 代码之后的应用程序进行调试，而将 MoonBit 代码编译到 C 代码这一过程中会丢失许多关于数据结构的关键信息，因此调试体验并不好。LLVM 后端弥补了这个问题：通过 LLVM 编译器工具链对调试信息的原生支持，我们可以让调试器获得准确的 MoonBit 数据结构定义，以及从机器码到源代码的映射关系，从而实现对 MoonBit 程序的原生源码级调试。

## LLVM 后端的调试信息支持情况

我们目前为 LLVM 后端提供了完整的代码位置映射，以及绝大多数类型和数据结构的调试信息支持。在编译时打开调试选项（`-g`）后，你将可以在调试器中获得准确的代码位置映射，以及打印大多数局部变量的值。经过 LLVM 的统一处理和生成，这些信息在 *nix 平台（Linux 和 MacOS）目标以 DWARF 调试信息的形式输出在目标应用程序中，而在 Windows 平台中会以 CodeView 调试信息的形式输出。

MoonBit 语言的设计使得我们在编写应用程序时，常常会用到一些 调试信息无法直接表示的非平凡数据结构。
- **字符串类型 `String` 和 定长数组类型 `FixedArray[T]`**， 它们的数组长度需要在运行时从对象头中读取，因此无法通过静态的调试信息完整表示；
- **用户自定义枚举类型** `enum` 拥有特殊的内存布局，其中一部分值同样存储在对象头中，这使得调试信息难以直接映射到各枚举情况（variant）及其内部数据结构。

现阶段，我们主要为 *nix 平台的调试信息提供支持，首选的调试器为 LLVM 工具链中的调试器 LLDB。我们为 LLDB 编写了适用于调试信息的自定义脚本，并随工具链分发在 `$MOON_HOME/share/lldb/moonbit.py` 路径下。

对于一些边缘情况，如特殊布局的 `Option[T]` 等，我们的调试信息的支持可能还存在不足。我们将在未来的开发过程中为这些特殊对象布局提供支持。

## 如何调试一个 MoonBit 应用程序

### 运行环境

要使用 LLVM 的调试信息支持，你首先应当使用 LLVM 后端构建你的 MoonBit 应用程序。现阶段，我们只为 _nightly_ 频道的工具链提供了 LLVM 后端的支持。你可以使用以下的命令安装 _nightly_ 频道的工具链：

```Bash
# *nix
curl -fsSL https://cli.moonbitlang.com/install/unix.sh | bash -s nightly

# Windows
$env:MOONBIT_INSTALL_VERSION="nightly"
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser; irm https://cli.moonbitlang.com/install/powershell.ps1 | iex
```

在安装好 _nightly_ 版本的 MoonBit 工具链后，你就可以通过在运行 `moon` 时添加 `--target llvm` 选项的方式使用 LLVM 后端构建应用程序。

本节中使用的调试器均为 LLDB。你可以在你的操作系统的包管理器（如 `apt`、`homebrew`、`pacman` 等）中找到相应的程序包。如果你的系统没有提供 LLDB，也可以在 LLVM 的官网（https://releases.llvm.org/）中选择一个较新版本的 LLVM 工具链安装。

### 构建

如果你调试的应用程序是通过 `moon build` 构建的，你需要传入 `-g` 选项以 debug 模式构建该应用程序。如果你使用 `moon test` 进行测试，默认的构建模式就是 debug 模式，所以你不需要传入额外的参数进行构建。你将能够在 `target/debug/` 目录下找到你构建好的应用程序。

如果你期望在命令行中调试 `moon test` 运行的测试，你可以在 `moon test --target llvm -p <你想要测试的包名> --verbose` 命令的输出中找到执行对应测试所需要的命令行参数，如：

```Bash
/home/me/Projects/core/target/llvm/debug/test/strconv/strconv.blackbox_test.exe double_test.mbt:0-3/number_test.mbt:0-2/uint_test.mbt:0-5/int_test.mbt:0-9/README.mbt.md:0-2
```

如果你使用 MoonBit 插件自带的测试调试集成，则你将不需要手动获取测试参数。

### 使用命令行中的 LLDB 调试

要开始使用 LLDB 进行调试，你需要在你的命令行下执行以下命令（其中 `<your-program-and-args>` 替换为你要运行的应用程序和命令行参数：

```Bash
lldb -o 'command script import ~/.moon/share/lldb/moonbit.py' -- <your-program-and-args>
```

执行命令后，你会在命令行中看到类似以下的输出，说明 LLDB 已经成功加载适用于 MoonBit 的插件，以及准备好执行你选择的应用程序：

```Plain
(lldb) target create "target/llvm/debug/test/strconv/strconv.blackbox_test.exe"
Current executable set to '/home/me/Projects/core/target/llvm/debug/test/strconv/strconv.blackbox_test.exe' (x86_64).
(lldb) settings set -- target.run-args  "double_test.mbt:0-3/number_test.mbt:0-2/uint_test.mbt:0-5/int_test.mbt:0-9/README.mbt.md:0-2"
(lldb) command script import ~/.moon/share/lldb/moonbit.py
(lldb)
```

你可以使用文件名和行号在应用程序中设置断点，比如：

```Plain
(lldb) b double.mbt:70
Breakpoint 1: where = strconv.blackbox_test.exe`$moonbitlang/core/strconv.parse_double + 30 at double.mbt:71:3, address = 0x0000000000025a5e
```

之后，你可以使用 `r` 命令（或者全名 `run`）启动程序。程序会在你设置的断点处暂停。

在这里，你可以使用 LLDB 的指令对程序的当前状态进行查看和测试。例如 `bt` 命令可查看调用栈、`var` 命令查看局部变量等。你也可以使用 `s`（执行下一行）、`si`（执行下一条指令）、`n`（执行下一行，包括函数调用）、`c` （继续执行程序）等指令控制程序的执行流。

![alt text](out-1.gif)

![](https://bxup9uklfcb.feishu.cn/space/api/box/stream/download/asynccode/?code=MTQzNzQxOGY0YzJjZDdlNTkwM2JiMWNiNTgzYTk3MjVfa2xCQ3k4ZjNyR2VGa0k1VmUyTnBaenY3aHl0Ukt6TnlfVG9rZW46RjVQRWJNeVZQb2xlbFR4OFhWc2M4dzdmbjBjXzE3NjE4OTM4MDY6MTc2MTg5NzQwNl9WNA)

```java
(lldb) r
Process 1025295 launched: '/home/me/Projects/core/target/llvm/debug/test/strconv/strconv.blackbox_test.exe' (x86_64)
Process 1025295 stopped
* thread #1, name = 'strconv.blackbo', stop reason = breakpoint 1.1
    frame #0: 0x0000555555579a5e strconv.blackbox_test.exe`$moonbitlang/core/strconv.parse_double(str='9007199254740992e30') at double.mbt:71:3
   68   /// An exponent value exp scales the mantissa (significand) by 10^exp.
   69   /// For example, "1.23e2" represents 1.23 × 10² = 123.
   70   pub fn parse_double(str : String) -> Double!StrConvError {
-> 71     if str.length() == 0 {
   72       syntax_err!()
   73     }
   74     if not(check_underscore(str)) {
(lldb) bt
* thread #1, name = 'strconv.blackbo', stop reason = breakpoint 1.1
  * frame #0: 0x0000555555579a5e strconv.blackbox_test.exe`$moonbitlang/core/strconv.parse_double(str='9007199254740992e30') at double.mbt:71:3
    frame #1: 0x00005555555789f3 strconv.blackbox_test.exe`$moonbitlang/core/strconv_blackbox_test.__test_646f75626c655f746573742e6d6274_0 at double_test.mbt:21:5
    frame #2: 0x0000555555570f6f strconv.blackbox_test.exe`$moonbitlang$core$strconv_blackbox_test$__test_646f75626c655f746573742e6d6274_0$dyncall + 31
    -- snip --
(lldb) n
Process 1025295 stopped
* thread #1, name = 'strconv.blackbo', stop reason = step over
    frame #0: 0x0000555555579e0f strconv.blackbox_test.exe`$moonbitlang/core/strconv.parse_double(str='9007199254740992e30') at double.mbt:91:6
   88           None => syntax_err!()
   89         }
   90     }
-> 91     if str.length() != consumed {
   92       syntax_err!()
   93     }
   94     // Clinger's fast path (How to read floating point numbers accurately)[https://doi.org/10.1145/989393.989430]
(lldb) var
(moonbit_string_t) str = '9007199254740992e30'
($@moonbitlang/core/strconv.Number *) num = 0x0000058a3e031588
(int) consumed = 19
(lldb) var *num
($@moonbitlang/core/strconv.Number) *num = (exponent = 30, mantissa = 9007199254740992, negative = 0, many_digits = 0)
```

如果你希望学习更多 LLDB 的使用方法，请参阅以下材料：

- [LLDB 的官方教程](https://lldb.llvm.org/use/tutorial.html),该教程假设你已经使用过 GDB。

- 其他从零开始使用 LLDB 的教程，比如这个弗吉尼亚大学 [CS2150 课程教案](https://aaronbloomfield.github.io/pdr/tutorials/02-lldb/index.html)


### 使用 VSCode 与 CodeLLDB 调试

在 VSCode 中，使用 [CodeLLDB](https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb) 插件可以获得与 VSCode 本体 GUI 集成的调试体验。

CodeLLDB 依赖 VSCode 的 `launch.json` 配置文件启动调试过程。你可以在你的 VSCode 项目根目录下 `.vscode/launch.json` 中按照如下模板添加你的运行配置。

```json
{
  "configurations": [
    // 如果你已经写了一些配置，可以把下面的对象粘进去
    {
      "type": "lldb",
      "request": "launch",
      "name": "Launch",
      // 替换下面两行
      "program": "你要运行的程序",
      "args": ["程序的命令行输入"],
      "cwd": "${workspaceFolder}",
      "preRunCommands": [
        // 替换成你的 MoonBit 工具链安装位置
        "command script import ~/.moon/share/lldb/moonbit.py"
      ]
    }
  ]
}
```

在调试前，你可以在编辑器的行号附近点击以在你感兴趣的代码处添加或删除断点。之后，点击侧边栏中 _Debug_ 选项卡的开始按钮以启动调试过程。

在调试过程中，你可以使用图形界面查看局部变量和数据结构的值，以及执行执行程序的控制流。

<video controls src={Demo} style={{width: '100%', marginBottom: '1rem'}}></video>
## 总结

随着 LLVM 后端调试器的推出，**MoonBit 实现了原生源码级调试能力，解决了此前依赖 C 代码转换的调试体验问题，为开发者提供了更高效的底层问题定位工具**。这一技术突破不仅完善了语言工具链，更通过支持 DWARF 和 CodeView 调试信息，提升了跨平台开发体验。尽管当前对特殊数据结构（如 String 和 FixedArray）的调试支持仍有优化空间，但 LLDB 插件的引入已为调试流程奠定了坚实基础。

展望未来，MoonBit 团队将持续完善调试功能，计划在 1.0 版本中进一步覆盖边缘场景，同时巩固其在异步编程等关键领域的优势。从 Beta 阶段的稳步迭代到用户规模的快速扩张，MoonBit 正以技术深度与社区活力，向成为现代编程语言生态的重要参与者迈进。