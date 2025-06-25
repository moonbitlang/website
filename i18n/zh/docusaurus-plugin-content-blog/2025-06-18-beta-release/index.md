---
description: "IDEA 编程语言 MoonBit 进入Beta版本，构建下一代基础软件系统入口"
slug: beta-release
image: /img/blogs/zh/2025-06-18-beta-release/cover.png
tags: [MoonBit]
---

# IDEA 编程语言 MoonBit 进入Beta版本，构建下一代基础软件系统入口

![cover](cover.png)

> 软件定义世界，语言定义软件。MoonBit 是AI时代的编程语言，也是下一代基础软件系统的新入口。
>

IDEA研究院编程语言 MoonBit 在架构稳定性和工程实用性上取得关键突破，发布 Beta 版本，正式迈入可落地应用的新阶段，并逐步演进为**可被实际部署的基础设施技术。**

进入 Beta 版本的 MoonBit，具备以下优势特性：

- **语言特性进入稳定期**：目前 MoonBit 已覆盖工业级开发所需的语言特性与工具链支持。现有语法和语义将保持向后兼容，未来的更新将尽量避免破坏性修改。
- **改进流程更标准化**：语言层面的进一步优化将通过公开、透明的 RFC 流程与社区共同讨论，确保演进方向清晰、稳定、可协作。
- **异步支持三大优势**：MoonBit 在语言层面提供了错误处理与异步编程的支持。MoonBit 对错误处理和异步编程的支持有三大优势。
    - **安全性**

        大部分编程语言在静态分析中，彻底放弃错误处理的支持，这意味着任何函数都可以抛出异常，很难写出高可靠性的代码，MoonBit 通过准确的控制流分析，可以完全在编译时期跟踪函数的错误，用户只需要在顶层标记用作文档的签名。这一过程几乎完全由编译器自行推导，而又不像 Java checked exception 那样过于繁琐，对用户带来较高的心智负担；

    - **编写便捷性**

        在 MoonBit 中，带有错误和异步操作的函数使用起来就像普通函数一样便利，无需任何特殊标记，也无需修改程序结构；

    - **可读性**

        MoonBit IDE 会给带错误的函数标注「下划线」、并将异步函数标记为「*斜体*」。用户在编写代码时无需写任何特殊标注，但依然能在阅读代码时快速定位到带有错误/异步的关键操作。


---

## **构筑差异化技术壁垒，构建云原生系统与底层框架**

MoonBit 在语言设计上已达到阶段性稳定，并逐步从实验性工具发展为**可用于实际生产环境的基础技术**，获得技术社区和产业界的关注。

过去几个月，MoonBit 已在多个真实项目中被用于构建云原生系统与底层框架，开始展现工程实用性与生态可塑性。

### **厂商视角：从关注到技术试点**

海外云服务厂商GolemCloud 已通过构建完整的 **MoonBit WebAssembly SDK** 并投入实际运行；成功推动项目收录进入 **Extism 官方插件库** 。

其 CEO **John A. De Goes** 在今年与 MoonBit 团队负责人张宏波于 WASM I/O 会议线下交流后，公开表达了对 MoonBit 技术路线的关注。他在 X 平台表示：

> “MoonBit 融合了 Rust 的语义特性，引入 GC，同时在工具链和性能方面有很多值得深入探索的亮点。”
>

随后他宣布，在 2025 年由 LambdaConf 组织的 **GolemCloud Hackathon** 活动中，将考虑正式采用 MoonBit 作为比赛语言之一。

![1280X1280.PNG](1280X1280.png)

MoonBit 的实际能力也逐渐引起技术型企业关注。**国际知名 AI 工程平台**的开发负责人在社区提出：

> “我们团队正在评估将 MoonBit 用于某个关键系统组件的可行性，希望获得语言作者的付费咨询支持。MoonBit 的架构设计已经接近我们使用的门槛，如果能获得语言团队的技术协作，我们将更有信心在此基础上进行关键性技术投入。”
>

![企业微信截图_1750219884397.png](%E4%BC%81%E4%B8%9A%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_1750219884397.png)

各种信号表明， MoonBit 已不再仅被视为“关注中的技术”，而是开始进入企业的项目选择视野。

### **高校教育：纳入课程实践工具**

因具备现代工具链和更贴近工业实践的语法设计，同时拥有强类型、模式匹配、函数式编程等教学所需的关键语言特性，MoonBit正逐渐得到高校教学的青睐；

今年3月，北京大学研究生院《编程语言的设计原理》课程大纲正式发布，创新性的将MoonBit纳入课程，**取代OCaml成为课程推荐的实践工具**，早前在清华大学暑期实践课程，2024 亚洲和太平洋地区信息学奥林匹克以及中国科学院软件研究院PLCT实验室联合发起的甲辰计划中，MoonBit也已深度参与进入校园。

![e69c18e3-3600-4837-8869-6b5f8b6b1f5b.png](e69c18e3-3600-4837-8869-6b5f8b6b1f5b.png)

---

## **AI 协同开发与国产芯片适配双轨演进**

MoonBit 的技术路线自立项以来始终聚焦两大方向：**AI 协同开发**与**软硬件融合能力**。在 Beta 阶段发布的同时，MoonBit 已逐步建立起一套难以被复制的语言能力边界，这些能力不仅支撑其在研发一线的广泛适配，也为未来生态拓展提供长期技术护城河。

### **面向 AI 协同的开发语言：构建双向智能通道**

随着大模型驱动开发模式的逐步成型，编程语言如何与 AI 高效协作成为关键问题。MoonBit 在语言设计上原生考虑了 AI 编程需求，强调**双向可读性**与**结构性可操作性**：

- **双向可读性**
AI 生成的代码保持高度可读性，结构清晰、风格一致，便于人类理解与接续开发；反向也成立，MoonBit 的语法具备良好的上下文表达力，AI 更容易理解变量作用域、函数调用链、控制结构等核心语义，从而提升补全与重构质量，减少传统编码助手的「断片化建议」。
- **重构安全机制**
借助静态类型系统与编译器推导能力，MoonBit 能对 AI 生成的代码变更进行**自动语义校验**，确保不会破坏原有逻辑，避免因重构带来的回归错误。 这一机制被视为“为 AI 编程加装安全缓冲”，使人机协同在效率与稳定性间取得更好平衡。
- **可感知的调试体验**
传统调试过程往往依赖断点设置和逐步排查，效率受限。MoonBit 引入了 IDE 级别的 `value tracing` 机制，使 AI 能在运行时动态捕捉变量变化轨迹，辅助开发者在无需中断程序的情况下，快速识别异常路径与关键数据状态。
- **模块化构造与多任务 AI 赋能**
MoonBit 的模块化设计使得每个函数、类等语言单元具备高度自治性，AI 可并行处理文档生成、测试覆盖、接口校验等任务，开发者可专注于核心逻辑，从而形成类似“多线程编程”的高效协同开发流程。

从目前已公开的对比数据看，MoonBit 内置的 AI agent moonagent相比 Codex-cli（OpenAI） 可实现近 2 倍提效，支持**多段并发处理**与**智能修改推理**，展现出更强的 AI 编程协同能力。

![a9ea3c33-c96e-4b9b-8469-62f5b364a24a.gif](a9ea3c33-c96e-4b9b-8469-62f5b364a24a.gif)

MoonBit 内置 AI agent（moonagent）与 OpenAI 出品的 codex-cli 工具 在处理同一编程任务时的性能差异

### **向下延伸至国产芯片支持：从工具语言迈向系统构建引擎**

在另一关键维度上，MoonBit 也在积极探索软硬件融合的语言支持能力，特别是在国产芯片架构上的适配上取得突破。

- **面向 RISC-V 与国产嵌入式平台构建** MoonBit 支持原生后端代码生成，可编译为静态链接、零依赖的本地可执行文件。2024 年已完成对 RISC-V 指令集的适配，在无需依赖传统 VM（虚拟机）或运行时环境的前提下，即可部署于多种边缘计算与 IoT 设备中。
- ESP32-C3 是国产主控芯片中使用较广泛的 RISC-V 架构代表。MoonBit 已在该平台上完成编译器适配，并在 QEMU 模拟器 + ST7789 显示器环境中实测，运行效率与 C 语言实现基本相当，延迟控制在 0.5ms 内。

![生名游戏2.png](%E7%94%9F%E5%90%8D%E6%B8%B8%E6%88%8F2.png)

---

## **Beta 版：工具链打磨与语言层面深度融合**

作为最早支持 WebAssembly 的编程语言之一，MoonBit 天然契合**高性能、低延迟、跨平台**的分布式系统开发需求。在浏览器、边缘节点和轻量微服务等场景中，MoonBit 可通过 Wasm 实现快速部署与高度可移植性，同时保持极低运行时开销，为“**一次编写，任意运行**”的开发模式提供了切实可行的路径。

更重要的是，MoonBit 还带来了具备“**修改即响应**”特性的即时反馈开发体验。开发者可直接在 Web 环境中编写、运行与调试代码，极大提升开发效率。这种体验目前在主流语言体系中仍属稀缺，也正是 MoonBit 在工具链打磨与语言层面深度融合下取得的重要成果。

下面是一个著名命令行程序 `cat` 的简单版的 MoonBit 实现。这段程序包含了对多个不同来源操作的错误处理、异步操作等，实际控制流非常复杂。但在 MoonBit 中，这段程序编写起来非常自然简洁，没有任何语法噪音。同时，得益于语法着色，阅读代码时很容易捕捉到几处异步/带错误的关键操作。

<pre className="shiki shiki-themes one-light one-dark-pro" tabIndex={0} style={{backgroundColor: 'rgb(250, 250, 250)', '--shiki-dark-bg': '#282c34', color: 'rgb(56, 58, 66)', '--shiki-dark': '#abb2bf'}}><code><span className="line"><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD', fontStyle:'italic'}}>async</span><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}> fn </span><span style={{color: 'rgb(64, 120, 242)', '--shiki-dark': '#61AFEF', fontStyle: 'italic', textDecoration: 'underline', textUnderlineOffset: '0.3em' }}>cat</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>(</span><span style={{color: 'rgb(228, 86, 73)', '--shiki-dark': '#E06C75'}}>files</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}> : </span><span style={{color: 'rgb(193, 132, 1)', '--shiki-dark': '#E5C07B'}}>ArrayView</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>[</span><span style={{color: 'rgb(193, 132, 1)', '--shiki-dark': '#E5C07B'}}>String</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>]) </span><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}>-&gt;</span><span style={{color: 'rgb(193, 132, 1)', '--shiki-dark': '#E5C07B'}}> Unit</span><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}> raise</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}> {"{"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}>{"  "}if</span><span style={{color: 'rgb(228, 86, 73)', '--shiki-dark': '#E06C75'}}> files</span><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}> is</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}> [] {"{"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#E5C07B'}}>{"    "}@async</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>.stdin.</span><span style={{color: 'rgb(64, 120, 242)', '--shiki-dark': '#61AFEF', fontStyle: 'italic', textDecoration: 'underline', textUnderlineOffset: '0.3em' }}>read_streaming</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>() </span><span style={{color: 'rgb(160, 161, 167)', fontStyle: 'italic', '--shiki-dark': '#7F848E', '--shiki-dark-font-style': 'italic'}}>// read from stdin only once</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>{"  "}{"}"} </span><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}>else</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}> {"{"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}>{"    "}for</span><span style={{color: 'rgb(228, 86, 73)', '--shiki-dark': '#E06C75'}}> file</span><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}> in</span><span style={{color: 'rgb(228, 86, 73)', '--shiki-dark': '#E06C75'}}> files</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}> {"{"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}>{"      "}if</span><span style={{color: 'rgb(228, 86, 73)', '--shiki-dark': '#E06C75'}}> file</span><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}> is</span><span style={{color: 'rgb(80, 161, 79)', '--shiki-dark': '#98C379'}}> "-"</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}> {"{"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#E5C07B'}}>{"        "}@async</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>.stdin.</span><span style={{color: 'rgb(64, 120, 242)', '--shiki-dark': '#61AFEF', fontStyle: 'italic', textDecoration: 'underline', textUnderlineOffset: '0.3em' }}>read_streaming</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>() </span><span style={{color: 'rgb(160, 161, 167)', fontStyle: 'italic', '--shiki-dark': '#7F848E', '--shiki-dark-font-style': 'italic'}}>// read from stdin</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}>{"        "}continue</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>{"      "}{"}"} </span><span style={{color: 'rgb(166, 38, 164)', '--shiki-dark': '#C678DD'}}>else</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}> {"{"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#E5C07B'}}>{"        "}@async</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>.</span><span style={{color: 'rgb(64, 120, 242)', '--shiki-dark': '#61AFEF'}}>path</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>(</span><span style={{color: 'rgb(228, 86, 73)', '--shiki-dark': '#E06C75'}}>file</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>).</span><span style={{color: 'rgb(64, 120, 242)', '--shiki-dark': '#61AFEF', fontStyle: 'italic', textDecoration: 'underline', textUnderlineOffset: '0.3em' }}>read_all</span><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>()</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>{"      "}{"}"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>{"    "}{"}"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>{"  "}{"}"}</span></span>{"\n"}<span className="line"><span style={{color: 'rgb(56, 58, 66)', '--shiki-dark': '#ABB2BF'}}>{"}"}</span></span>{"\n"}</code></pre>

---

## **【READ MORE】MoonBit 的三年探索历程**

近年来，中国在芯片、操作系统、数据库等关键技术领域不断攻坚，已逐步建立起自主生态。然而，国内主流语言的设计、工具链与标准，仍高度依赖于国外技术力量。

在 AI 驱动的软件变革中，如何构建具备本土主导性、面向未来算力架构和智能协同模式的编程语言体系，是我国基础软件领域形成技术护城河的重要课题亟需正视的重要课题。

作为一门具备自主设计、原生 AI 支持、高性能执行能力的静态类型语言，MoonBit 自 2023 首次公开以来，在编译器架构、运行性能、多后端适配和 IDE 工具链等多个维度实现关键突破，并在国际技术社区获得广泛关注。

**2023：核心技术突破与首次公开**

- **发布 WebAssembly 后端**：在体积控制和运行效率方面优于 Rust、Go 等主流语言，尤其适用于边缘计算与资源受限场景。
- **推出工业级在线 IDE**：支持离线运行，首次实现“开箱即用”的云 IDE 原型。

**2024：生态扩张与后端布局**

- **发布 JavaScript 后端**：MoonBit 编译生成的 JS 在实际项目中展现出显著性能优势，引发日本 Zenn.dev 和美国 InfoWorld、《The New Stack》等技术媒体报道。
- **完成三大后端技术布局**：WASM、JavaScript、Native 后端同时落地，覆盖从浏览器到硬件、从前端到系统层的全栈开发场景。
- **原生后端支持 RISC-V**：MoonBit 可生成静态链接、零依赖的可执行文件，在嵌入式、IoT 等领域实现部署落地。
- **获得首批商业用户**：数据库公司燕几图基于 MoonBit 构建相关平台。
- **举办全球创新编程挑战赛**：吸引上千支队伍参与，推动语言在真实项目场景中的应用验证。

**2025：学术融合与国际亮相**

- **纳入北大研究生课程体系**，作为现代语言设计与系统编程的综合教学平台。
- **获得 OS2ATC 年度硬科技创新奖**
- **受邀参加国际学术会议 WASM I/O 和 LambdaConf 发表主旨演讲**，进一步扩大国际影响力。

> IDEA研究院基础软件中心首席科学家张宏波在编程语言与开发工具领域已有近二十年的持续探索。他曾深度参与 OCaml 核心开发、主导创建 ReScript 编程语言，相关成果已被 Meta（Facebook）在 Messenger、Chats 等项目中采用，并参与 Flow 静态类型工具的开发。
>

## 推荐阅读

IDEA 编程语言 MoonBit：为 AI 与大型系统而生，无缝调用 Python：[https://www.moonbitlang.cn/blog/moonbit-x-python](/blog/moonbit-x-python)

IDEA研究院编程语言MoonBit成为北大编程课程语言；LLVM后端同步发布：[https://www.moonbitlang.cn/blog/llvm-backend](/blog/llvm-backend)

IDEA研究院AI原生开发平台MoonBit（月兔）开源核心编译器：[https://www.moonbitlang.cn/blog/compiler-opensource](/blog/compiler-opensource)