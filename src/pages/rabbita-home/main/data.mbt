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
let feature_rows : Array[FeatureRow] = [
  {
    heading: "Reliability",
    body: (
      #|MoonBit catches mistakes early in both human and AI-generated code with a sound type system and predictable semantics.
      #|Its two-layer verification uses executable specifications and AI analysis to detect errors before production.
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
    heading: "Readable by Design",
    body: (
      #| MoonBit keeps programs simple and predictable by avoiding complex ownership-based memory models.
      #|With strong pattern matching, data-oriented design, and semantic CLI tools, it helps developers and AI work with structured data and understand code more easily.
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
    heading: "Toolchain for Agents",
    body: (
      #| MoonBit provides an integrated platform with a compiler, build system, editor support, and AI-assisted tooling.
      #|Its unified toolchain makes it easy for developers and AI to build, test, and evolve software. 
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
    heading: "Fast Where It Matters",
    body: "MoonBit bridges high-level productivity and low-level performance. Compared with TypeScript, ahead-of-time compilation eliminates JavaScript runtime overhead. Compared with Rust, programs remain easier to read and reason about while still delivering near-native performance.",
    visual: Img("/img/prod-and-perf.png"),
  },
]

// ─── Community Data ────────────────────────────────────────────────────────

///|
struct Project {
  name : String
  desc : String
  url : String
}

///|
/// projects in "build with brilliant minds" part
let projects : Array[Project] = [
  {
    name: "moonbitlang/core",
    desc: "The official MoonBit standard library.",
    url: "https://github.com/moonbitlang/core",
  },
  {
    name: "moonbit-community/rabbita",
    desc: "TEA-based web framework for MoonBit.",
    url: "https://github.com/moonbit-community/rabbita",
  },
  {
    name: "moonbitlang/async",
    desc: "Asynchronous programming library for MoonBit. Including fs, http, io, and more.",
    url: "https://github.com/moonbitlang/async",
  },
  {
    name: "moonbit-community/cmark",
    desc: "CommonMark parser written in MoonBit.",
    url: "https://github.com/moonbit-community/cmark",
  },
  {
    name: "mizchi/luna",
    desc: "Fine-grained reactive UI library for MoonBit/JS.",
    url: "https://github.com/mizchi/luna",
  },
  {
    name: "moonbit-community/selene",
    desc: "ECS game engine written in MoonBit.",
    url: "https://github.com/moonbit-community/selene",
  },
  {
    name: "moonbit-community/wasip1",
    desc: "WASI Preview 1 implementation with async/sync wrappers for MoonBit.",
    url: "https://github.com/moonbit-community/wasip1",
  },
  {
    name: "myfreess/piediff",
    desc: "A MoonBit implementation of Bram Cohen's patience diff algorithm.",
    url: "https://github.com/moonbit-community/piediff",
  },
  {
    name: "moonbit-community/uv.mbt",
    desc: "MoonBit bindings to libuv for async I/O.",
    url: "https://github.com/moonbit-community/uv.mbt",
  },
]

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
let voices : Array[Voice] = [
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
    source: "Community Voice",
    bio: "From MoonBit Discord",
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
  //   quote: "Which is yet another reason why we’re carefully evaluating our options moving forward, but in the meantime we’ll keep all of these languages on our “to watch” list.",
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
    quote: "MoonBit is an end-to-end programming language that’s optimized for WebAssembly, while also compiling to JavaScript and Assembly code.",
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
]

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
enum RoadmapStatus {
  Done
  Active
  Planned
}

///|
struct Milestone {
  period : String
  title : String
  items : Array[String]
  status : RoadmapStatus
}

///|
let milestones : Array[Milestone] = [
  {
    period: "2022–2024",
    title: "Foundations",
    items: [
      "Core language and compiler architecture", "Early toolchain and multi-backend support (JS, Native, Wasm)",
    ],
    status: Done,
  },
  {
    period: "2025",
    title: "Beta",
    items: ["MoonBit Beta release", "Async model and platform capabilities"],
    status: Active,
  },
  {
    period: "2026",
    title: "Road to 1.0",
    items: [
      "Language and runtime stabilization", "Support for medium-to-large scale software and AI-assisted development",
    ],
    status: Planned,
  },
  {
    period: "2027+",
    title: "Ecosystem",
    items: [
      "Ecosystem and package growth", "More applications and software built with MoonBit",
    ],
    status: Planned,
  },
]
