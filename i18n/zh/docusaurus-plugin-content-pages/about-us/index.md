---
hide_table_of_contents: true
---

# 关于我们

MoonBit 月兔 是一门通用型编程语言和工具链，专为高性能、资源受限环境而设计。它主要面向云计算、边缘计算和前端开发等应用场景，并支持AI 辅助开发工作流。
MoonBit 提供多后端支持，除 WebAssembly外，MoonBit 还支持生成 JavaScript、本地可执行文件以及 LLVM 目标代码。可部署在云端、边缘、前端与系统级开发等多种场景中。MoonBit 针对 WebAssembly 进行了特别优化， 克服了现有语言（如 Java、Go 和 Rust）在 Wasm 场景中的一些局限，更贴近 WebAssembly 指令集的性能与安全特性。根据已有的对比数据，相较于Rust和Go，MoonBit在 Wasm 后端生成的代码体积更小、运行速度更快。

MoonBit 月兔 最初于 2023 年 8 月 18 日正式对外发布，并在 2025 年 6 月 18 日进入 Beta 阶段，标志着语言核心特性的基本稳定。这一阶段的发布意味着 MoonBit 已具备面向实际项目的使用能力，并将进入以性能优化和生态建设为重点的新阶段。

# 特性

MoonBit 提供类型安全的运行时环境、可预测的性能模型，以及集成的测试、诊断与语义分析工具。其设计注重与开发环境的深度集成，并原生支持基于 AI 的代码生成工作流。

MoonBit 遵循“快速、简洁、可扩展”的设计原则，具备以下核心特性：查看[文档](https://docs.moonbitlang.com/en/latest/)

- [Trait](https://docs.moonbitlang.com/en/latest/language/methods.html)
  特征系统
- [代数数据类型](https://docs.moonbitlang.com/en/latest/language/fundamentals.html#custom-data-types) 与[模式匹配](https://docs.moonbitlang.com/en/latest/language/fundamentals.html#pattern-matching)

- [泛型编程支持](https://docs.moonbitlang.com/en/latest/language/fundamentals.html#generics)

- 轻量级、类型安全的[错误处理机制](https://docs.moonbitlang.com/en/latest/language/error_codes/index.html)

- 内建垃圾回收机制

- [内置测试支持与自动更新功能](https://docs.moonbitlang.com/en/latest/language/tests.html)

- [原生支持异步编程](https://docs.moonbitlang.com/en/latest/language/async-experimental.html)

# 设计理念

MoonBit 的语言设计受 Rust、Go 和 Swift 启发，是一门静态类型语言，具备强类型安全保障。与 Rust 的手动内存管理不同，MoonBit 内置了垃圾回收机制，并基于 WasmGC 提案，实现了 WebAssembly 场景下的自动内存管理。

MoonBit 语言设计在保持性能的同时，也借鉴了 Go 对“简洁性”的强调，旨在降低开发者的心智负担，避免不必要的复杂度。

MoonBit 在架构上原生兼容 大语言模型（LLM），支持 AI 辅助编程。通过实时语义理解、静态类型系统、WebAssembly 沙箱隔离机制以及 死代码消除（DCE） 等优化技术，MoonBit 可实现更安全、可靠的代码生成与运行体验。

# 核心生态组件

MoonBit 配套了多个核心生态工具，构建出完整的语言开发体验：

[Moon](https://docs.moonbitlang.com/en/latest/toolchain/moon/index.html)：MoonBit 原生的构建系统与包管理器，用于组织项目结构、依赖管理与构建流程。

[mooncakes.io](https://docs.moonbitlang.com/en/latest/toolchain/moon/package-manage-tour.html)：MoonBit 的官方包仓库平台，用于发布、管理与分发第三方包。

[FFI（外部函数接口）](https://docs.moonbitlang.com/en/latest/language/ffi.html)支持：可与宿主运行时进行交互，支持嵌入浏览器环境等跨语言调用场景。查看文档

集成开发环境（IDE）与 VS Code 插件：MoonBit 提供了基于浏览器的在线 [IDE（试用地址）](https://try.moonbitlang.com/)，并支持 [Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=moonbit.moonbit-lang)插件。IDE 与编译器共享统一的代码基底，具备容错的类型系统与完整功能的编辑体验。

# 学术与会议展示

2023 年 9 月 26 日，MoonBit 受邀参与香港科技大学（广州）举办的 IoT Thrust Seminar，在专题环节中展示了其在基于 WebAssembly 的云端与边缘计算场景中的应用。

2025 年 3 月，MoonBit 在 WASM I/O 2025 （巴塞罗那）大会上亮相，团队发表演讲《MoonBit & WebAssembly：释放 Wasm 的真正效率》，引发现场热烈反响。

2025年5月，MoonBit 还在 LambdaConf 2025 （美国丹佛）上发表主旨（keynote）演讲。团队在大会上发表主题演讲《MoonBit 与其异步编程模型简介》，分享了语言在统一异步抽象方面的探索与实践。

# 高校采纳

自 2025 年春季学期起，北京大学计算机学院研究生课程《编程语言的设计原理》[课程链接](https://pku-dppl.github.io/2025/english.html)进行了重要教学调整 —— MoonBit 正式替代 OCaml，成为该课程推荐的实践语言。
