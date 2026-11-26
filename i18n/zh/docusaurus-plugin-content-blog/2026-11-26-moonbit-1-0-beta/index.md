---
description: "11 月 26 日，MoonBit 1.0 编译器现已稳定，在 1.0 正式版发布前只修复缺陷。"
slug: moonbit-1-0-rc
image: /img/blogs/zh/2026-11-26-moonbit-1-0-beta/cover.png
tags: [MoonBit]
---

# MoonBit 1.0 发布！编译器迈入稳定阶段

![](./cover.png)

11 月 26 日，MoonBit 1.0 编译器现已稳定，在 1.0 正式版发布前只修复缺陷。我们计划于 **2027 年 2 月 18 日**发布 1.0 正式版，核心库的稳定版也将同步推出。

核心库中，只有近期新增的 `moonbitlang/core/async` 和 `moonbitlang/core/archive` 仍可能有小幅 API 调整，也会继续修复缺陷。其余包均已稳定。

如果你维护着 MoonBit 软件包，欢迎先用 1.0 release candidate 跑一遍现有测试。更新软件包时，可以用 `moon fix` 应用编译器建议的修复。如果发现编译器出现回归，或某个核心库 API 用起来不顺手，欢迎附上一个尽量精简的示例，方便我们在正式发布前排查。 [安装指南](https://www.moonbitlang.com/download/) · [报告问题](https://github.com/moonbitlang/moonbit-docs/issues) · [讨论核心库 API](https://github.com/moonbitlang/core/issues)

MoonBit 借鉴了 OCaml、Rust、Swift 和 ReScript。团队曾参与 OCaml 开发，并创建了 ReScript。MoonBit 将 Native 和 Wasm 列为一级支持后端。JS 后端则针对浏览器和用户界面做了优化。

2022 年 10 月，我们开始设计 MoonBit，希望它能快速完成大规模静态分析。2024 年，我们将重点转向智能体编程，希望帮助智能体更快地交付可靠、高性能的代码，并通过大规模重构逐步提高 AI 生成代码的质量。

## MoonBit 的主要优势

- **安全。** MoonBit 的类型系统兼顾健全性与表达力，程序运行时不会出现类型错误。我们也重视软件供应链安全。例如，MoonBit 在 WebAssembly 中运行宏，让工具链可以限制依赖项中的宏能访问哪些资源。
- **可验证。** 借助实验性的 `moon prove` 命令，可以证明代码具有某些性质。例如，如果二分查找返回了一个索引，该位置的元素就等于要查找的值。

```moonbit
pub fn binary_search(
  xs : FixedArray[Int32],
  key : Int32,
) -> Int32? where {
  proof_require: sorted(xs), // precondition
  proof_ensure: result => binary_search_ok(xs, key, result), // postcondition
}
```

- **编译快。** 从语言设计到整套工具链，我们都以极快的编译速度为目标。1.0 发布后，编译速度仍将是我们的重点。 [构建系统设计与基准测试](https://www.moonbitlang.cn/blog/build-system-opensource/)
- **运行快。** MoonBit 和 Java、Go 一样是高级语言，并内置了 [SIMD](https://www.moonbitlang.com/pearls/optimize-moonbit-core) 和[值类型](https://www.moonbitlang.cn/blog/moonbit-value-type/)。在 [zlib 等基准测试](https://x.com/bobzhang1988/status/2121510870509613320)中，MoonBit 的表现已能与 Rust 和 C 竞争，还有不少可以继续优化的地方。

## 智能体的代码模式

MoonBit 针对代码模式（code mode）做了优化。在这种模式下，智能体会编写一小段程序来回答问题。比如，你可以问智能体一批拉取请求（PR）提到了哪些 Issue。它可以写个程序，从 JSON 事件中取出 PR 标题，再从标题中提取 Issue 编号。同一套模式匹配工具也可用于读取二进制字段，把原始输入转换成有明确类型的值。得益于快速编译，智能体可以先用一条事件测试脚本，再批量运行。我们的 [MoonBit 代码智能体](https://github.com/moonbitlang/openseek)会在沙箱中运行这些单文件 `.mbtx` 脚本，限制它们可访问的资源。 [代码模式](https://lucumr.pocoo.org/2026/10/6/codemode/) · [智能体如何使用 MoonBit](https://www.moonbitlang.cn/blog/building-agents-moonbit/)

### 匹配 JSON 事件的结构

一个 PR 事件可能有几十个字段。要获取刚开启的 PR 的标题，智能体只需要两个字段。模式会在运行时检查这两个字段。在匹配成功的分支中，编译器知道 `title` 的类型是 `String`。

```moonbit
fn opened_title(event : Json) -> String? {
  match event {
    { "action": "opened", "pull_request": { "title": String(title), .. }, .. } =>
      Some(title)
    _ => None
  }
}
```

### 用 `lexscan` 扫描字符串

标题 `Fix #42 and #108` 提到了两个 Issue。三个分支共用一个 `StringScanner`，每次匹配都会推进扫描位置。遇到 Issue 编号就记下来，普通文本直接跳过。单独出现的 `#` 也会被跳过，扫描可以继续。

```moonbit
fn issue_refs(title : StringView) -> Array[StringView] {
  let refs = []
  let scanner = StringScanner(title)
  for ;; {
    lexscan scanner {
      re"^#[0-9]+" as tag => refs.push(tag)
      re"^[^#]+" => ()
      re"^#" => ()
      _ => break
    }
  }
  refs
}
```

### 用位模式读取二进制字段

IPv4 首部有多长？首字节的高四位存放版本号，低四位存放首部长度。长度以四字节为单位，因此首字节为 `0x46` 时，首部长度为 24 字节。位模式可以直接表达这种布局。

```moonbit
fn ipv4_header_length(packet : BytesView) -> Int? {
  guard packet is [u4be(4), u4be(words), ..] else { return None }
  let length = words.reinterpret_as_int() * 4
  guard 20 <= length && length <= packet.length() else { return None }
  Some(length)
}
```

### 用类型区分解析结果

在 StatsD 消息中，`2|c` 表示给计数器（counter）加 2，`2|g` 表示把仪表值（gauge）设为 2。解析器生成 `Reading` 后，汇总代码就可以用穷尽匹配分别处理这两种读数。新增一个变体时，编译器会指出汇总代码中需要处理它的位置。

```moonbit
enum Reading {
  Counter(Int64)
  Gauge(Int64)
}

fn update(previous : Int64, reading : Reading) -> Int64 {
  match reading {
    Counter(delta) => previous + delta
    Gauge(value) => value
  }
}
```

运行 `moonx udp-report.mbtx`，就能在同一个脚本中看到上述四项功能。脚本根据 JSON 元数据筛选出站数据包，读取二进制首部，扫描 StatsD 负载，最后统计出 5 次命中，负载指标的最终读数为 4。 [GitHub 上的独立脚本](https://github.com/bobzhang/moonbit-code-mode-examples/blob/60347aa9a6682c174fd1864d1365bb640eda2284/udp-report.mbtx)

## 下一步计划

展望 1.0 之后，我们有三个重点。

- **文档和书籍。** 我们会完善语言和核心库指南，并编写 MoonBit 书籍，带读者边学边练，从写下第一个函数到完成一个完整程序。
- **形式化验证工具。** 我们会简化编写契约和运行 `moon prove` 的过程，也会让工具更清楚地指出契约中还有哪些条件需要证明。
- **多线程。** 我们会推进多线程支持，让数据处理程序等应用能够把 CPU 密集型任务分配给多个核心执行。

## 致谢

![](./mooncakes.png)

[Mooncakes 包仓库](https://mooncakes.io/)目前收录了近 **36,000 个包**。感谢每一位发布和维护软件包的贡献者，让更多开发者能在自己的项目里用上这些成果。

我们特别感谢 mizchi 对 MoonBit 生态的贡献。在调优 MoonBit 库的过程中，mizchi 开发了一个内存性能分析工具，改进了核心库中的大整数乘法和数组排序，还向其他开发者分享了如何测量优化效果。在所测工作负载中，JSON 解析器的一项改动使内存分配次数减少了约四分之一。 [mizchi 的性能分析工具](https://github.com/mizchi/moon-pprof) · [MoonBit 优化实践](https://www.moonbitlang.com/pearls/optimize-moonbit-core)

也感谢每一位用几行代码复现问题、写下教程，或帮别人跑通第一个 MoonBit 程序的朋友。在准备 1.0 的过程中，我们从这些真实的使用反馈中学到了很多。许多收获都来自愿意用 MoonBit 解决实际问题、并把使用体验告诉我们的人。



## 相关链接

- [安装指南](https://www.moonbitlang.com/download/)\
  https://www.moonbitlang.com/download/
- [报告问题](https://github.com/moonbitlang/moonbit-docs/issues)\
  https://github.com/moonbitlang/moonbit-docs/issues
- [讨论核心库 API](https://github.com/moonbitlang/core/issues)\
  https://github.com/moonbitlang/core/issues
- [构建系统设计与基准测试](https://www.moonbitlang.cn/blog/build-system-opensource/)\
  https://www.moonbitlang.cn/blog/build-system-opensource/
- [SIMD](https://www.moonbitlang.com/pearls/optimize-moonbit-core)\
  https://www.moonbitlang.com/pearls/optimize-moonbit-core
- [值类型](https://www.moonbitlang.cn/blog/moonbit-value-type/)\
  https://www.moonbitlang.cn/blog/moonbit-value-type/
- [zlib 等基准测试](https://x.com/bobzhang1988/status/2121510870509613320)\
  https://x.com/bobzhang1988/status/2121510870509613320
- [MoonBit 代码智能体](https://github.com/moonbitlang/openseek)\
  https://github.com/moonbitlang/openseek
- [代码模式](https://lucumr.pocoo.org/2026/10/6/codemode/)\
  https://lucumr.pocoo.org/2026/10/6/codemode/
- [智能体如何使用 MoonBit](https://www.moonbitlang.cn/blog/building-agents-moonbit/)\
  https://www.moonbitlang.cn/blog/building-agents-moonbit/
- [GitHub 上的独立脚本](https://github.com/bobzhang/moonbit-code-mode-examples/blob/60347aa9a6682c174fd1864d1365bb640eda2284/udp-report.mbtx)\
  https://github.com/bobzhang/moonbit-code-mode-examples/blob/60347aa9a6682c174fd1864d1365bb640eda2284/udp-report.mbtx
- [Mooncakes 包仓库](https://mooncakes.io)\
  https://mooncakes.io
- [mizchi 的性能分析工具](https://github.com/mizchi/moon-pprof)\
  https://github.com/mizchi/moon-pprof
- [MoonBit 优化实践](https://www.moonbitlang.com/pearls/optimize-moonbit-core)\
  https://www.moonbitlang.com/pearls/optimize-moonbit-core
