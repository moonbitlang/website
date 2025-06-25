---
description: MoonBit 正式开源核心编译器
slug: compiler-opensource
image: /img/blogs/zh/2024-12-18-compiler-opensource/cover.jpg
tags: [MoonBit]
---

# MoonBit 正式开源核心编译器

![cover](cover.jpg)

MoonBit（月兔）AI 原生开发平台今日宣布正式开源其核心编译器 ( WebAssembly 后端)，可在 [GitHub](https://github.com/moonbitlang/moonbit-compiler) 和 [Gitee](https://gitee.com/moonbitlang/moonbit-compiler) 平台查看源码。

作为开放开源的开发平台。MoonBit支持多后端（WebAssembly，JavaScript，Native），全场景开发。

开源 Wasm 后端是 MoonBit 在 2024 年开源计划中的重要里程碑。这一后端是 MoonBit 当前最为成熟的技术模块，运行性能和代码生成体积相比于 Rust 和 Go 均有明显优势。作为工具链中的核心板块，Wasm 编译器在连接语言特性与实际应用方面也发挥着至关重要的作用。

今年以来，MoonBit 已先后开源了[核心标准库](https://github.com/moonbitlang/core)和[构建系统](https://github.com/moonbitlang/moon)，通过不断降低开发门槛和提升工具透明度，吸引了越来越多的开发者加入生态建设。

## 拥抱开源

WebAssembly（Wasm）作为一种高效、安全的跨平台技术，是 MoonBit 重点关注的领域之一。尽管 Wasm 的潜力巨大，但许多现有编程语言未能充分发挥其优势。为了弥补这一空白，MoonBit 创立之初就为 Wasm 做了大量的优化，力求在 Wasm 平台取得数量级的比较优势，并成功因此为吸引到了第一批来自包含欧美、日、韩等国的全球用户。

通过优化 Wasm 组件模型，MoonBit成功将一个简单的 「http-hello-world 」示例的代码体积压缩至 27kB，显著小于许多其他语言，进一步验证了 MoonBit-Wasm 的生产环境应用能力。过去的一年，MoonBit 在此基础上，继续拓展其应用场景成功支持了 JavaScript 和原生后端，未来有望在更多领域发挥作用。

开源 WebAssembly 编译器这一核心技术，未来开发者将有机会亲身体验到 MoonBit 在性能优化方面的卓越成果，进一步巩固了 MoonBit 生态的技术核心同时，也为开发者提供了直接参与技术优化和生态创新的机会。

## 为什么采用宽松版的 SSPL

MoonBit 将始终坚持以开放，开源为核心策略，而且 MoonBit  团队坚信，开发者需要的是透明、可靠的工具，而不是功能受限的“开源核心”（Open-Core）模式。这传递了一个重要信号：MoonBit 对于用户始终保持免费开放，无论何时全球开发者都能享受到最优质稳定可信赖的开发体验。

MoonBit 在 SSPL 的基础上**放宽了两条限制**：

1. MoonBit 编译器生成的成果可以由用户自行选择许可协议，用户拥有为自己的 MoonBit 源代码和生成成果自由选择许可的权利。

2. 编译器的修改在非商业用途下（比如：学术研究）是被允许的。

MoonBit 选择了宽松版的 SSPL 许可协议而不是 MIT 或者 BSD，主要基于以下两点原因：

1. 项目稳定性：MoonBit 目前仍处于测试预览阶段，此时引入硬分叉可能会影响项目的稳定性。团队希望在项目达到更成熟和稳定的状态后，再欢迎社区的广泛贡献。

2. 商业保护：避免大型云服务商利用团队的成果进行商业化，而这些行为可能会削弱团队的努力。

当前，MoonBit 的战略聚焦在用户增长与生态构建。通过培育繁荣的生态系统，团队希望为海量用户带来由 AI 驱动的端到端开发体验，并通过高附加值的云端托管服务释放更大的价值。未来，MoonBit 也将大胆探索软硬件一体化的可能性，以更深度的整合方式打造商业闭环，充分释放技术潜力。

**了解更多**

- [下载 MoonBit](https://www.moonbitlang.cn/download/)
- 探索 [MoonBit 新手指南](https://docs.moonbitlang.com/en/latest/tutorial/tour.html)
- 访问 [MoonBit Language Tour](https://tour.moonbitlang.com/)
- 查看 [MoonBit 文档](https://docs.moonbitlang.com/en/latest/index.html)
