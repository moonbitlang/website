---
hide_table_of_contents: true
---

# About us

MoonBit is a general-purpose programming language and toolchain designed for high performance and resource efficiency, optimized for WebAssembly (Wasm). It is developed by a young and passionate team led by Zhang Hongbo. One of the motivations behind MoonBit’s creation was Zhang’s belief that existing languages like Java, Go, and Rust do not fully leverage the security and speed advantages of the WebAssembly instruction set, particularly in cloud computing and edge computing. After its initial release with native WebAssembly support, MoonBit later added support for JavaScript, Native, and the LLVM backend.

MoonBit was publicly released in August 2023 and is currently in its pre-beta stage. The compiler was [open-sourced](https://github.com/moonbitlang/moonbit-compiler) under the permissive SSPL in December 2024.

## Features

MoonBit follows the design principles of "fast, simple, and extensible" and supports functional, parallel, procedural, and object-oriented programming styles.

The language is strongly typed and data-oriented, with optimizations for runtime and compile-time performance as well as Wasm file size. It provides built-in tools for debugging, software testing, value tracing, AI-assisted programming, and code coverage analysis.

The "Hello, World" program in MoonBit:

```moonbit
fn main {
    println("hello world!")
}
```

## Language Design

MoonBit has a syntax similar to Rust and is a strongly typed language featuring pattern matching, static types, and type inference to enforce strict data type constraints. Unlike Rust, which does not use garbage collection, MoonBit includes a garbage collector and adopts the WasmGC proposal.

According to its creator Zhang Hongbo, MoonBit draws inspiration from Go’s philosophy of simplicity, avoiding unnecessary complexity in syntax.

MoonBit is designed to be [a LLM friendly programming language](https://dl.acm.org/doi/abs/10.1145/3643795.3648376), using real-time semantic sampling. It ensures reliability in code generation through a secure type system, Wasm sandboxing, and dead code elimination.

## Ecosystem

At launch, MoonBit provided a web-based IDE along with a Visual Studio Code extension. The language’s IDE and compiler share a unified codebase, allowing MoonBit to be a first-class language in Visual Studio Code due to its fault-tolerant type system.

- **Moon** is MoonBit’s build system.
- **mooncakes.io** is MoonBit’s package management system, used for building, managing, and maintaining third-party packages.
- **Foreign Function Interface (FFI)** is used for interoperability when embedding MoonBit in a browser or interacting with a host runtime.

MoonBit employs a multi-backend approach, optimizing for different targets, including WebAssembly, JavaScript, Native, and LLVM.

## Usage

MoonBit has a [Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=moonbit.moonbit-lang&ssr=false#overview) that provides out-of-the-box debugging, code completion, and tooltips.
