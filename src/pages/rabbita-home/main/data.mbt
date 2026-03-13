// ─── Copy / i18n text ─────────────────────────────────────────────────────
// All user-facing text is defined here for easy editing and translation.

// Links
///|
fn link_docs() -> String {
  lang(en="https://docs.moonbitlang.com", zh="https://docs.moonbitlang.cn")
}

///|
fn link_ide() -> String {
  lang(en="https://tour.moonbitlang.com", zh="https://tour.moonbitlang.cn")
}

///|
fn link_blog() -> String {
  lang(
    en="https://www.moonbitlang.com/blog",
    zh="https://www.moonbitlang.cn/blog",
  )
}

// Hero section — (plain text, accent text)

///|
fn hero_title() -> (String, String) {
  lang(
    en=("The Language and Toolchain ", "for Agents at Scale"),
    zh=("为智能体打造的", "语言与工具链"),
  )
}

///|
fn hero_desc() -> String {
  lang(en="Reliable, readable, and fast.", zh="可靠、易读、极速")
}

// Buttons

///|
fn btn_get_started() -> String {
  lang(en="Get Started", zh="阅读文档")
}

///|
fn btn_try_online() -> String {
  lang(en="Try Online", zh="在线体验")
}

///|
fn btn_try_now() -> String {
  lang(en="Try Now", zh="立即体验")
}

///|
fn btn_see_all() -> String {
  lang(en="See all", zh="查看全部")
}

// Section titles

///|
fn title_why_moonbit() -> String {
  lang(en="Why MoonBit?", zh="MoonBit 的优势")
}

///|
fn title_community_voices() -> String {
  lang(en="Community Voices", zh="社区的声音")
}

///|
fn title_community() -> String {
  lang(en="Build with Brilliant Minds", zh="与卓越开发者共建")
}

///|
fn title_roadmap() -> String {
  lang(en="Roadmap", zh="路线图")
}

///|
fn title_news() -> String {
  lang(en="News", zh="新闻")
}

// Community section

///|
fn community_desc() -> String {
  lang(
    en="MoonBit's open-source ecosystem is growing rapidly. Discover libraries, tools, and frameworks built by the community, or publish your own to mooncakes.io, the official MoonBit package registry.",
    zh="MoonBit 的开源生态系统正在快速增长。探索社区构建的库、工具和框架，或在 MoonBit 官方包注册中心 mooncakes.io 上发布你自己的包。",
  )
}

///|
fn community_explore_label() -> String {
  lang(en="Explore more awesome projects in ", zh="探索更多优秀项目：")
}

///|
fn community_sep_and() -> String {
  lang(en=", and ", zh="，以及 ")
}

// CTA section

///|
fn cta_tagline() -> String {
  lang(
    en="Experience MoonBit: Code Faster, Perform Better!",
    zh="体验 MoonBit：编码更快，性能更强！",
  )
}

// ─── Code tabs ────────────────────────────────────────────────────────────

///|
struct TabEntry {
  label : String
  src : String
}

///|
let code_tabs : Array[TabEntry] = [
  {
    label: "pattern match",
    src: (
      #|// Define a recursive enum for expressions
      #|enum Expr { Num(Int); Mul(Expr, Expr) }
      #|
      #|// Evaluate expression with pattern matching
      #|fn eval(expr : Expr) -> Int {
      #|  match expr {
      #|    Num(n) => n
      #|    Mul(a, b) => eval(a) * eval(b)
      #|  }
      #|}
      #|
      #|fn main {
      #|  let expr = Mul(Mul(Num(2), Num(3)), Num(4))
      #|  println(eval(expr))  // 24
      #|}
    ),
  },
  {
    label: "trait",
    src: (
      #|// Generic quicksort: works on any type with Compare
      #|fn[T : Compare] qsort(input : Array[T]) -> Array[T] {
      #|  guard input is [p, .. rs] else { [] }
      #|  qsort(rs.filter(x => x <= p)) + [p] + qsort(rs.filter(x => x > p))
      #|}
      #|
      #|fn main {
      #|  println(qsort([1, 0, 6, 2, 7, 1]))
      #|  println(qsort(['e', 'c', 'd', 'b', 'a']))
      #|}
    ),
  },
  {
    label: "structured concurrency",
    src: (
      #|// Async with retry, timeout, and structured concurrency
      #|async test "https request" {
      #|  let (response, body) = @async.retry(FixedDelay(250), max_retry=3, () => {
      #|    @async.with_timeout(3000, () => @http.get("https://www.moonbitlang.com"))
      #|  })
      #|  assert_true(response.code is (200..<300))
      #|  assert_true(body.text().has_prefix("<!doctype html>"))
      #|}
    ),
  },
  {
    label: "first class json",
    src: (
      #|// Pattern match directly on JSON structure
      #|fn extract_name(data : Json) -> String? {
      #|  match data {
      #|    { "user": { "name": String(name), .. }, .. } => Some(name)
      #|    _ => None
      #|  }
      #|}
      #|
      #|fn main {
      #|  // JSON literals are built-in syntax
      #|  let data : Json = { "user": { "name": "Alice", "age": 30 } }
      #|  println(extract_name(data))  // Some("Alice")
      #|}
    ),
  },
  // {
  //   label: "io",
  //   src: (
  //     #| // A simple `cat` command line program
  //     #| async fn main {
  //     #|   match @env.args() {
  //     #|     [] | [_] => @stdio.stdout.write_reader(@stdio.stdin)
  //     #|     [_, .. files] =>
  //     #|       for file in files {
  //     #|         if file == "-" {
  //     #|           @stdio.stdout.write_reader(@stdio.stdin)
  //     #|         } else {
  //     #|           let file = @fs.open(file, mode=ReadOnly)
  //     #|           defer file.close()
  //     #|           @stdio.stdout.write_reader(file)
  //     #|         }
  //     #|       }
  //     #|   }
  //     #| }
  //   ),
  // },
  // {
  //   label: "test",
  //   src: (
  //     #|test {
  //     #|  // expect test
  //     #|  debug_inspect([1, 2, 3, 4, 5].filter(x => x < 3), content="[1, 2]")
  //     #|  // property based test
  //     #|  let arrays : Array[Array[Int]] = @quickcheck.samples(1000)
  //     #|  assert_true(arrays.all(arr => arr.rev().rev() == arr))
  //     #|}  
  //   ),
  // },
  // {
  //   label: "loop",
  //   src: (
  //     #|fn is_palindromic(s : String) -> Bool {
  //     #|  loop s[:] {
  //     #|    [l, .. m, r] if l == r => continue m
  //     #|    [] | [_] => true
  //     #|    _ => false
  //     #|  }
  //     #|}
  //     #|
  //     #|fn main {
  //     #|  println(is_palindromic("12321"))
  //     #|  println(is_palindromic("abba"))
  //     #|  println(is_palindromic("abcd"))
  //     #|}
  //   ),
  // },
  // {
  //   label: "is",
  //   src: (
  //     #|struct Event {
  //     #|  timestamp : Int
  //     #|  content : String
  //     #|}
  //     #|
  //     #|fn drain(queue : @queue.Queue[Event]) -> Unit {
  //     #|  while queue.pop() is Some({ timestamp, content }) {
  //     #|    println("\{timestamp}: \{content}")
  //     #|  }
  //     #|}
  //     #|
  //     #|fn main {
  //     #|  let queue = @queue.new()
  //     #|    ..push({ timestamp: 1, content: "c1" })
  //     #|    ..push({ timestamp: 2, content: "c2" })
  //     #|  drain(queue)
  //     #|}
  //   ),
  // },
]

// ─── Features data ────────────────────────────────────────────────────────

///|
struct TermSnippet {
  lang : String
  src : String
  plain : String?
}

///|
#warnings("-unused_constructor")
enum FeatureVisual {
  Img(String)
  Video(String)
  Term(TermSnippet)
  Carousel(Array[FeatureVisual])
}

///|
struct FeatureRow {
  heading : String
  body : String
  visual : FeatureVisual
}

///|
fn get_feature_rows() -> Array[FeatureRow] {
  [
    {
      heading: lang(en="Reliability", zh="高可靠性"),
      body: lang(
        en=(
          #|MoonBit catches mistakes early in both human and AI-generated code with a sound type system and predictable semantics.
          #|Its two-layer verification uses executable specifications and AI analysis to detect errors before production.
        ),
        zh="MoonBit 通过健全的类型系统和可预测的语义，在人工和 AI 生成的代码中尽早捕获错误。其双层验证机制结合可执行规范与 AI 分析，在上线前检测问题。",
      ),
      visual: Term({
        lang: "ansi",
        src: "\u{1b}[32m➜\u{1b}[0m server \u{1b}[36mgit:(main)\u{1b}[0m \u{1b}[31m✗\u{1b}[0m moon check\n \u{1b}[1;33mWarning:\u{1b}[0m \u{1b}[33m[0056]\u{1b}[0m\n     \u{1b}[2m╭─[\u{1b}[0m \u{1b}[36m/source/server/main.mbt:77:7\u{1b}[0m \u{1b}[2m]\u{1b}[0m\n     \u{1b}[2m│\u{1b}[0m\n  \u{1b}[2m77\u{1b}[0m │   let { name, email } = user\n     │       \u{1b}[33m───────┬───────\u{1b}[0m\n     │              \u{1b}[33m╰───────── Warning (missing_pattern_field):\u{1b}[0m\n     │   The struct pattern is missing the field(s) kind.\n     │   Please add them to the pattern or use `..` to ignore them.\n \u{1b}[2m────╯\u{1b}[0m",
        plain: Some(
          (
            #|➜ server git:(main) ✗ moon check
            #| Warning: [0056]
            #|     ╭─[ /source/server/main.mbt:77:7 ]
            #|     │
            #|  77 │   let { name, email } = user
            #|     │       ───────┬───────
            #|     │              ╰───────── Warning (missing_pattern_field):
            #|     │   The struct pattern is missing the field(s) kind.
            #|     │   Please add them to the pattern or use `..` to ignore them.
            #| ────╯
          ),
        ),
      }),
    },
    {
      heading: lang(en="Readable by Design", zh="可读性强"),
      body: lang(
        en=(
          #| MoonBit keeps programs simple and predictable by avoiding complex ownership-based memory models.
          #|With strong pattern matching, data-oriented design, and semantic CLI tools, it helps developers and AI work with structured data and understand code more easily.
        ),
        zh="MoonBit 避免复杂的所有权内存模型，保持程序简洁可预测。借助强大的模式匹配、面向数据的设计和语义化 CLI 工具，帮助开发者和 AI 更轻松地处理结构化数据、理解代码。",
      ),
      visual: Term({
        lang: "moonbit",
        src: (
          #|fn serve(path : String) -> Unit {
          #|  match path {
          #|    "/" | "/home" => render_home()
          #|    [.."/user/", ..id] =>
          #|      try @strconv.parse_int(id) catch {
          #|        error => render_not_found(error~)
          #|      } noraise {
          #|        number => render_user(number)
          #|      }
          #|    _ => render_not_found()
          #|  }
          #|}
        ),
        plain: None,
      }),
    },
    {
      heading: lang(
        en="Toolchain for Agents",
        zh="AI 原生",
      ),
      body: lang(
        en=(
          #| MoonBit provides an integrated platform with a compiler, build system, editor support, and AI-assisted tooling.
          #|Its unified toolchain makes it easy for developers and AI to build, test, and evolve software.
        ),
        zh="MoonBit 提供了集编译器、构建系统、编辑器支持和 AI 辅助工具于一体的集成平台。其统一工具链让开发者和 AI 能够轻松构建、测试和演进软件。",
      ),
      visual: Term({
        lang: "ansi",
        src: "\u{1b}[32m$\u{1b}[0m moon ide rename \u{1b}[36msummary\u{1b}[0m \u{1b}[36mrender_summary\u{1b}[0m --loc \u{1b}[35mcontent.mbt:10:8\u{1b}[0m\n\u{1b}[2m# semantic rename that outputs a ready-to-apply patch\u{1b}[0m\n\u{1b}[34m*** Begin Patch\u{1b}[0m\n\u{1b}[34m*** Update File: /content_model/content.mbt\u{1b}[0m\n\u{1b}[34m@@\u{1b}[0m\n   content.views + content.title.length()\n }\n\n\u{1b}[31m-pub fn summary(content : Content) -> String {\u{1b}[0m\n\u{1b}[32m+pub fn render_summary(content : Content) -> String {\u{1b}[0m\n   content.title + \" - \" + score(content).to_string()\n }\n\u{1b}[34m*** End Patch\u{1b}[0m",
        plain: Some(
          (
            #|$ moon ide rename summary render_summary --loc content.mbt:10:8
            #|# semantic rename that outputs a ready-to-apply patch
            #|*** Begin Patch
            #|*** Update File: /content_model/content.mbt
            #|@@
            #|   content.views + content.title.length()
            #| }
            #|
            #|-pub fn summary(content : Content) -> String {
            #|+pub fn render_summary(content : Content) -> String {
            #|   content.title + " - " + score(content).to_string()
            #| }
            #|*** End Patch
          ),
        ),
      }),
      //   Term({
      //     lang: "ansi",
      //     src: "\u{1b}[32m$\u{1b}[0m moon ide doc \u{1b}[36mTaskGroup\u{1b}[0m \u{1b}[2m# search Type across the MoonBit ecosystem\u{1b}[0m\n\u{1b}[35mpackage\u{1b}[0m \"moonbitlang/async\" \u{1b}[2m// moon add moonbitlang/async@0.16.4\u{1b}[0m\n\u{1b}[36mtype\u{1b}[0m \u{1b}[1mTaskGroup[X]\u{1b}[0m\n  A `TaskGroup` can be used to spawn children tasks that run in parallel.\n  Task groups implements \u{1b}[33mstructured concurrency\u{1b}[0m:\n  a task group will only return after all its children task terminates.\n  Task groups also handles \u{1b}[33merror propagation\u{1b}[0m:\n  ...\n\n  \u{1b}[33mpub fn[X] TaskGroup::add_defer(Self[X], async () -> Unit) -> Unit\u{1b}[0m\n  \u{1b}[33mpub fn[X] TaskGroup::return_immediately(Self[X], X) -> Unit raise\u{1b}[0m\n  ...",
      //   }),
      // ]),
    },
    {
      heading: lang(en="Fast Where It Matters", zh="极致性能"),
      body: lang(
        en="MoonBit bridges high-level productivity and low-level performance. Compared with TypeScript, ahead-of-time compilation eliminates JavaScript runtime overhead. Compared with Rust, programs remain easier to read and reason about while still delivering near-native performance.",
        zh="MoonBit 兼顾高层生产力与底层性能。与 TypeScript 相比，提前编译消除了 JavaScript 运行时开销；与 Rust 相比，程序更易阅读和理解，同时依然提供接近原生的性能。",
      ),
      visual: Img("/img/prod-and-perf.png"),
    },
  ]
}

// ─── Community Data ────────────────────────────────────────────────────────

///|
struct Project {
  name : String
  desc : String
  url : String
}

///|
/// projects in "build with brilliant minds" part
fn get_projects() -> Array[Project] {
  [
    {
      name: "moonbitlang/core",
      desc: lang(
        en="The official MoonBit standard library.",
        zh="MoonBit 官方标准库。",
      ),
      url: "https://github.com/moonbitlang/core",
    },
    {
      name: "moonbit-community/rabbita",
      desc: lang(
        en="TEA-based web framework for MoonBit.",
        zh="基于 TEA 架构的 MoonBit Web 框架。",
      ),
      url: "https://github.com/moonbit-community/rabbita",
    },
    {
      name: "moonbitlang/async",
      desc: lang(
        en="Asynchronous programming library for MoonBit. Including fs, http, io, and more.",
        zh="MoonBit 异步编程库，包含 fs、http、io 等模块。",
      ),
      url: "https://github.com/moonbitlang/async",
    },
    {
      name: "moonbit-community/cmark",
      desc: lang(
        en="CommonMark parser written in MoonBit.",
        zh="使用 MoonBit 编写的 CommonMark 解析器。",
      ),
      url: "https://github.com/moonbit-community/cmark",
    },
    {
      name: "mizchi/luna",
      desc: lang(
        en="Fine-grained reactive UI library for MoonBit/JS.",
        zh="MoonBit/JS 细粒度响应式 UI 库。",
      ),
      url: "https://github.com/mizchi/luna",
    },
    {
      name: "moonbit-community/selene",
      desc: lang(
        en="ECS game engine written in MoonBit.",
        zh="使用 MoonBit 编写的 ECS 游戏引擎。",
      ),
      url: "https://github.com/moonbit-community/selene",
    },
    {
      name: "moonbit-community/wasip1",
      desc: lang(
        en="WASI Preview 1 implementation with async/sync wrappers for MoonBit.",
        zh="MoonBit 的 WASI Preview 1 实现，包含异步/同步封装。",
      ),
      url: "https://github.com/moonbit-community/wasip1",
    },
    {
      name: "myfreess/piediff",
      desc: lang(
        en="A MoonBit implementation of Bram Cohen's patience diff algorithm.",
        zh="Bram Cohen 的 patience diff 算法的 MoonBit 实现。",
      ),
      url: "https://github.com/moonbit-community/piediff",
    },
    {
      name: "moonbit-community/uv.mbt",
      desc: lang(
        en="MoonBit bindings to libuv for async I/O.",
        zh="libuv 的 MoonBit 绑定，用于异步 I/O。",
      ),
      url: "https://github.com/moonbit-community/uv.mbt",
    },
  ]
}

///|
struct Voice {
  avatar : String
  name : String
  handle : String
  verified : Bool
  quote : String
  quote_original : String?
  source : String
  bio : String
}

///|
fn get_voices() -> Array[Voice] {
  lang(
    en=[
      {
        avatar: "https://pbs.twimg.com/profile_images/1856284397072478208/hSEXLkPN_400x400.jpg",
        name: "Evan You",
        handle: "@youyuxi",
        verified: true,
        quote: "The nice part about this is you can write nice functional code that iterates on collections (map, filter etc.) with hand-optimized-level performance. Every time I use map/filter in JS instead of plain for loops I feel like voluntarily giving up performance.",
        quote_original: None,
        source: "X / Twitter",
        bio: "Creator of Vue.js and Vite",
      },
      {
        avatar: "https://pbs.twimg.com/profile_images/1771489509798236160/jGsCqm25_400x400.jpg",
        name: "John A De Goes",
        handle: "@jdegoes",
        verified: true,
        quote: "Beyond its compelling status as the top language for WASM development, the language is just a fun language to work with, hitting a sweet spot somewhere between Scala and Rust.",
        quote_original: None,
        source: "MoonBit for Developers",
        bio: "CEO @ZivergeTech, CEO @GolemCloud, OSS contributor @zioscala",
      },
      {
        avatar: "https://unavatar.io/twitter/ChShersh",
        name: "Dmitrii Kovanikov",
        handle: "@ChShersh",
        verified: true,
        quote: "If anything, I'd rather use MoonBit than any of the mainstream options when presented with a choice... blazingly fast compile times and a nice package manager.",
        quote_original: None,
        source: "MoonBit for Developers",
        bio: "Functional Programming account #1. Senior SWE at Bloomberg.",
      },
      {
        avatar: "https://pbs.twimg.com/profile_images/653235651752517632/NcqE9VJo_400x400.jpg",
        name: "Rob Palmer",
        handle: "@robpalmer2",
        verified: true,
        quote: "Network payload sizes matters on the Web. The MoonBit language is optimized to produce small Wasm payloads. Hello World is 27KB.",
        quote_original: None,
        source: "X / Twitter",
        bio: "TC39 co-chair, Bloomberg",
      },
      {
        avatar: "https://unavatar.io/twitter/Glenn",
        name: "Glenn Lewis",
        handle: "@Glenn",
        verified: false,
        quote: "I'm finding MoonBit to be extremely easy to read... and its compiler is seriously fast... and the tooling is superb... I haven't had this much fun since I started liking Go!",
        quote_original: None,
        source: "MoonBit Discord",
        bio: "Software developer based in North America",
      },
      {
        avatar: "https://pbs.twimg.com/profile_images/2507664307/viccruw2m1zb0xkkisil_400x400.jpeg",
        name: "mizchi",
        handle: "@mizchi",
        verified: false,
        quote: "MoonBit clearly lets you write things you couldn't in TypeScript, makes bloat-prone modules robust, ships a full toolchain built-in, lets you go native for speed, connect to the JS ecosystem, or push with wasm-gc builds. It's the best.",
        quote_original: Some(
          "MoonBit 明らかにTSで書けなかったものが書けるし、モジュールの肥大化に耐えられなかった部分が堅牢になるし、必要なツールチェインが最初からビルトインだし、速度を取りに行って native 行ってもいいし、JSビルドで既存エコシステムと繋いでもいいし、wasm-gc ビルドで攻めてもいいし、最高だよ",
        ),
        source: "X / Twitter",
        bio: "Frontend engineer, JavaScript/TypeScript tooling",
      },
      {
        avatar: "https://unavatar.io/twitter/publickey",
        name: "Publickey",
        handle: "@publickey",
        verified: false,
        quote: "MoonBit is a programming language designed specifically for generating WebAssembly binaries. Fast, incremental, and parallel compilation makes it suitable for large-scale development.",
        quote_original: None,
        source: "Publickey",
        bio: "Japanese tech news publication",
      },
      {
        avatar: "https://pbs.twimg.com/profile_images/653235651752517632/NcqE9VJo_400x400.jpg",
        name: "Rob Palmer",
        handle: "@robpalmer2",
        verified: true,
        quote: "MoonBit is a new Wasm-first language. Optimized for tiny Wasm output, performance comparable to Rust, user-friendly with exhaustive pattern matching, managed memory, and CLI & IDE tooling.",
        quote_original: None,
        source: "X / Twitter",
        bio: "TC39 co-chair, Bloomberg",
      },
      {
        avatar: "https://unavatar.io/twitter/redhotcyber",
        name: "Red Hot Cyber",
        handle: "@redhotcyber",
        verified: false,
        quote: "MoonBit compiles 4,000 packages in under 7 seconds from a cold start and generates WebAssembly files as small as 253 bytes. Unlike Rust, it simplifies development through automatic memory management.",
        quote_original: None,
        source: "Red Hot Cyber",
        bio: "Italian cybersecurity and tech publication",
      },
      {
        avatar: "https://pbs.twimg.com/profile_images/1771489509798236160/jGsCqm25_400x400.jpg",
        name: "John A De Goes",
        handle: "@jdegoes",
        verified: true,
        quote: "MoonBit combines the best parts of Rust, adds GC, and prioritizes tooling, performance, & stability.",
        quote_original: None,
        source: "X / Twitter",
        bio: "CEO @ZivergeTech, CEO @GolemCloud, OSS contributor @zioscala",
      },
      // source: https://redmonk.com/sogrady/2025/06/18/language-rankings-1-25/
      // {
      //   avatar: "https://unavatar.io/twitter/sogrady",
      //   name: "Stephen O'Grady",
      //   handle: "@sogrady",
      //   verified: true,
      //   quote: "Which is yet another reason why we're carefully evaluating our options moving forward, but in the meantime we'll keep all of these languages on our \"to watch\" list.",
      //   quote_original: None,
      //   source: "RedMonk Language Rankings",
      //   bio: "Co-founder and principal analyst at RedMonk",
      // },
      // source: https://mysticmatrix.tech/top-programming-languages-of-late-2025/
      {
        avatar: "https://mysticmatrix.tech/wp-content/litespeed/avatar/3b734a83dbf7f4c51485dd6c069a347e.jpg?ver=1772139726",
        name: "Mystic Matrix",
        handle: "mysticmatrix.tech",
        verified: false,
        quote: "As we approach the end of 2025, three programming languages are gaining serious momentum — Mojo, Rust, and MoonBit. Each brings something unique to the table: from systems-level speed to safe concurrency to WebAssembly-first",
        quote_original: None,
        source: "Top Programming Languages of Late 2025",
        bio: "Technology and software consultancy blog",
      },
      // source: https://thenewstack.io/moonbit-wasm-optimized-language-creates-less-code-than-rust/
      {
        avatar: "https://thenewstack.io/wp-content/uploads/2023/08/4de88b83-4756312a-326a38b7-lorainelawson2-600x600-1-96x96.jpeg",
        name: "Loraine Lawson",
        handle: "thenewstack.io",
        verified: false,
        quote: "MoonBit is an end-to-end programming language that's optimized for WebAssembly, while also compiling to JavaScript and Assembly code.",
        quote_original: None,
        source: "MoonBit: Wasm-Optimized Language Creates Less Code Than Rust",
        bio: "Technology reporter at The New Stack",
      },
      // source: https://thenewstack.io/introduction-to-moonbit-a-new-language-toolchain-for-wasm/
      {
        avatar: "https://thenewstack.io/wp-content/uploads/2022/09/2e2ac7a2-cropped-a46bbf33-photo-96x96.png",
        name: "David Eastman",
        handle: "thenewstack.io",
        verified: false,
        quote: "We check out MoonBit, a modern language plus workflow designed to create efficient WebAssembly projects (it can also target JavaScript).",
        quote_original: None,
        source: "Introduction to MoonBit, a New Language Toolchain for Wasm",
        bio: "Contributor at The New Stack",
      },
    ],
    zh=[
      {
        avatar: "https://pbs.twimg.com/profile_images/1856284397072478208/hSEXLkPN_400x400.jpg",
        name: "尤雨溪",
        handle: "@youyuxi",
        verified: true,
        quote: "它的妙处在于你可以用优雅的函数式代码来迭代集合（map、filter等），同时获得手动优化级别的性能。每次我在 JS 里用 map/filter 代替普通 for 循环时，都感觉是在主动放弃性能。",
        quote_original: Some(
          "The nice part about this is you can write nice functional code that iterates on collections (map, filter etc.) with hand-optimized-level performance. Every time I use map/filter in JS instead of plain for loops I feel like voluntarily giving up performance.",
        ),
        source: "X / Twitter",
        bio: "Vue.js 和 Vite 作者",
      },
      {
        avatar: "https://pbs.twimg.com/profile_images/1771489509798236160/jGsCqm25_400x400.jpg",
        name: "John A De Goes",
        handle: "@jdegoes",
        verified: true,
        quote: "除了作为 WASM 开发的顶级语言这一引人注目的地位外，它本身就是一门有趣的语言，在 Scala 和 Rust 之间找到了甜蜜点。",
        quote_original: Some(
          "Beyond its compelling status as the top language for WASM development, the language is just a fun language to work with, hitting a sweet spot somewhere between Scala and Rust.",
        ),
        source: "MoonBit for Developers",
        bio: "ZivergeTech CEO, GolemCloud CEO, zioscala OSS 贡献者",
      },
      {
        avatar: "https://unavatar.io/twitter/ChShersh",
        name: "Dmitrii Kovanikov",
        handle: "@ChShersh",
        verified: true,
        quote: "如果可以选择，比起任何主流选项我更愿意用 MoonBit……极快的编译速度和出色的包管理器。",
        quote_original: Some(
          "If anything, I'd rather use MoonBit than any of the mainstream options when presented with a choice... blazingly fast compile times and a nice package manager.",
        ),
        source: "MoonBit for Developers",
        bio: "函数式编程第一账号，Bloomberg 高级软件工程师",
      },
      {
        avatar: "https://pbs.twimg.com/profile_images/653235651752517632/NcqE9VJo_400x400.jpg",
        name: "Rob Palmer",
        handle: "@robpalmer2",
        verified: true,
        quote: "网络传输大小在 Web 上很重要。MoonBit 语言针对生成小体积 Wasm 进行了优化。Hello World 只有 27KB。",
        quote_original: Some(
          "Network payload sizes matters on the Web. The MoonBit language is optimized to produce small Wasm payloads. Hello World is 27KB.",
        ),
        source: "X / Twitter",
        bio: "TC39 联合主席，Bloomberg",
      },
      {
        avatar: "https://unavatar.io/twitter/Glenn",
        name: "Glenn Lewis",
        handle: "@Glenn",
        verified: false,
        quote: "我发现 MoonBit 极其易读……编译器也非常快……工具链更是一流……自从喜欢上 Go 之后，我再没体验过这么大的乐趣！",
        quote_original: Some(
          "I'm finding MoonBit to be extremely easy to read... and its compiler is seriously fast... and the tooling is superb... I haven't had this much fun since I started liking Go!",
        ),
        source: "MoonBit Discord",
        bio: "北美软件开发者",
      },
      {
        avatar: "https://pbs.twimg.com/profile_images/2507664307/viccruw2m1zb0xkkisil_400x400.jpeg",
        name: "mizchi",
        handle: "@mizchi",
        verified: false,
        quote: "MoonBit 明显能写出 TypeScript 写不了的东西，让容易膨胀的模块变得健壮，自带完整工具链，想要速度可以走 native，想接入 JS 生态也行，用 wasm-gc 构建也没问题。最棒了。",
        quote_original: Some(
          "MoonBit 明らかにTSで書けなかったものが書けるし、モジュールの肥大化に耐えられなかった部分が堅牢になるし、必要なツールチェインが最初からビルトインだし、速度を取りに行って native 行ってもいいし、JSビルドで既存エコシステムと繋いでもいいし、wasm-gc ビルドで攻めてもいいし、最高だよ",
        ),
        source: "X / Twitter",
        bio: "前端工程师，JavaScript/TypeScript 工具链",
      },
      {
        avatar: "https://unavatar.io/twitter/publickey",
        name: "Publickey",
        handle: "@publickey",
        verified: false,
        quote: "MoonBit 是一门专为生成 WebAssembly 二进制文件而设计的编程语言。快速、增量、并行的编译使其适用于大规模开发。",
        quote_original: Some(
          "MoonBit is a programming language designed specifically for generating WebAssembly binaries. Fast, incremental, and parallel compilation makes it suitable for large-scale development.",
        ),
        source: "Publickey",
        bio: "日本科技新闻媒体",
      },
      {
        avatar: "https://pbs.twimg.com/profile_images/653235651752517632/NcqE9VJo_400x400.jpg",
        name: "Rob Palmer",
        handle: "@robpalmer2",
        verified: true,
        quote: "MoonBit 是一门全新的 Wasm 优先语言。针对极小 Wasm 输出优化，性能媲美 Rust，支持穷尽模式匹配、托管内存以及 CLI 和 IDE 工具链，用户体验友好。",
        quote_original: Some(
          "MoonBit is a new Wasm-first language. Optimized for tiny Wasm output, performance comparable to Rust, user-friendly with exhaustive pattern matching, managed memory, and CLI & IDE tooling.",
        ),
        source: "X / Twitter",
        bio: "TC39 联合主席，Bloomberg",
      },
      {
        avatar: "https://unavatar.io/twitter/redhotcyber",
        name: "Red Hot Cyber",
        handle: "@redhotcyber",
        verified: false,
        quote: "MoonBit 冷启动编译 4,000 个包不到 7 秒，生成的 WebAssembly 文件小至 253 字节。与 Rust 不同，它通过自动内存管理简化了开发。",
        quote_original: Some(
          "MoonBit compiles 4,000 packages in under 7 seconds from a cold start and generates WebAssembly files as small as 253 bytes. Unlike Rust, it simplifies development through automatic memory management.",
        ),
        source: "Red Hot Cyber",
        bio: "意大利网络安全与科技媒体",
      },
      {
        avatar: "https://pbs.twimg.com/profile_images/1771489509798236160/jGsCqm25_400x400.jpg",
        name: "John A De Goes",
        handle: "@jdegoes",
        verified: true,
        quote: "MoonBit 融合了 Rust 的精华，加上 GC，并将工具链、性能和稳定性放在首位。",
        quote_original: Some(
          "MoonBit combines the best parts of Rust, adds GC, and prioritizes tooling, performance, & stability.",
        ),
        source: "X / Twitter",
        bio: "ZivergeTech CEO, GolemCloud CEO, zioscala OSS 贡献者",
      },
      {
        avatar: "https://mysticmatrix.tech/wp-content/litespeed/avatar/3b734a83dbf7f4c51485dd6c069a347e.jpg?ver=1772139726",
        name: "Mystic Matrix",
        handle: "mysticmatrix.tech",
        verified: false,
        quote: "随着 2025 年接近尾声，三门编程语言正在强势崛起——Mojo、Rust 和 MoonBit。每一门都有其独特之处：从系统级速度到安全并发再到 WebAssembly 优先。",
        quote_original: Some(
          "As we approach the end of 2025, three programming languages are gaining serious momentum — Mojo, Rust, and MoonBit. Each brings something unique to the table: from systems-level speed to safe concurrency to WebAssembly-first",
        ),
        source: "2025 年末热门编程语言",
        bio: "技术与软件咨询博客",
      },
      {
        avatar: "https://thenewstack.io/wp-content/uploads/2023/08/4de88b83-4756312a-326a38b7-lorainelawson2-600x600-1-96x96.jpeg",
        name: "Loraine Lawson",
        handle: "thenewstack.io",
        verified: false,
        quote: "MoonBit 是一门端到端的编程语言，针对 WebAssembly 优化，同时也可以编译为 JavaScript 和汇编代码。",
        quote_original: Some(
          "MoonBit is an end-to-end programming language that's optimized for WebAssembly, while also compiling to JavaScript and Assembly code.",
        ),
        source: "MoonBit: Wasm 优化语言，代码量比 Rust 更少",
        bio: "The New Stack 技术记者",
      },
      {
        avatar: "https://thenewstack.io/wp-content/uploads/2022/09/2e2ac7a2-cropped-a46bbf33-photo-96x96.png",
        name: "David Eastman",
        handle: "thenewstack.io",
        verified: false,
        quote: "我们来看看 MoonBit，一门为创建高效 WebAssembly 项目而设计的现代语言加工作流（也可以编译到 JavaScript）。",
        quote_original: Some(
          "We check out MoonBit, a modern language plus workflow designed to create efficient WebAssembly projects (it can also target JavaScript).",
        ),
        source: "MoonBit 入门：一个全新的 Wasm 语言工具链",
        bio: "The New Stack 撰稿人",
      },
    ],
  )
}

///|
struct Contrib {
  login : String
}

///|
let contribs : Array[Contrib] = [
  // moonbitlang/core
  { login: "bobzhang" },
  { login: "peter-jerry-ye" },
  { login: "Yu-zh" },
  { login: "Yoorkin" },
  { login: "Guest0x0" },
  { login: "yj-qin" },
  { login: "rami3l" },
  { login: "Lampese" },
  { login: "FlyCloudC" },
  { login: "qazxcdswe123" },
  { login: "tonyfettes" },
  { login: "hackwaly" },
  { login: "illusory0x0" },
  { login: "CAIMEOX" },
  { login: "jialunzhang-psu" },
  { login: "Young-Flash" },
  { login: "lynzrand" },
  { login: "myfreess" },
  { login: "lijunchen" },
  { login: "quake" },
  { login: "Asterless" },
  { login: "waterlens" },
  { login: "bzy-debug" },
  { login: "FrozenLemonTee" },
  { login: "ZnPdCo" },
  { login: "fantix" },
  { login: "Kaida-Amethyst" },
  { login: "hiawui" },
  { login: "GreatHank" },
  { login: "jetjinser" },
  { login: "PingGuoMiaoMiao" },
  { login: "BigOrangeQWQ" },
  { login: "juliano" },
  { login: "FlammeShadow" },
  { login: "zxch3n" },
  { login: "muqiuhan" },
  { login: "wanteatfruit" },
  { login: "HCHogan" },
  { login: "DiamondMofeng" },
  { login: "xuxubo" },
  { login: "kkkiio" },
  { login: "E-M-T-F" },
  { login: "GMH233" },
  { login: "SyoujyoujiNaiki" },
  { login: "ShellWen" },
  { login: "Erchiusx" },
  { login: "liuly0322" },
  { login: "schizobulia" },
  { login: "iceBear67" },
  { login: "He1pa" },
  { login: "co63oc" },
  { login: "LittleJianCH" },
  { login: "gmlewis" },
  { login: "guuzaa" },
  { login: "AlexandreRoba" },
  { login: "QizhengMo" },
  { login: "yjl9903" },
  { login: "ethereal-dream" },
  { login: "Topology2333" },
  { login: "lgxbslgx" },
  { login: "mndrix" },
  { login: "MingLLuo" },
  { login: "mindreframer" },
  { login: "pd4d10" },
  { login: "heyongqi10" },
  { login: "sv158" },
  { login: "rainhuang0220" },
  { login: "npmstudy" },
  { login: "lue-bird" },
  { login: "beliefone" },
  { login: "loremmoqi" },
  { login: "iamzhz" },
  { login: "ia7ck" },
  { login: "echozyr2001" },
  { login: "blqis" },
  { login: "codeworm96" },
  { login: "iningz" },
  { login: "YungjunCheng" },
  { login: "Mng12345" },
  { login: "Milky2018" },
  { login: "mengzhuo" },
  { login: "LuoTat" },
  { login: "Lil-Ran" },
  { login: "KCN-judu" },
  { login: "bungcip" },
  { login: "five-of-fuli" },
  { login: "Frank-III" },
  { login: "notch1p" },
  { login: "CodeZhangBorui" },
  { login: "bikallem" },
  // moonbitlang/moon
  { login: "Kyona776" },
  { login: "XeniaLu" },
  { login: "HerrCai0907" },
  { login: "Steve-xmh" },
  { login: "RuifengFu" },
  { login: "yjl9903" },
  { login: "ZhengLiu2825" },
  // moonbitlang/moonbit-docs
  { login: "0Ayachi0" },
  { login: "A-23187" },
  { login: "BRT958" },
  { login: "DawnMagnet" },
  { login: "Emanon42" },
  { login: "EthanYixuanMi" },
  { login: "Howardzhangdqs" },
  { login: "JinweiOS" },
  { login: "KKKZOZ" },
  { login: "Kukicosmos" },
  { login: "LilJordan23" },
  { login: "LinuxSuRen" },
  { login: "MingcongBai" },
  { login: "NKID00" },
  { login: "OlingCat" },
  { login: "Samu-Zhan" },
  { login: "Spade-Z-Pluto" },
  { login: "Wangxiz" },
  { login: "Zxilly" },
  { login: "aisk" },
  { login: "alkane7" },
  { login: "allwefantasy" },
  { login: "corem" },
  { login: "cqh963852" },
  { login: "d2verb" },
  { login: "eczn" },
  { login: "ekusiadadus" },
  { login: "enkilee" },
  { login: "everyman99" },
  { login: "hanbings" },
  { login: "htoooth" },
  { login: "huifeidou" },
  { login: "hzura" },
  { login: "justjavac" },
  { login: "kesmeey" },
  { login: "kibuniverse" },
  { login: "lexon-fs" },
  { login: "liweijian" },
  { login: "luoxuwei" },
  { login: "mirek" },
  { login: "mxj4" },
  { login: "pe200012" },
  { login: "phaleth" },
  { login: "refinedheart" },
  { login: "schwarz" },
  { login: "shumu7Mushroom" },
  { login: "smallbearrr" },
  { login: "uran0sH" },
  { login: "yzyzsun" },
]

///|
struct NewsItem {
  title : String
  date : String
  url : String
  img : String
}

// ─── Roadmap data ─────────────────────────────────────────────────────────

///|
enum MilestoneItem {
  PlainText(String)
  HyperLink(String, String)
}

///|
struct Milestone {
  period : String
  title : String
  items : Array[MilestoneItem]
}

///|
fn get_milestones() -> Array[Milestone] {
  lang(
    en=[
      {
        period: "Aug 2023",
        title: "Launch",
        items: [
          PlainText(
            "Early toolchain and multi-backend support (JS, Native, Wasm)",
          ),
          HyperLink(
            "Hacker News front page", "https://news.ycombinator.com/item?id=37174619",
          ),
        ],
      },
      {
        period: "Mid 2025",
        title: "MoonBit Beta",
        items: [
          HyperLink(
            "MoonBit Beta released", "https://www.moonbitlang.com/blog/beta-release",
          ),
          PlainText("Async model and platform capabilities"),
        ],
      },
      {
        period: "Feb 2026",
        title: "MoonBit 0.8.0",
        items: [
          PlainText("MoonBit 0.8.0 released"),
          PlainText("200K users, nearly 5K ecosystem packages"),
        ],
      },
      {
        period: "Mid 2026",
        title: "MoonBit 1.0",
        items: [
          PlainText("Ecosystem and package growth"),
          PlainText("Target 500K users"),
        ],
      },
    ],
    zh=[
      {
        period: "23年8月",
        title: "首发",
        items: [
          PlainText("早期工具链与多后端支持（JS、Native、Wasm）"),
          HyperLink(
            "首发登上 Hacker News 头条", "https://news.ycombinator.com/item?id=37174619",
          ),
        ],
      },
      {
        period: "25年中",
        title: "MoonBit Beta 版本",
        items: [
          HyperLink(
            "MoonBit Beta 版本发布", "https://mp.weixin.qq.com/s/bAupv-Qmw1Ux_HT-HgfZtQ",
          ),
          PlainText("异步模型与平台能力"),
        ],
      },
      {
        period: "26年2月",
        title: "MoonBit 0.8.0 版本",
        items: [
          PlainText("MoonBit 0.8.0 版本发布"),
          HyperLink(
            "用户数 20 万，生态库接近 5千", "https://mp.weixin.qq.com/s/fMKD9Md-jHcgWc3Ioz-13g",
          ),
        ],
      },
      {
        period: "2026年中",
        title: "MoonBit 1.0 版本",
        items: [
          PlainText("生态系统与包的增长"),
          PlainText("目标用户数突破 50 万"),
        ],
      },
    ],
  )
}
