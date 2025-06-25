---
hide_table_of_contents: true
---

# 关于我们

MoonBit是由张宏波为主的团队开发的一种专为高性能与资源效率设计的通用型编程语言及工具链，针对WebAssembly进行优化。MoonBit的创建原因之一，在于张宏波认为现有的语言如Java、Go、Rust等难以充分发挥WebAssembly指令集在云计算和边缘计算领域安全且快速的优势。在初次发布时实现对WebAssembly的原生支持后，MoonBit陆续新增了对JavaScript、Native，以及LLVM后端的支持。

MoonBit于2023年8月公开发布，目前处于Pre-beta阶段，于2024年12月以宽松的SSPL[开源编译器](https://github.com/moonbitlang/moonbit-compiler)。

## 特性

MoonBit设计准则为“快速、简单、可拓展”，支持函数式、并行式、过程式以及面向对象的编程风格。

MoonBit采用了强类型以及数据导向的语言设计，对运行时、编译时性能，以及Wasm文件体积进行了优化，并提供了内置调试、测试、值追踪、AI编程辅助、代码覆盖率工具测量等工具。

MoonBit的Hello World程序如下：

```moonbit
fn main {
    println("hello world!")
}
```

## 设计理念

MoonBit的语法接近Rust，是一种强类型语言，具有模式匹配、静态类型和类型推断等语言特性，从而对数据类型实施严格限制。不同于Rust无垃圾回收的设计，MoonBit引入了垃圾回收器，并采用了WasmGC提案。

在语言设计哲学上，创建者张宏波表示，MoonBit同样从Go的“少即是多”中汲取了灵感，避免添加过多的语法。

MoonBit设计为一门[大模型友好](https://dl.acm.org/doi/abs/10.1145/3643795.3648376)的编程语言，采用实时基于语义的采样器，并通过包括安全类型系统、Wasm沙盒安全、死代码消除的措施，确保MoonBit代码生成的可靠性。

## 生态

MoonBit在初次发布时便提供了一个网页版IDE，并同时有一个Visual Studio Code插件。由于采用容错类型系统，MoonBit的IDE与编译器得以共享代码库，使得Visual Studio Code中的MoonBit语言成为一等公民。Moon是MoonBit编程语言的构建系统。mooncakes.io是MoonBit的包管理系统，主要用于构建、管理和维护MoonBit的第三方包。为了在嵌入浏览器时与托管运行时进行交互，MoonBit 引用了外部函数接口（FFI）。

MoonBit采用多后端语言方法，并针对各个后端进行了优化，后端支持包括Wasm、JavaScript、Native，以及LLVM。

## 应用

MoonBit 提供了一个 [Visual Studio Code 扩展](https://marketplace.visualstudio.com/items?itemName=moonbit.moonbit-lang&ssr=false#overview)，支持开箱即用的调试、代码补全和工具提示。
