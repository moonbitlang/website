# VSCode Overview

## What’s MoonBit

MoonBit is a Rust-like language (with GC support) and toolchain optimized for WebAssembly experience.

## Main advantages

- State of the art compile-time performance.
- Simple but practical, data-oriented language design.
- Generate significantly smaller WASM output than Rust.
- Much faster runtime performance than GO.

![advantages](imgs/advantage.png)

[Data source](https://github.com/moonbitlang/moonbit-docs/tree/main/benchmark/fibonacci)

## Features

- Cloud-native debugging

MoonBit Debugger now supports source mapping, setting breakpoints based on source code, and outputting source maps for source code debugging in the browser.

- [MoonBit IDE](https://try.moonbitlang.com/): a real-time visual development tool

MoonBit provides support for IDEs that not only includes all the functionalities of modern IDEs but also features an innovative characteristic: it can run completely in the cloud/edge side.

Unlike other CloudIDEs, MoonBit does not rely on containers. Most programming languages' IDEs today are designed for desktop operating systems and have not adapted well to cloud-native environments and edge computing needs. MoonBit breaks through this limitation by adopting a highly parallel architecture and native support for separate compilation, allowing CloudIDEs to run directly on the edge. Its rapid semantic analysis technology can handle large codebases and achieve IDE responses in milliseconds, even in larger-scale codebases.

- [MoonBit AI](https://ai.moonbitlang.com/)

## What's next

- If you are new to MoonBit, check out [MoonBit Docs](https://github.com/moonbitlang/moonbit-docs) to know more about MoonBit overview, functions, structures, data types, and more.
- Start a discussion([EN](https://discuss.moonbitlang.com/)/[CH](https://taolun.moonbitlang.cn/latest)) or get help on our [Discord server](https://discord.gg/D24vtg6tFV).
- Explore MoonBit programming projects in the MoonBit [Gallery](https://www.moonbitlang.com/gallery/).
- As MoonBit is close to beta status, MoonBit core is now open source for more feedback from daily users. Check out the [Contribution Guide](https://github.com/moonbitlang/core/blob/main/CONTRIBUTING.md) for more information on how to contribute.

## Status and aimed timeline

MoonBit is close to beta status and the language features are stabilizing. We expect MoonBit to reach _beta_ in 06/2024.

When MoonBit reaches beta, it means any backwards-incompatible changes will be seriously evaluated and MoonBit _can_ be used in production (very rare compiler bugs). MoonBit is developed by a talented full-time team who have extensive experience in building language toolchains, so we will grow much faster than the typical language ecosystem. You won't wait long to use MoonBit in your production.

## Feedback on MoonBit VSCode extension

If you have any issues or feedback on MoonBit VSCode extension, please file an issue [here](https://github.com/moonbitlang/moonbit-docs/issues).

## Contact Us

If you have any query, please email to: support@moonbitlang.com
