---
description: "MoonBit Programming Language 1.0 Roadmap Preview"
slug: roadmap
image: /img/blogs/2025-07-24-roadmap/cover.jpg
tags: [MoonBit]
---

# MoonBit Programming Language 1.0 Roadmap Preview

![](./cover.jpg)

In June 2025, MoonBit released its beta version, with most of its syntax and language features stabilized. We are planning to officially launch version 1.0 in the first half of 2026. Leading up to this milestone, we will continue refining the language’s core capabilities to further enhance its expressiveness and performance guarantees. This article highlights the key features and directions we’re focusing on as we move toward the 1.0 release.

## Native Support for Value Types

Currently, most struct and enum types in MoonBit use **reference semantics**, which may involve pointer indirection and introduce some performance overhead. In the beta version, we’ve already optimized performance-critical data structures using value types in both Native and Wasm backends, significantly improving execution efficiency.

In version 1.0, MoonBit will offer generalized support for **value types**. Developers can explicitly opt into value semantics using attributes, enabling more efficient, memory-friendly data layouts. This reduces allocation and GC pressure, while improving cache locality. For example:

```mbt
#valtype
struct Complex {
  real: Double
  imag: Double
}
```

This feature gives developers structured, controllable, and high-performance options for data representation.

## Async Runtime and Resource Cleanup

MoonBit’s beta version already includes syntax and basic primitives for asynchronous programming. To complete the async experience, we will introduce a lightweight async runtime in the 1.0 release, supporting efficient event-driven execution and task scheduling.

### Structured Concurrency and Task Cancellation

We are especially focused on the composability and safety of async code. The new runtime will adopt **structured concurrency**, ensuring that all tasks spawned within an async scope are automatically completed or terminated when the scope exits. This helps prevent resource leaks and dangling tasks.

In addition, MoonBit will offer native support for **task cancellation**. Developers can safely abort async operations using cancel primitives or timeout mechanisms, and handle interruptions gracefully—improving robustness and responsiveness.

### defer for Resource Cleanup

To complement async support, we are introducing a defer mechanism that allows developers to register cleanup actions that run automatically when a scope ends. This feature works in both sync and async contexts and makes operations like closing files, releasing locks, or canceling tasks safer and clearer.

## More Powerful Pattern Matching

MoonBit treats pattern matching as a first-class feature. The beta version already supports rich matching capabilities across JSON, arrays, strings, maps, and more. In 1.0, we plan to expand this further with:

### Regex Pattern Matching

We’re adding regex pattern matching syntax, allowing developers to match strings structurally and assign names to the captured parts. For example:
```mbt
match "user@example.com" using regex {
  ["[a-zA-Z0-9._+-]+" as user,
   "@",
   "[a-zA-Z0-9.-]+" as domain,
   "\\\\.",
   "[a-zA-Z]+" as tld, ..] => { ... }
   ...
}
```
This is especially useful for tasks like text parsing and log analysis.

### View Patterns

View patterns allow developers to define custom ways to destructure data, making it easier to abstract over internal representations. This is useful in two main scenarios:

- Pattern matching on third-party types: In MoonBit, data from many third-party bindings (such as the LLVM binding) is represented using abstract types that require calling APIs to inspect. View patterns let developers express these inspections as clean and intuitive match expressions, greatly improving readability.
- Metaprogramming and DSL support: MoonBit already bootstraps its own lexer and parser. As the language evolves, its AST may change. View patterns, along with smart constructors, offer a stable interface for working with syntax trees, making it easier to write language tools and extensions that are forward-compatible across versions.

## Standard Library Cleanup and Stabilization

The current standard library is evolving rapidly. As part of 1.0, we’ll conduct a systematic review with the following goals:

- Unify naming conventions
- Simplify commonly used APIs
- Emphasize consistency and the principle of least surprise
- Provide well-documented, easy-to-navigate APIs

Our aim is to deliver a clean, intuitive, and coherent standard library covering key areas like systems programming, async operations, collections, and string handling.

MoonBit is on track to become a more powerful, modern, and efficient systems programming language. We look forward to the 1.0 release and invite the community to participate, give feedback, and help shape the future of this next-generation language toolchain.
