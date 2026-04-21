///|
using @html {
  a,
  div,
  h1,
  h2,
  h3,
  nothing,
  p,
  section,
  span,
}

///|
using @rabbita {type Cmd, type Dispatch, type Html}

///|
#cfg(target="js")
extern "js" fn get_html_lang() -> String =
  #| () => document.documentElement.lang || "en"

///|
#cfg(not(target="js"))
fn get_html_lang() -> String {
  "en"
}

///|
fn[T] lang(zh~ : T, en~ : T) -> T {
  if get_html_lang().has_prefix("zh") {
    zh
  } else {
    en
  }
}

///|
struct Model {
  mounted : Bool
}

///|
let init_model : Model = { mounted: true }

///|
enum Msg {
  Noop
}

///|
fn update(dispatch : Dispatch[Msg], msg : Msg, model : Model) -> (Cmd, Model) {
  ignore(dispatch)
  ignore(msg)
  (@rabbita.none, model)
}

///|
struct LinkItem {
  label : String
  url : String
  external : Bool
}

///|
struct Signal {
  value : String
  label : String
}

///|
struct Card {
  badge : String
  stage : String
  category : String
  title : String
  subtitle : String
  desc : String
  fallback : String
  cover : String
  highlights : Array[String]
  tags : Array[String]
  links : Array[LinkItem]
}

///|
struct FinalistProject {
  rank : String
  title : String
  repo_text : String
  repo_url : String
  desc : String
}

///|
struct Step {
  title : String
  desc : String
}

fn link_official_site() -> String {
  "https://www.moonbitlang.com/2026-scc"
}

///|
fn hero_eyebrow() -> String {
  lang(
    zh="2026 MoonBit 软件合成挑战赛",
    en="2026 MoonBit Software Synthesis Challenge",
  )
}

///|
fn hero_title() -> String {
  lang(zh="选手作品展示墙", en="Participant Showcase Wall")
}

///|
fn hero_intro() -> String {
  lang(
    zh="截至 2026 年 4 月 21 日，这一版集中展示当前已经正式启动、并且已经公开 GitHub 仓库的 \{featured_project_count()} 个参赛项目。",
    en="As of April 21, 2026, this edition focuses on \{featured_project_count()} projects that have officially kicked off and already expose a public GitHub repository.",
  )
}

///|
fn hero_note() -> String {
  lang(
    zh="本页当前展示已正式启动且已公开仓库的项目，尚未正式启动或暂未公开仓库的项目暂不在这里展示。",
    en="This page currently features projects that have officially started and already expose a public GitHub repository. Projects that have not started publicly yet or are not public repos are not listed here.",
  )
}

///|
fn btn_official_site() -> String {
  lang(zh="查看赛事官网", en="View Official Contest Page")
}

///|
fn title_slots() -> String {
  ""
}

///|
fn title_steps() -> String {
  lang(
    zh="如果你准备参赛，可以按下面这套信息结构准备材料，后续上墙会非常顺畅",
    en="If you plan to join, this is the information structure your project should be ready to present",
  )
}

///|
fn label_slots() -> String {
  lang(zh="已正式启动项目", en="Officially Started Projects")
}

///|
fn label_steps() -> String {
  lang(zh="如何让作品上墙", en="How To Get Featured")
}

///|
fn label_checklist() -> String {
  lang(zh="建议提前准备的上墙材料", en="Suggested Materials To Prepare")
}

///|
fn label_finalists() -> String {
  lang(zh="初赛入围项目", en="Preliminary Finalists")
}

///|
fn title_finalists() -> String {
  lang(
    zh="以下 10 个项目按赛事海报公布顺序整理，作为本次大型软件合成挑战赛当前正式公布的初赛入围名单。",
    en="The 10 projects below follow the organizer's published finalist poster order and represent the currently announced preliminary-round finalists.",
  )
}

///|
fn finalist_project_label() -> String {
  lang(zh="项目名", en="Project")
}

///|
fn finalist_desc_label() -> String {
  lang(zh="项目介绍", en="Project Summary")
}

///|
fn card_badge() -> String {
  lang(zh="已正式启动", en="Officially Started")
}

///|
fn featured_project_count() -> Int {
  contest_cards().length() + reference_cards().length()
}

///|
fn contest_signals() -> Array[Signal] {
  [
    {
      value: lang(
        zh="\{featured_project_count()} 个项目",
        en="\{featured_project_count()} Projects",
      ),
      label: lang(zh="当前已正式启动并已收录展示", en="Officially started and already featured here"),
    },
    {
      value: lang(zh="公开仓库", en="Public Repos"),
      label: lang(zh="点击卡片即可跳转至作品仓库", en="Click any card to open the project repository"),
    },
    {
      value: lang(zh="公开开发中", en="Open Development"),
      label: lang(zh="这些项目都已进入公开开发阶段", en="Each listed project is already being built in the open"),
    },
    {
      value: lang(zh="2026 年 4 月 21 日", en="April 21, 2026"),
      label: lang(zh="当前整理日期", en="Current curation date"),
    },
  ]
}

///|
fn finalist_projects() -> Array[FinalistProject] {
  [
    {
      rank: "1",
      title: "Moon Lottie",
      repo_text: "github.com/cg-zhou/moon-lottie",
      repo_url: "https://github.com/cg-zhou/moon-lottie",
      desc: lang(
        zh="基于 MoonBit 的 Lottie 动画播放与集成项目，可结合 npm 分发、React 使用，具备完整构建流程。",
        en="A MoonBit-based Lottie playback and integration project designed to work with npm distribution and React usage, with a complete build pipeline already in place.",
      ),
    },
    {
      rank: "2",
      title: lang(zh="定理证明器移植", en="Theorem Prover Port"),
      repo_text: "github.com/Luna-Flow/QED",
      repo_url: "https://github.com/Luna-Flow/QED",
      desc: lang(
        zh="将定理证明器移植到 MoonBit，包含较完整的 kernel、logic、parser、tactics、prover 与命令行工具链。",
        en="Ports a theorem prover to MoonBit, covering a relatively complete kernel, logic, parser, tactics, prover, and command-line toolchain.",
      ),
    },
    {
      rank: "3",
      title: "moon-bash",
      repo_text: "github.com/Haoxincode/MoonBash",
      repo_url: "https://github.com/Haoxincode/MoonBash",
      desc: lang(
        zh="用 MoonBit 实现的 Bash / 类 Shell 项目，提供浏览器演示，覆盖解析、执行与前端展示。",
        en="A Bash-like shell project implemented in MoonBit, with a browser demo that already covers parsing, execution, and frontend presentation.",
      ),
    },
    {
      rank: "4",
      title: "MoonMarkMind",
      repo_text: "github.com/Xiao-li-He/MoonMarkMind",
      repo_url: "https://github.com/Xiao-li-He/MoonMarkMind",
      desc: lang(
        zh="基于 MoonBit 的 Markdown 脑图可视化编辑工具，支持图形化交互与网页展示。",
        en="A MoonBit Markdown mind-map visualization editor that supports graphical interaction and web presentation.",
      ),
    },
    {
      rank: "5",
      title: "morm",
      repo_text: "github.com/oboard/morm",
      repo_url: "https://github.com/oboard/morm",
      desc: lang(
        zh="面向数据库访问场景的轻量 ORM 与 SQL 生成工具，侧重 schema 建模与查询生成。",
        en="A lightweight ORM and SQL generation tool for database access scenarios, focused on schema modeling and query generation.",
      ),
    },
    {
      rank: "6",
      title: "MoonParse",
      repo_text: "github.com/caiklonghuan/MoonParse",
      repo_url: "https://github.com/caiklonghuan/MoonParse",
      desc: lang(
        zh="用 MoonBit 实现的解析工具 / 解析框架，包含 grammar、runtime 与相关解析能力。",
        en="A parser toolchain and parsing framework built in MoonBit, including grammar, runtime, and related parsing capabilities.",
      ),
    },
    {
      rank: "7",
      title: "MoonBitMark",
      repo_text: "github.com/hnlyxiaobing/MoonBitMark",
      repo_url: "https://github.com/hnlyxiaobing/MoonBitMark",
      desc: lang(
        zh="基于 MoonBit 的 Markdown 处理工具，支持一定的文档转换与 MCP 相关能力。",
        en="A MoonBit-based Markdown processing tool with document conversion support and MCP-related capabilities.",
      ),
    },
    {
      rank: "8",
      title: lang(zh="视觉小说引擎项目", en="Visual Novel Engine"),
      repo_text: "github.com/zvmsbackend/reisen",
      repo_url: "https://github.com/zvmsbackend/reisen",
      desc: lang(
        zh="基于 MoonBit 的视觉小说引擎，提供网页预览与模板，可用于构建互动叙事内容。",
        en="A MoonBit visual novel engine with web preview and templates, suitable for building interactive narrative content.",
      ),
    },
    {
      rank: "9",
      title: lang(zh="Quiver 移植", en="Quiver Port"),
      repo_text: "github.com/kokic/kwiver",
      repo_url: "https://github.com/kokic/kwiver",
      desc: lang(
        zh="将 Quiver 类工具移植到 MoonBit，包含可运行的构建、测试与浏览器端界面。",
        en="Ports a Quiver-style tool to MoonBit, including runnable build scripts, tests, and a browser-side interface.",
      ),
    },
    {
      rank: "10",
      title: "MoonECAT",
      repo_text: "github.com/Afate2023/MoonECAT",
      repo_url: "https://github.com/Afate2023/MoonECAT",
      desc: lang(
        zh="基于 MoonBit 的 EtherCAT 相关项目，面向工业通信场景，包含场景分析与 trace 分析能力。",
        en="A MoonBit EtherCAT project aimed at industrial communication scenarios, including scene analysis and trace analysis capabilities.",
      ),
    },
  ]
}

///|
fn contest_cards() -> Array[Card] {
  [
    {
      badge: card_badge(),
      stage: lang(zh="工具链", en="Tooling"),
      category: lang(zh="文档转换", en="Document Conversion"),
      title: "markitdown",
      subtitle: lang(zh="MoonBit 实现的多格式文档转 Markdown 流水线", en="Multi-format document-to-Markdown pipeline in MoonBit"),
      desc: lang(zh="markitdown 通过共享 IR 流水线把 docx、pdf、xlsx、pptx 与 html 转成结构化 Markdown，并围绕主要格式补齐了启发式恢复与回归样例。", en="markitdown converts docx, pdf, xlsx, pptx, and html into structured Markdown through a shared IR pipeline, with heuristic recovery and regression coverage across major formats."),
      fallback: "markitdown",
      cover: "",
      highlights: [
        lang(zh="覆盖 docx、pdf、xlsx、pptx 与 html 等输入格式", en="Covers docx, pdf, xlsx, pptx, and html inputs"),
        lang(zh="采用统一 IR 与 Markdown 输出器", en="Uses a unified IR plus Markdown emitter"),
        lang(zh="配有基于样例的回归验证", en="Built with sample-based regression verification"),
      ],
      tags: [
        "MoonBit",
        "Markdown",
        lang(zh="文档处理", en="Document Processing"),
      ],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/ZSeanYves/markitdown", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="引擎", en="Engine"),
      category: lang(zh="视觉小说", en="Visual Novel"),
      title: "Reisen",
      subtitle: lang(zh="面向浏览器的 MoonBit 视觉小说引擎", en="Browser-oriented visual novel engine built with MoonBit"),
      desc: lang(zh="Reisen 是一个面向浏览器的 MoonBit 视觉小说引擎，仓库已经拆分出 core、assets、engine、app、presenter 等模块，并提供了独立文档站。", en="Reisen is a browser-focused visual novel engine in MoonBit, organized around modular subpackages such as core, assets, engine, app, and presenter, with a dedicated documentation site."),
      fallback: "Reisen",
      cover: "",
      highlights: [
        lang(zh="围绕浏览器交付与交互体验设计", en="Designed for browser delivery and interaction"),
        lang(zh="采用模块化包结构，便于长期演进", en="Modular package layout for long-term evolution"),
        lang(zh="配有文档站与模板仓库，便于上手", en="Ships with docs and a companion template repo"),
      ],
      tags: [
        "MoonBit",
        lang(zh="引擎", en="Engine"),
        lang(zh="视觉小说", en="Visual Novel"),
      ],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/zvmsbackend/reisen", external: true },
        { label: lang(zh="文档站", en="Docs Site"), url: "https://reisen-docs.vercel.app", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="形式化方法", en="Formal Methods"),
      category: lang(zh="定理证明器", en="Theorem Prover"),
      title: "QED",
      subtitle: lang(zh="结合 MoonBit 运行时与 Lean 验证的 kernel-first 定理证明器", en="Kernel-first theorem prover with MoonBit runtime and Lean verification"),
      desc: lang(zh="QED 采用 kernel-first 设计：MoonBit 侧负责可执行、可测试的可信内核与上层封装，Lean 侧负责形式化规范对齐与证明流程。", en="QED follows a kernel-first design: the MoonBit side provides an executable and testable trusted kernel plus upper-layer wrappers, while the Lean side aligns the formal specification and proof workflow."),
      fallback: "QED",
      cover: "",
      highlights: [
        lang(zh="以可信内核作为整个实现的核心", en="Trusted kernel is the center of the implementation"),
        lang(zh="把运行时工程与形式化审计清晰分层", en="Separates runtime engineering from formal auditing"),
        lang(zh="在内核之上继续扩展 logic 与 tactics 层", en="Includes logic and tactics layers above the kernel"),
      ],
      tags: [
        "MoonBit",
        "Lean",
        lang(zh="定理证明", en="Theorem Prover"),
      ],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/Luna-Flow/QED", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="交互工具", en="Interactive Tool"),
      category: lang(zh="图表编辑器", en="Diagram Editor"),
      title: "kwiver",
      subtitle: lang(zh="Quiver 交换图编辑器的社区重实现", en="Community reimplementation of the Quiver commutative diagram editor"),
      desc: lang(zh="kwiver 是对 Quiver 交换图编辑器的社区重实现，仓库里已经给出 JS FFI 边界说明和一版可继续扩展的浏览器 demo 骨架。", en="kwiver is a community-driven reimplementation of the Quiver commutative diagram editor, with documented JS FFI boundaries and a first-pass browser demo scaffold already in the repository."),
      fallback: "kwiver",
      cover: "",
      highlights: [
        lang(zh="对现代交换图编辑体验进行重建", en="Recreates a modern diagram editing experience"),
        lang(zh="清楚记录了 JS FFI 接入边界", en="Documents the JS FFI integration boundary clearly"),
        lang(zh="包含端到端浏览器 demo 骨架", en="Includes an end-to-end browser demo scaffold"),
      ],
      tags: [
        "MoonBit",
        lang(zh="编辑器", en="Editor"),
        lang(zh="交换图", en="Diagram"),
      ],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/kokic/kwiver", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="工业通信", en="Industrial Communication"),
      category: lang(zh="EtherCAT 主站", en="EtherCAT Master"),
      title: "MoonECAT",
      subtitle: lang(zh="面向 ETG.1500 Class B 的模块化 EtherCAT 主站库", en="Modular EtherCAT master library targeting ETG.1500 Class B"),
      desc: lang(zh="MoonECAT 是一个用 MoonBit 编写的模块化 EtherCAT 主站库，仓库已经拆分出 HAL、protocol、mailbox、runtime 与 CLI 层，并提供了用于测试的 mock 后端。", en="MoonECAT is a modular EtherCAT master library in MoonBit. Its repository already separates HAL, protocol, mailbox, runtime, and CLI layers, and includes a mock backend for testing."),
      fallback: "MoonECAT",
      cover: "",
      highlights: [
        lang(zh="将硬件抽象、协议、邮箱与运行时清晰分层", en="Splits hardware, protocol, mailbox, and runtime layers"),
        lang(zh="提供 mock loopback 后端用于验证", en="Provides a mock loopback backend for validation"),
        lang(zh="带有独立的 moonecat 命令行入口", en="Includes a dedicated moonecat command-line entry"),
      ],
      tags: [
        "MoonBit",
        "EtherCAT",
        lang(zh="工业控制", en="Industrial Control"),
      ],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/Afate2023/MoonECAT", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="运行时沙箱", en="Runtime Sandbox"),
      category: lang(zh="POSIX Shell", en="POSIX Shell"),
      title: "MoonBash",
      subtitle: lang(zh="由 MoonBit 编译到纯 JavaScript 的零依赖 POSIX Shell 沙箱", en="Zero-dependency POSIX shell sandbox compiled from MoonBit to pure JavaScript"),
      desc: lang(zh="MoonBash 用 MoonBit 重写 just-bash，目标是为 AI Agent、Edge 函数、浏览器终端等场景提供零依赖、纯内存的 Shell 沙箱。", en="MoonBash rewrites just-bash with MoonBit to provide a zero-dependency, pure-memory shell sandbox for AI agents, edge functions, browser terminals, and other embedded scenarios."),
      fallback: "MoonBash",
      cover: "",
      highlights: [
        lang(zh="编译结果是纯 JavaScript，不依赖 WASM", en="Compiles to pure JavaScript without a WASM dependency"),
        lang(zh="面向智能体、Serverless 与浏览器嵌入场景", en="Designed for agents, serverless, and browser embedding"),
        lang(zh="在保持沙箱能力的同时扩展命令覆盖面", en="Expands the command surface while staying sandboxed"),
      ],
      tags: [
        "MoonBit",
        "Shell",
        "AI Agent",
      ],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/Haoxincode/MoonBash", external: true },
      ],
    },
  ]
}

///|
fn reference_cards() -> Array[Card] {
  [
    {
      badge: card_badge(),
      stage: lang(zh="数据层", en="Data Layer"),
      category: lang(zh="ORM 工具包", en="ORM Toolkit"),
      title: "morm",
      subtitle: lang(zh="带有代码生成与查询构建器的轻量级 MoonBit ORM", en="Lightweight MoonBit ORM with code generation and query builders"),
      desc: lang(zh="morm 把 schema 实体、生成后的 MoonBit 代码、查询构建器与执行引擎拆开设计，并且明确避免运行时反射与隐藏状态。", en="morm separates schema entities, generated MoonBit code, query builders, and execution engines. The project intentionally avoids runtime reflection and hidden ORM state."),
      fallback: "morm",
      cover: "",
      highlights: [
        lang(zh="通过 `#morm.entity` 元数据与 mapper 生成组织模型", en="Uses `#morm.entity` metadata and generated mappers"),
        lang(zh="把查询意图与执行行为清楚分离", en="Keeps query intent and execution behavior explicitly separated"),
        lang(zh="提供独立项目站点承载文档", en="Provides a dedicated project site for documentation"),
      ],
      tags: ["MoonBit", "ORM", "SQL"],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/oboard/morm", external: true },
        { label: lang(zh="项目站点", en="Project Site"), url: "https://morm.oboard.fun", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="工具链", en="Tooling"),
      category: lang(zh="Markdown 引擎", en="Markdown Engine"),
      title: "MoonBitMark",
      subtitle: lang(zh="带有 CLI 与实验性 MCP 入口的文档转 Markdown 引擎", en="Document-to-Markdown engine with CLI and experimental MCP entrypoint"),
      desc: lang(zh="MoonBitMark 提供共享的文档转 Markdown 流水线，既有 CLI 前端，也带实验性的 MCP STDIO 入口，覆盖文本、Office 文档、PDF、图片与 URL。", en="MoonBitMark is a shared document-to-Markdown pipeline with a CLI frontend and an experimental MCP STDIO entrypoint, covering text, office formats, PDFs, images, and URLs."),
      fallback: "MoonBitMark",
      cover: "",
      highlights: [
        lang(zh="支持 TXT、CSV、JSON、PDF、图片、HTML、DOCX、PPTX 与 XLSX", en="Supports TXT, CSV, JSON, PDF, images, HTML, DOCX, PPTX, and XLSX"),
        lang(zh="同时提供 CLI 工作流与面向 MCP 的接口", en="Combines a CLI workflow with an MCP-facing interface"),
        lang(zh="在多种输入格式之间保持统一转换路径", en="Keeps the conversion path unified across input formats"),
      ],
      tags: ["MoonBit", "Markdown", "MCP"],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/hnlyxiaobing/MoonBitMark", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="图形渲染", en="Graphics"),
      category: lang(zh="动画播放器", en="Animation Player"),
      title: "moon-lottie",
      subtitle: lang(zh="带在线演示的原生 MoonBit Lottie 动画播放器", en="Native MoonBit Lottie animation player with live demo"),
      desc: lang(zh="moon-lottie 直接用 MoonBit 实现 Lottie 动画播放器，已经提供在线演示，并公开测试与覆盖率状态来支撑持续渲染迭代。", en="moon-lottie implements a Lottie animation player directly in MoonBit, with a live demo plus visible test and coverage status to support ongoing rendering work."),
      fallback: "moon-lottie",
      cover: "",
      highlights: [
        lang(zh="支持常见图形、填充、描边、渐变与 Trim Path", en="Supports common shapes, fills, strokes, gradients, and trim paths"),
        lang(zh="覆盖图层、预合成、蒙版与 Matte 效果", en="Handles layers, precompositions, masks, and matte effects"),
        lang(zh="提供可直接查看效果的在线演示", en="Ships with a public live demo for direct inspection"),
      ],
      tags: ["MoonBit", "Lottie", lang(zh="动画", en="Animation")],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/cg-zhou/moon-lottie", external: true },
        { label: lang(zh="在线演示", en="Live Demo"), url: "https://lottie.cg-zhou.top", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="应用项目", en="Application"),
      category: lang(zh="持续构建", en="Ongoing Build"),
      title: "MoonAP",
      subtitle: lang(zh="一个持续迭代中的 MoonBit 公开项目", en="A public MoonBit project under active iteration"),
      desc: lang(zh="MoonAP 已经公开了基础仓库结构与源码入口，README 也明确说明后续会继续逐步扩展实现内容。", en="MoonAP has already opened its repository structure and source entrypoint, and the README explicitly states that the project will keep expanding its implementation step by step."),
      fallback: "MoonAP",
      cover: "",
      highlights: [
        lang(zh="从一开始就公开源码与模块入口", en="Keeps the source and module entrypoint public from the start"),
        lang(zh="为后续功能的逐步扩展预留了空间", en="Leaves room for the feature set to grow incrementally"),
        lang(zh="适合公开开发、持续迭代的工程路线", en="Fits a public-build, iteration-driven engineering workflow"),
      ],
      tags: ["MoonBit", lang(zh="应用", en="App"), lang(zh="迭代", en="Iteration")],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/tangmaomao16/MoonAP", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="创作工具", en="Creative Tools"),
      category: lang(zh="2D 动画", en="2D Animation"),
      title: "Enimate",
      subtitle: lang(zh="用 MoonBit 构建的跨平台 2D 动画工具", en="Cross-platform 2D animation tool built with MoonBit"),
      desc: lang(zh="Enimate 是一个用 MoonBit 构建的跨平台 2D 动画工具，已经拥有独立项目站点，仓库也提供了品牌素材与文档资源。", en="Enimate is a cross-platform 2D animation tool built with MoonBit, with a dedicated project site and a repository that already includes branding and documentation assets."),
      fallback: "Enimate",
      cover: "",
      highlights: [
        lang(zh="面向跨平台动画创作工作流", en="Targets cross-platform animation creation workflows"),
        lang(zh="直接以 MoonBit 作为创作工具底座", en="Builds directly on MoonBit for creative tooling"),
        lang(zh="拥有独立的公开项目网站", en="Has a dedicated public website for the project"),
      ],
      tags: ["MoonBit", lang(zh="动画", en="Animation"), lang(zh="创作工具", en="Creative Tools")],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/enimate/enimate", external: true },
        { label: lang(zh="官网", en="Official Site"), url: "https://enimate.art", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="系统实验", en="Systems Lab"),
      category: lang(zh="RISC-V 工具链", en="RISC-V Toolkit"),
      title: "MoonRV Lab",
      subtitle: lang(zh="MoonBit 编写的 RISC-V 二进制分析与执行实验平台", en="RISC-V binary analysis and execution lab built in MoonBit"),
      desc: lang(zh="MoonRV Lab / rvkit 已经把静态分析、ELF 与 RAW 执行、离线 workbench 和在线 `/workbench` 工作台串成一条可演示、可回归的公开链路。", en="MoonRV Lab / rvkit already connects static analysis, ELF and RAW execution, offline workbench output, and an online `/workbench` into a public flow that is easy to demo and regression-test."),
      fallback: "MoonRV Lab",
      cover: "",
      highlights: [
        lang(zh="覆盖反汇编、CFG、callgraph、analyze 与 decompile 等静态分析入口", en="Covers disassembly, CFG, callgraph, analyze, and decompile entrypoints"),
        lang(zh="默认 RV64，并显式支持 RV32 与 RAW 输入执行", en="Defaults to RV64 while explicitly supporting RV32 and RAW execution"),
        lang(zh="同时提供离线 HTML workbench 与在线工作台", en="Provides both offline HTML workbench output and an online workbench"),
      ],
      tags: ["MoonBit", "RISC-V", lang(zh="二进制分析", en="Binary Analysis")],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/wzzc-dev/moon_rv_lab", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="原生 GUI", en="Native GUI"),
      category: lang(zh="Qt 绑定", en="Qt Binding"),
      title: "qt.mbt",
      subtitle: lang(zh="面向 Qt Widgets 的 MoonBit 原生绑定", en="MoonBit native binding for Qt Widgets"),
      desc: lang(zh="qt.mbt 以 Qt Widgets 为核心，目标是在 MoonBit 侧尽量保留 Qt 原本的对象模型与编程风格，当前已经给出可运行示例、C++ stub 和原生构建脚本。", en="qt.mbt centers on Qt Widgets and aims to preserve Qt's original object model and programming style on the MoonBit side. The repository already ships runnable examples, C++ stubs, and native build scripts."),
      fallback: "qt.mbt",
      cover: "",
      highlights: [
        lang(zh="尽量保留 Qt 原生子类型关系与调用习惯", en="Tries to preserve Qt's subtype relations and native coding style"),
        lang(zh="仓库内附有计数器等可运行示例", en="Includes runnable examples such as a counter app"),
        lang(zh="配有 AI_BINDING_GUIDE 与 prebuild 配置脚本", en="Includes an AI binding guide plus a prebuild configuration script"),
      ],
      tags: ["MoonBit", "Qt", "GUI"],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/KeqingMoe/qt.mbt", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="智能体基础设施", en="Agent Infrastructure"),
      category: lang(zh="CLI 调度", en="CLI Orchestration"),
      title: "ClawTeam",
      subtitle: lang(zh="基于 MoonBit 的多智能体 CLI 调度层", en="MoonBit-based multi-agent CLI orchestration layer"),
      desc: lang(zh="ClawTeam 把自己严格限定为纯调度层：通过聊天式交互统一编排 Claude Code、Codex、Gemini 等外部 CLI，负责消息路由、PTY 调用、任务触发与执行审计。", en="ClawTeam deliberately stays a pure orchestration layer: it coordinates external CLIs such as Claude Code, Codex, and Gemini through chat-style interaction, while owning message routing, PTY execution, job triggering, and audit trails."),
      fallback: "ClawTeam",
      cover: "",
      highlights: [
        lang(zh="强调“只做调度，不做业务逻辑”", en="Deliberately focuses on orchestration instead of business logic"),
        lang(zh="围绕 PTY 调用、任务触发与多渠道接入设计", en="Built around PTY execution, job triggering, and multi-channel ingress"),
        lang(zh="把执行审计与人工确认节点纳入主流程", en="Treats execution audit and human approval nodes as first-class workflow pieces"),
      ],
      tags: ["MoonBit", "CLI", "AI Agent"],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/vicoproplus/clawteam", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="增长工具", en="Growth Tooling"),
      category: lang(zh="SEO 落地页", en="SEO Landing Pages"),
      title: "MoonSEO",
      subtitle: lang(zh="把品牌 brief 变成可审计 SEO 落地页的 MoonBit MVP", en="MoonBit MVP that turns a brand brief into an auditable SEO landing page"),
      desc: lang(zh="MoonSEO 以 MoonBit 为核心，接收品牌名、关键词与事实约束，生成 SEO 落地页草稿，随后做确定性的规则审计，并导出静态 HTML 交付物。", en="MoonSEO puts MoonBit at the center: it takes a brand brief, keyword, and approved facts, generates an SEO landing-page draft, audits it with deterministic checks, and exports a static HTML deliverable."),
      fallback: "MoonSEO",
      cover: "",
      highlights: [
        lang(zh="在浏览器里完成草稿生成、审计与预览", en="Generates, audits, and previews the page directly in the browser"),
        lang(zh="检查标题、meta、关键词覆盖、证据锚点与 claim safety", en="Audits title, meta, keyword coverage, evidence anchors, and claim safety"),
        lang(zh="可导出独立静态 HTML 结果", en="Exports a standalone static HTML result"),
      ],
      tags: ["MoonBit", "SEO", "HTML"],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/lauraraccoon/MoonSEO", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="知识工具", en="Knowledge Tool"),
      category: lang(zh="文档问答", en="Document QA"),
      title: "moonbook",
      subtitle: lang(zh="浏览器本地运行的文档智能问答系统", en="Local-in-browser document intelligence and QA system"),
      desc: lang(zh="moonbook 参考 NotebookLM 路线，强调零部署、本地优先和隐私友好，计划让 MoonBit 在浏览器里承担文档解析、语义分块、BM25 检索与状态编排等核心职责。", en="moonbook follows a NotebookLM-style direction with a zero-deploy, local-first, privacy-friendly architecture. MoonBit is expected to own the browser-side core such as parsing, semantic chunking, BM25 retrieval, and state orchestration."),
      fallback: "moonbook",
      cover: "",
      highlights: [
        lang(zh="核心路径定位为纯浏览器、本地优先架构", en="Targets a browser-only, local-first core workflow"),
        lang(zh="支持带来源引用的 RAG 问答与知识卡片", en="Plans source-grounded RAG answers plus study cards"),
        lang(zh="强调用 MoonBit 承担浏览器端核心引擎", en="Emphasizes MoonBit as the browser-side core engine"),
      ],
      tags: ["MoonBit", "RAG", lang(zh="知识库", en="Knowledge Base")],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/feishiheng/moonbook", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="金融工程", en="Fintech"),
      category: lang(zh="量化回测", en="Quant Backtesting"),
      title: "alpha",
      subtitle: lang(zh="类型安全的 MoonBit 量化交易回测框架", en="Type-safe quantitative trading backtesting framework in MoonBit"),
      desc: lang(zh="alpha 面向量化交易回测场景，已经公开 CLI 入口、文档索引与测试覆盖率信息，围绕类型安全与可验证工程路径组织仓库结构。", en="alpha targets quantitative trading backtesting and already exposes a CLI entrypoint, documentation index, and visible test-coverage status, with the repository organized around a type-safe and verifiable engineering path."),
      fallback: "alpha",
      cover: "",
      highlights: [
        lang(zh="强调类型安全的量化回测核心", en="Builds around a type-safe backtesting core"),
        lang(zh="README 中已整理快速上手与文档入口", en="README already points to quickstart and documentation entrypoints"),
        lang(zh="公开展示当前测试覆盖率与项目状态", en="Publicly exposes test coverage and project status"),
      ],
      tags: ["MoonBit", "Quant", "Backtest"],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/retfings/alpha", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="智能体平台", en="Agent Platform"),
      category: lang(zh="工作流编排", en="Workflow Orchestration"),
      title: "moonflow",
      subtitle: lang(zh="类似 Dify / Coze 的 MoonBit AI Agent 工作流编排平台", en="MoonBit AI agent workflow orchestration platform in the Dify / Coze vein"),
      desc: lang(zh="moonflow 把 Web Studio、Workflow DSL、执行运行时与组件市场组织成一个完整平台，希望用 MoonBit 提供高并发调度、安全隔离与自然语言到工作流代码的转换链路。", en="moonflow combines a Web Studio, workflow DSL, execution runtime, and component marketplace into a single platform, aiming to use MoonBit for high-concurrency scheduling, security isolation, and natural-language-to-workflow code generation."),
      fallback: "moonflow",
      cover: "",
      highlights: [
        lang(zh="包含可视化 DAG 编排与实时预览", en="Includes visual DAG orchestration and live preview"),
        lang(zh="把运行时调度、隔离和状态存储作为核心能力", en="Treats runtime scheduling, isolation, and state storage as core capabilities"),
        lang(zh="同时考虑本地模式与服务端部署", en="Considers both standalone local mode and server deployment"),
      ],
      tags: ["MoonBit", "AI Agent", "Workflow"],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/shee333/moonflow", external: true },
      ],
    },
    {
      badge: card_badge(),
      stage: lang(zh="3D 引擎", en="3D Engine"),
      category: lang(zh="体素叙事", en="Voxel Narrative"),
      title: "MoonPalace",
      subtitle: lang(zh="面向 Aetheria3D / VoxStory 的 MoonBit 3D 引擎与工具链", en="MoonBit 3D engine and toolchain for Aetheria3D / VoxStory"),
      desc: lang(zh="MoonPalace 当前公开的 `windows-build-setup` 分支把重点放在 Aetheria3D 的 Windows 原生构建、Raylib FFI 外壳与后续体素化、状态机、渲染管线规划上。", en="MoonPalace's current public `windows-build-setup` branch focuses on Windows-native builds for Aetheria3D, the Raylib FFI shell, and the next steps for voxel processing, state machines, and rendering pipelines."),
      fallback: "MoonPalace",
      cover: "",
      highlights: [
        lang(zh="已经给出 Raylib FFI 外壳与 Windows 原生构建路径", en="Already provides a Raylib FFI shell and a Windows-native build path"),
        lang(zh="同时预留 Wasm 预览路线", en="Also keeps a Wasm preview path in view"),
        lang(zh="公开了 Aetheria3D 的分阶段开发计划", en="Publishes a staged development plan for Aetheria3D"),
      ],
      tags: ["MoonBit", "3D", "Raylib"],
      links: [
        { label: lang(zh="GitHub 仓库", en="GitHub Repo"), url: "https://github.com/MrsFlower/MoonPalace", external: true },
        { label: lang(zh="公开分支", en="Public Branch"), url: "https://github.com/MrsFlower/MoonPalace/tree/windows-build-setup", external: true },
      ],
    },
    backfill_card("MoonMarkMind", "https://github.com/Xiao-li-He/MoonMarkMind"),
    backfill_card("MoonParse", "https://github.com/caiklonghuan/MoonParse"),
    backfill_card("yuecharts", "https://github.com/OverflowCat/yuecharts"),
    backfill_card("FlowLabLite", "https://github.com/YuFenfen-ai/FlowLabLite"),
    backfill_card("MoonForge", "https://github.com/helloLeila/MoonForge"),
    backfill_card("moonink", "https://github.com/Kozmosa/moonink"),
    backfill_card("magpiedb", "https://github.com/codeworm96/magpiedb"),
    backfill_card("mengxi", "https://github.com/MaoDingA/mengxi"),
    backfill_card("MetaEditor", "https://github.com/ch3coohlink/MetaEditor"),
    backfill_card("cogna", "https://github.com/cogna-dev/cogna"),
    backfill_card("AstrClaw", "https://github.com/EinoPlasma/AstrClaw/blob/master/README.md"),
  ]
}

///|
fn backfill_card(title : String, url : String) -> Card {
  {
    badge: card_badge(),
    stage: lang(zh="公开仓库", en="Public Repo"),
    category: lang(zh="待补简介", en="Profile Pending"),
    title,
    subtitle: lang(zh="已补充到展示墙的参赛项目仓库", en="Contest repository added to the showcase"),
    desc: lang(zh="该项目链接已补充到展示页，后续可以继续补充更完整的项目介绍、亮点和演示信息。", en="This project link has been added to the showcase. A fuller project profile, highlights, and demo links can be added later."),
    fallback: title,
    cover: "",
    highlights: [
      lang(zh="公开 GitHub 页面已接入展示墙", en="Public GitHub page is now linked from the showcase"),
      lang(zh="可直接查看 README、源码与提交记录", en="Open README, source code, and commit history directly"),
      lang(zh="后续可继续补充 Demo 与项目说明", en="Demo links and project details can be added later"),
    ],
    tags: ["MoonBit", "GitHub", lang(zh="公开项目", en="Open Project")],
    links: [
      { label: lang(zh="GitHub 页面", en="GitHub Page"), url, external: true },
    ],
  }
}

///|
fn steps() -> Array[Step] {
  [
    {
      title: lang(zh="1. 用明确范围提交申报", en="1. Apply with a concrete scope"),
      desc: lang(zh="说明工程目标、目标用户、系统架构思路与可行性。赛事更偏好具备长期演进空间的系统型软件。", en="Describe the engineering goal, target users, architecture idea, and feasibility. The challenge favors system-level software with room to evolve."),
    },
    {
      title: lang(zh="2. 公开开发并完善交付", en="2. Build in the open"),
      desc: lang(zh="准备公开 GitHub 仓库、清晰 README、可运行流程、核心路径测试，以及简明的开发复盘，说明 AI 工具如何参与。", en="Prepare a public GitHub repository, clear README, runnable workflow, tests for core paths, and a concise retrospective on how AI tools participated."),
    },
    {
      title: lang(zh="3. 正式启动后收录展示", en="3. Start publicly and get listed"),
      desc: lang(zh="项目正式启动并进入公开开发后，即可收录到本页展示。后续答辩与遴选安排会根据赛事节奏继续推进。", en="Projects can be listed here once they have officially kicked off and moved into public development. Later-stage reviews and selection rounds will continue with the contest timeline."),
    },
  ]
}

///|
fn checklist_items() -> Array[String] {
  [
    lang(zh="公开 GitHub 仓库，并保留完整开发历史", en="A public GitHub repository with commit history preserved"),
    lang(zh="README 清楚写明目标、范围、使用方式与环境要求", en="README covering goals, scope, usage, and environment requirements"),
    lang(zh="核心流程具备可构建、可运行、可复现路径", en="A reproducible build/run path for the core workflow"),
    lang(zh="关键路径与边界情况具备测试或验证材料", en="Tests or validation material for key paths and edge cases"),
    lang(zh="强烈建议补充 Demo 视频、截图或在线体验链接", en="Optional but highly recommended: demo video, screenshots, or deployment links"),
  ]
}

///|
fn view_link(link : LinkItem) -> Html {
  if link.external {
    a(class="rsc-link", href=link.url, target=Blank, link.label)
  } else {
    a(class="rsc-link", href=link.url, link.label)
  }
}

///|
fn view_signal(signal : Signal) -> Html {
  div(class="rsc-signal-card", [
    h3(class="rsc-signal-value", signal.value),
    p(class="rsc-signal-label", signal.label),
  ])
}

///|
fn view_finalist(finalist : FinalistProject) -> Html {
  div(class="rsc-finalist-row", [
    div(class="rsc-finalist-project", [
      div(class="rsc-finalist-title-row", [
        span(class="rsc-finalist-rank", finalist.rank),
        h3(class="rsc-finalist-title", finalist.title),
      ]),
      a(
        class="rsc-finalist-repo",
        href=finalist.repo_url,
        target=Blank,
        finalist.repo_text,
      ),
    ]),
    p(class="rsc-finalist-desc", finalist.desc),
  ])
}

///|
fn view_card(card : Card) -> Html {
  ignore(card.badge)
  ignore(card.cover)
  ignore(card.fallback)
  div(class="rsc-card", [
    if card.links.length() > 0 {
      let primary_link = card.links[0]
      a(class="rsc-card-overlay", href=primary_link.url, target=Blank, [
        span(
          class="rsc-sr-only",
          lang(
            zh="\{card.title} 仓库",
            en="\{card.title} repository",
          ),
        ),
      ])
    } else {
      nothing
    },
    div(class="rsc-card-body", [
      div(
        class="rsc-meta-row",
        [
          span(class="rsc-meta-pill", card.stage),
          span(class="rsc-meta-pill", card.category),
        ],
      ),
      h3(class="rsc-card-title", card.title),
      p(class="rsc-card-subtitle", card.subtitle),
      p(class="rsc-card-desc", card.desc),
      div(
        class="rsc-highlights",
        card.highlights.map(fn(item) {
          div(class="rsc-highlight", item)
        }),
      ),
      div(
        class="rsc-tags",
        card.tags.map(fn(tag) {
          span(class="rsc-tag", tag)
        }),
      ),
      div(class="rsc-links", card.links.map(fn(link) { view_link(link) })),
    ]),
  ])
}

///|
fn view_step(step : Step) -> Html {
  div(class="rsc-step-card", [
    h3(class="rsc-step-title", step.title),
    p(class="rsc-step-desc", step.desc),
  ])
}

///|
fn view_checklist() -> Html {
  div(class="rsc-check-panel", [
    p(class="rsc-section-label", label_checklist()),
    div(
      class="rsc-check-list",
      checklist_items().map(fn(item) {
        div(class="rsc-check-item", item)
      }),
    ),
  ])
}

///|
fn view_section(label : String, title : String, cards : Array[Card]) -> Html {
  section(class="rsc-section", [
    div(class="rsc-section-head", [
      p(class="rsc-section-label", label),
      if title == "" {
        nothing
      } else {
        h2(class="rsc-section-title", title)
      },
    ]),
    div(class="rsc-grid", cards.map(fn(card) { view_card(card) })),
  ])
}

///|
fn view_finalists() -> Html {
  section(class="rsc-section", [
    div(class="rsc-section-head", [
      p(class="rsc-section-label", label_finalists()),
      h2(class="rsc-section-title rsc-section-title--subtle", title_finalists()),
    ]),
    div(class="rsc-finalist-board", [
      div(class="rsc-finalist-head", [
        span(class="rsc-finalist-head-cell", finalist_project_label()),
        span(class="rsc-finalist-head-cell", finalist_desc_label()),
      ]),
      div(
        class="rsc-finalist-list",
        finalist_projects().map(fn(finalist) { view_finalist(finalist) }),
      ),
    ]),
  ])
}

///|
fn view_hero() -> Html {
  section(class="rsc-hero", [
    div(class="rsc-hero-copy", [
      p(class="rsc-eyebrow", hero_eyebrow()),
      h1(class="rsc-hero-title", hero_title()),
      p(class="rsc-hero-intro", hero_intro()),
      p(class="rsc-hero-note", hero_note()),
      div(class="rsc-actions", [
        a(class="rsc-btn rsc-btn--primary", href=link_official_site(), target=Blank, btn_official_site()),
      ]),
    ]),
    div(class="rsc-signal-grid", contest_signals().map(fn(signal) { view_signal(signal) })),
  ])
}

///|
fn view_steps() -> Html {
  section(class="rsc-section", [
    div(class="rsc-section-head", [
      p(class="rsc-section-label", label_steps()),
      h2(class="rsc-section-title rsc-section-title--subtle", title_steps()),
    ]),
    div(class="rsc-steps-grid", steps().map(fn(step) { view_step(step) })),
    view_checklist(),
  ])
}

///|
fn view(dispatch : Dispatch[Msg], model : Model) -> Html {
  ignore(dispatch)
  ignore(model.mounted)
  let approved_cards = contest_cards() + reference_cards()
  div(class="rsc-page", [
    view_hero(),
    view_finalists(),
    view_section(label_slots(), title_slots(), approved_cards),
    view_steps(),
  ])
}

///|
#warnings("-alert_unstable")
fn main {
  ignore(Noop)
  let (_, app) = @rabbita.cell_with_dispatch(
    model=init_model,
    update~,
    view~,
  )
  @rabbita.new(app).mount("rabbita-scc-showcase")
}
