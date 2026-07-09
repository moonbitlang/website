---
slug: optimize-moonbit-core
authors: mizchi
description: "Optimizing MoonBit's core library through profiling, benchmarking, and evidence-driven performance work"
image: cover.png
---

# Optimizing MoonBit

![](./cover.png)

Original author: mizchi

Published on 2026/07/09

It's great when a programming language gets faster. That's why I'm optimizing MoonBit.

By the way, what is the boundary between AI Slop and something that's not? In my opinion, when there is a clear specification, complying with it, or improving performance and security without changing the API contract, is something that doesn't hurt anyone, so it's relatively easy to do.

When crossing boundaries in human communities, sending something you don't understand is out of the question. You need to provide observed measurement values as persuasive material. Anyway, the important thing is to measure.

That's why, recently, I've been submitting PRs to MoonBit's standard library, moonbitlang/core.

**Pull requests · moonbitlang/core**

[![moonbitlang/core](https://opengraph.githubassets.com/1/moonbitlang/core)](https://github.com/moonbitlang/core)

At first, I was tuning my own libraries, but midway through, I decided that tuning the core library would be faster, and since it's OSS, it has public benefit and is more worthwhile.

Here, I'll explain how I'm measuring. By the way, everyone, please join in the tuning too.

## Don't Guess, Measure

I write code while periodically inserting phases of refactoring and tuning. I usually tune after about 3000 lines have accumulated since the previous tuning. (I want to quantify it more...)

Leaving slow code as is makes unit tests slower and CI longer. So I think it's worth doing. There's no reason not to.

When writing MoonBit, I'll introduce the tools I'm using.

### moon bench

MoonBit has `moon bench` built-in, which is equivalent to Rust's criterion. Since it's integrated into the language standard, it's easy to make benchmarking a habit.

[**ベンチマークの書き方 — MoonBit v0.10.1 ドキュメント**](https://docs.moonbitlang.com/ja/latest/language/benchmarks.html)

### `moon run --profile` and `moon test --profile`

A recently added feature.

It allows taking execution profiles. On macOS, it generates profiles from `xcrun xctrace ...` results, so note that Xcode settings are required.

### [https://github.com/mizchi/moon-pprof](https://github.com/mizchi/moon-pprof)

My own memory profiler, built on top of [https://github.com/mstange/samply](https://github.com/mstange/samply).

After I released this, MoonBit's `--profile` was released, so the roles overlap, but the data you can get is slightly different, so I'm still using it.

(I made this, then made a bunch of PRs, and then --profile appeared, so I kind of feel the core team's gaze.)

### hyperfine

[![sharkdp / hyperfine](https://opengraph.githubassets.com/1/sharkdp/hyperfine)](https://github.com/sharkdp/hyperfine)

A language-independent CLI benchmarking tool. Since it can be applied to any language, it's convenient to learn how to use it anyway.

## MoonBit's Measurement Axes

* Operations per second (ops)
* Memory consumption, peak memory
* Build size

When using caches, there can be trade-offs between memory and speed, but in many cases, it's just unoptimized code mixed in. Let's squash them while profiling.

## PR examples

I'll explain what I actually did from the PRs I submitted.

### Example [https://github.com/moonbitlang/core/pull/3620](https://github.com/moonbitlang/core/pull/3620)

In MoonBit (and Go language), the [Karatsuba method](https://en.wikipedia.org/wiki/Karatsuba_algorithm) is used for BigInt multiplication.

(I didn't know about the Karatsuba method beforehand either. I studied it as a side effect.)

This optimizes multiplication between BigInts, but it can become slower in patterns like BigInt * small integer. For example, in cases like Fibonacci functions, or in reality, it frequently appears in hash algorithms.

| backend | baseline | patched | delta |
| --- | --- | --- | --- |
| wasm | 255.1 ms | 80.2 ms | -68.6% |
| wasm-gc | 93.5 ms | 25.2 ms | -73.0% |
| native | 48.9 ms | 20.0 ms | -59.1% |
| js | 21.2 ms | 22.3 ms | noise |

This is a problem I actually encountered while porting Git and trying to optimize sha1 calculation.

### Example [https://github.com/moonbitlang/core/pull/3632](https://github.com/moonbitlang/core/pull/3632)

JSON optimization. In `lex_skip_whitespace`, the control character check was allocating to a heap StringView; by changing it to a simple character code check, it sped up and reduced memory allocations.

| metric | before | after | delta |
| --- | --- | --- | --- |
| Total alloc bytes | 145.13 MB | 107.37 MB | **−26.0 %** |
| Total #allocations | 13.15 M | 9.85 M | **−25.1 %** |
| `StringView::view` | 32.62 MB | 7.44 MB | **−77.2 %** |
| `String::view` | 12.59 MB | 0 | **gone** |

### Example [https://github.com/moonbitlang/core/pull/3711](https://github.com/moonbitlang/core/pull/3711)

Speed up `Array::sort` by skipping index bounds checks.

| case | before | after |  |
| --- | --- | --- | --- |
| `sort` n=1000 | 52.8 µs | **8.6 µs** | 6.1x |
| `sort` n=100000 | 8.65 ms | **3.88 ms** | 2.2x |
| `sort_by` n=10000 | 801 µs | **280 µs** | 2.9x |

## Currently Hot: Around SIMD

With MoonBit v0.10, V128 type support was added. This enables so-called SIMD operations.

[![20260608 MoonBit v0.10.0 Release | MoonBit](https://opengraph.githubassets.com/1/moonbitlang/moonbit)](https://www.moonbitlang.com/updates/2026/06/08/moonbit-0-10-0-release)

With this, you can perform SIMD operations on 128-bit wide SIMD vectors.

```
i8x16   ;; 8bit integer × 16 lane
i16x8   ;; 16bit integer × 8 lane
i32x4   ;; 32bit integer × 4 lane
i64x2   ;; 64bit integer × 2 lane
f32x4   ;; 32bit float × 4 lane
f64x2   ;; 64bit float × 2 lane
```

It can be used as Arm's NEON extension or x86's SSE extension in native environments, and MoonBit's V128 type uses these.

SIMD is something that clearly differentiates from JS in WebAssembly environments. TC39 has decided that JS does not support SIMD, so in JS, it can only fall back to equivalent slow processing.

Just using this doesn't speed up everything, but in applicable cases, it dramatically speeds things up. From experience, applicable cases speed up by about 5 to 25 times.

The V128 type is a feature I requested, and as soon as v128 was added to the nightly build, I was making libraries on my own.

[![Request: wasm SIMD (v128) support in Dwarfsm inline WAT parser · Issue #3228 · moonbitlang/core](https://opengraph.githubassets.com/1/moonbitlang/core/issues/3228)](https://github.com/moonbitlang/core/issues/3228)
[![mizchi / simd](https://opengraph.githubassets.com/1/mizchi/simd)](https://github.com/mizchi/simd)

The reason I'm introducing this is that since it's a newly added experimental feature, there is still a lot of room to rewrite the moonbitlang/core implementation itself with V128.

I also tuned some small parts.

[![perf(v128): optimize packed loads and truth checks by mizchi · Pull Request #3764 · moonbitlang/core](https://opengraph.githubassets.com/1/moonbitlang/core/pull/3764)](https://github.com/moonbitlang/core/pull/3764)

## How to Find Bugs

Basically, I profile my own MoonBit code on hand.

I was taking benchmarks with this zlib port. (It's probably the library with the most downloads among libraries other than the official team.)

[![mizchi / zlib.mbt](https://opengraph.githubassets.com/1/mizchi/zlib.mbt)](https://github.com/mizchi/zlib.mbt)

If the problem originates from `moonbitlang/core`, I include that in the scope and look for tuning opportunities.

If I tell AI to read the profiler and propose fixes, it proposes implementation candidates, so I implement them myself or have it do it. (Honestly, I often have AI do it and then work hard to catch up on the results.)

Anyway, if you provide overwhelming evidence, clear numerical evidence, it's easier to get it merged. Parts like API naming have preferences, but speed doesn't lie (as long as caching isn't involved).

Also, it's good to add edge case test cases as a bonus.

Today's AI can usually find something even with rough commands like `/goal` make it 10x faster than now.

From experience, in MoonBit, there is room for improvement in code like this:

* `O(n^2)` double loops usually have alternative solutions
* When the array length is known in advance, it's good to use fixed-length `FixedArray(n)`
* When fine-grained structs are lined up on the heap in series, `#valtype` can be used
* [https://www.moonbitlang.com/blog/moonbit-value-type](https://www.moonbitlang.com/blog/moonbit-value-type)
* When using immutable references to array slices, it's better to use `ArrayView` instead of `Array`, and `StringView` instead of `String`.

Let's find hotspots following the principle of "Don't guess, measure."

## End

Everyone, please create MoonBit libraries and tune them. It's a great experience to see the language you use getting visibly faster.

`moonbitlang/core` still has a reasonable amount of room for tuning left (language spec changes haven't caught up yet), so it's rewarding.

If AI proposes an algorithm you don't know, study it while tuning.
