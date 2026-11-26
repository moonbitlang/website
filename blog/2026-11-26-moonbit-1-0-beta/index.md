---
description: "MoonBit 1.0 release candidate stabilizes the compiler and sets a target date for the full 1.0 release."
slug: moonbit-1-0-beta
image: /img/blogs/2026-11-26-moonbit-1-0-beta/cover.png
tags: [MoonBit]
---

# The MoonBit 1.0 Compiler Is Stable

![MoonBit 1.0. The compiler is stable.](./cover.png)

Today we’re releasing MoonBit 1.0 release candidate. The compiler is stable and will receive only bug fixes through the full 1.0 release. We’re targeting **February 18, 2027** for that release, including the stable core library.

The core library packages are already stable except for the recently introduced `moonbitlang/core/async` and `moonbitlang/core/archive` packages. Those two packages may still receive minor API refinements alongside bug fixes.

<!--truncate-->

If you maintain a MoonBit package, try the 1.0 release candidate against your test suite. When updating your package, `moon fix` is your friend. It can apply fixes suggested by the compiler. A small example that reproduces a compiler regression or shows where a core API is awkward to use will help us prepare the final release. [Installation guide](https://www.moonbitlang.com/download/) · [Report a problem](https://github.com/moonbitlang/moonbit-docs/issues) · [Discuss a core API](https://github.com/moonbitlang/core/issues)

MoonBit draws inspiration from OCaml, Rust, Swift, and ReScript. The team contributed to OCaml and created ReScript. MoonBit has two tier-1 backends (Native and Wasm) and a JS backend optimized for browsers and user interfaces.

We originally designed MoonBit for fast, large-scale static analysis in October 2022. In 2024, we shifted our focus to agentic coding to help agents deliver reliable, performant code faster and use large-scale refactoring to incrementally improve the quality of AI-generated code.

## Key strengths of MoonBit

- **Safe.** MoonBit has a sound and expressive type system (no runtime type errors). MoonBit provides runtime safety and also focuses on supply chain safety. For example, MoonBit runs macros in WebAssembly so the toolchain can limit what a dependency’s macro can access.
- **Verifiable.** With the experimental `moon prove` command, you can prove properties of your code. For example, if binary search returns an index, the element at that index equals the search key.
```moonbit
pub fn binary_search(
  xs : FixedArray[Int32],
  key : Int32,
) -> Int32? where {
  proof_require: sorted(xs), // precondition
  proof_ensure: result => binary_search_ok(xs, key, result), // postcondition
}
```
- **Fast to compile.** We designed the language and the whole toolchain for extremely fast compilation. [Build design and benchmarks](https://www.moonbitlang.com/blog/build-system-opensource) Compilation speed will remain a priority after 1.0.
- **Fast to run.** MoonBit is a high-level language like Java and Go, but we provide built-in [SIMD](https://www.moonbitlang.com/pearls/optimize-moonbit-core) and value types. [Value types and memory layout](https://www.moonbitlang.com/blog/moonbit-value-type) On [benchmarks such as zlib](https://x.com/bobzhang1988/status/2121510870509613320), MoonBit is quite competitive with Rust and C, even though there’s still plenty of low-hanging fruit.

## Agent code mode

MoonBit is optimized for code mode, where an agent writes a small program to answer a question. Ask which issues a batch of pull requests mentions, and the agent can match the JSON events, scan their titles, and return just the issue numbers. The same pattern-matching tools let it read binary fields and turn raw input into typed values. Fast compilation lets the agent test its script on one event before running the batch. Our [MoonBit code agent](https://github.com/moonbitlang/openseek) runs these single-file `.mbtx` scripts in a sandbox that limits what they can access. [Code mode](https://lucumr.pocoo.org/2026/10/6/codemode/) · [How agents use MoonBit](https://www.moonbitlang.com/blog/building-agents-moonbit)

### Match the shape of a JSON event

A pull-request event can have dozens of fields. To get the title of a newly opened PR, the agent needs only two. The pattern checks both at runtime. Inside the matching branch, the compiler knows `title` is a `String`.

```moonbit
fn opened_title(event : Json) -> String? {
  match event {
    { "action": "opened", "pull_request": { "title": String(title), .. }, .. } =>
      Some(title)
    _ => None
  }
}
```

### Scan a string with `lexscan`

The title `Fix #42 and #108` contains two issue references. Each match advances the same `StringScanner`. One branch collects a reference, another skips ordinary text, and the third consumes a stray `#` so the scan can continue.

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

### Read binary fields with bit patterns

How long is an IPv4 header? Its first byte packs the version into the high four bits and the header length into the low four. The length is measured in four-byte words, so a first byte of `0x46` declares a 24-byte header. A bit pattern expresses that layout directly.

```moonbit
fn ipv4_header_length(packet : BytesView) -> Int? {
  guard packet is [u4be(4), u4be(words), ..] else { return None }
  let length = words.reinterpret_as_int() * 4
  guard 20 <= length && length <= packet.length() else { return None }
  Some(length)
}
```

### Give parsed values a type

In a StatsD message, `2|c` adds two to a counter and `2|g` sets a gauge to two. Once the parser produces a `Reading`, the reporting code can express that distinction in an exhaustive match. Adding a new variant makes the compiler point out where the report needs to handle it.

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

To see all four features in one script, run `moonx udp-report.mbtx`. It selects outbound packets by their JSON metadata, reads their binary headers, scans the StatsD payloads, and totals five hits with a final load reading of four. [Standalone script on GitHub](https://github.com/bobzhang/moonbit-code-mode-examples/blob/60347aa9a6682c174fd1864d1365bb640eda2284/udp-report.mbtx)

## What’s next

Looking beyond 1.0, we have three priorities:

- **Documentation and books.** We’ll improve the language and core library guides and work on MoonBit books with examples that readers can follow from their first function through a complete program.
- **Formal verification tools.** We want to make it easier to write a contract, run `moon prove`, and understand which part of the contract still needs a proof.
- **Multithreading.** We’ll work on support for running CPU-intensive tasks across multiple threads, so programs such as data processors can put more than one core to work.

## Acknowledgments

The [Mooncakes](https://mooncakes.io) registry now hosts nearly **36,000 packages**. Thank you to everyone who has shared a library and kept it useful for the next developer.

We’d especially like to thank mizchi for contributions across the MoonBit ecosystem. While tuning MoonBit libraries, mizchi built a memory profiler, improved big-integer multiplication and array sorting in the core library, and showed other developers how to measure the results. One JSON parser change cut allocations by about a quarter on the measured workload. [mizchi’s profiler](https://github.com/mizchi/moon-pprof) · [Optimizing MoonBit](https://www.moonbitlang.com/pearls/optimize-moonbit-core)

We’re grateful to everyone who has reduced a bug to a few lines, written a tutorial, or helped someone get their first MoonBit program running. Much of what we learned on the way to 1.0 began with someone trying MoonBit on a problem of their own and telling us how it went.
