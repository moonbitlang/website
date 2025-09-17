---
description: "用MoonBit开发一个C编译器"
slug: moonbit-c-compiler
image: /img/blogs/zh/2025-09-17-c-in-moonbit/cover.jpg
tags: [MoonBit]
---

# 用MoonBit开发一个C编译器

![](./cover.jpg)

## 前言

C语言是编程世界的基石，无数的系统和应用都构建在其之上。对任何一位计算机科学专业的学生或工程师而言，理解C语言的编译过程，都是一个既经典又富有挑战性的课题。

MoonBit是一门新兴的、为云计算和边缘计算设计的编程语言。它拥有强大的代数数据类型（ADT）和模式匹配、简洁的函数式特性以及完善的工具链。那么，用MoonBit来编写一个C编译器会是怎样的体验？它又会带来哪些独特的优势呢？

## Why MoonBit

相较于不少传统语言，MoonBit的诸多特性使其在构建编译器这类复杂的语言工具时显得尤为得心应手。我最看重的MoonBit特性有：ADT，模式匹配，函数式循环，llvm-binding，这些对于实现一个编译器来说尤为重要。

### 强大的模式匹配：告别冗长的if-else与Visitor

在编译器前端，我们无时无刻不在与“模式”打交道：这个Token序列是函数定义还是变量声明？这个AST节点是二元表达式还是函数调用？

MoonBit拥有远超许多传统语言的模式匹配能力，可以直接对结构体、数组乃至字符串进行深度解构，使得语法分析的逻辑变得异常直观。

假设我们已经将C代码转换成了Token序列，现在需要解析`int main() { ... }`这个模式。

**在MoonBit中，可以这样写：**

```moonbit
fn parse_main(toks: Array[Token]) -> CFunction? {
  match toks[:] {
    // Directly match the token array structure
    [KeyWord("int"), Identifier("main"), LParen, RParen, LBrace, ..body_toks] => {
      // Logic for parsing the function body...
    }
    _ => None // Not a match
  }
}
```

这种写法几乎就是BNF范式的直接翻译，清晰、安全且不易出错。

**而在C++中，我们通常需要手动管理一个迭代器或索引**，并通过一连串的`if`语句来逐个检查Token的类型和值。代码不仅冗长，而且边界检查、索引推进等细节极易引入bug。

```cpp
// Hypothetical C++ implementation
CFunction* parse_main(const std::vector<Token>& toks, size_t& pos) {
    // Manual boundary checks and verbose comparisons
    if (pos + 4 < toks.size() &&
        toks[pos].type == TokenType::Keyword && toks[pos].value == "int" &&
        toks[pos+1].type == TokenType::Identifier && toks[pos+1].value == "main" &&
        toks[pos+2].type == TokenType::LParen &&
        toks[pos+3].type == TokenType::RParen &&
        toks[pos+4].type == TokenType::LBrace)
    {
        pos += 5; // Manually advance the position
        // Logic for parsing function body...
        return new CFunction(...);
    }
    return nullptr;
}
```

对比之下，MoonBit的模式匹配将开发者从繁琐的过程式逻辑中解放出来，更专注于语法的核心结构。

### 函数式循环：优雅的状态机实现

词法分析本质上是一个状态机，它扫描源代码字符串，根据当前状态和遇到的字符，决定下一步的动作。MoonBit独特的“函数式循环”（`loop`表达式）非常适合这类任务。它将循环的状态（例如，剩余的字符串视图）作为参数，在每次迭代中“返回”新的状态，从而以一种声明式的方式推进状态机。

**在MoonBit中，实现词法分析器（tokenizer）的核心循环是这样的：**

```moonbit
pub fn tokenize(code: String) -> Array[Token] {
  let tokens: Array[Token] = []
  // The state is the remaining string view, which is passed to the next iteration
  loop code[:] {
    ['' | '\n' | '\r' | '\t' , ..rest] => continue rest // Skip whitespace
    [.. "->", ..rest] => { tokens.push(Arrow); continue rest }
    ['+', ..rest]     => { tokens.push(Plus);  continue rest }
    // ... other operators and keywords
    ['a'..'z' | 'A'..'Z' | '_', ..] as id_part => {
      // The `tokenize_identifier` function returns the new string view
      let rest = tokenize_identifier(id_part, tokens)
      continue rest
    }
    [] => { tokens.push(EOF); break } // End of stream
    [other, ..rest] => { raise LexError("Invalid character"); }
  }
  tokens
}
```

整个过程没有一个可变的索引变量，状态的传递清晰可见，逻辑如同链式反应般自然展开。

**在C++中，实现同样逻辑则是一个典型的过程式****`while`****循环**，需要一个可变的`pos`变量来手动追踪当前在字符串中的位置。

```cpp
// Hypothetical C++ implementation
std::vector<Token> tokenize(const std::string& code) {
    std::vector<Token> tokens;
    size_t pos = 0;
    while (pos < code.length()) {
        if (std::isspace(code[pos])) {
            pos++; // Manual state update
            continue;
        }
        if (code.substr(pos, 2) == "->") {
            tokens.push_back({TokenType::Arrow});
            pos += 2; // Manual state update
            continue;
        }
        // ... and so on
    }
    return tokens;
}
```

这种命令式的状态管理，虽然是C++程序员的日常，但相比MoonBit的函数式循环，无疑增加了心智负担，也更容易引入off-by-one之类的错误。

### LLVM Binding：安全、简洁的IR生成

LLVM是现代编译器的基石，但其C++ API以复杂和陡峭的学习曲线著称。开发者需要和大量的头文件、裸指针、以及手动内存管理打交道。

MoonBit官方提供了一个与LLVM C++ API风格保持一致，但更为安全和易用的绑定库。它利用MoonBit的类型系统和所有权机制，将不安全的操作封装起来。

**用MoonBit的LLVM绑定生成一个****`add`****函数：**

```moonbit
test "Simple LLVM Add" {
  let ctx = Context::new()
  let mod = ctx.addModule("demo")
  let builder = ctx.createBuilder()

  let i32ty = ctx.getInt32Ty()
  let fty = ctx.getFunctionType(i32ty, [i32ty, i32ty])
  let func = mod.addFunction(fty, "add")

  let bb = func.addBasicBlock(name="entry")
  builder.setInsertPoint(bb)

  let arg0 = func.getArg(0).unwrap()
  let arg1 = func.getArg(1).unwrap()
  let add_res = builder.createAdd(arg0, arg1, "add_res")
  let _ = builder.createRet(add_res)

  // Easily inspect the result in tests
  inspect(func, content=...)
}
```

代码简洁明了，没有裸指针，`Context`, `Module`, `Builder`等对象的生命周期由MoonBit管理，开发者可以专注于IR的逻辑构建。

**而在C++中，同样的操作则要繁琐得多：**

```cpp
#include "llvm/IR/LLVMContext.h"
#include "llvm/IR/Module.h"
#include "llvm/IR/IRBuilder.h"
#include "llvm/IR/Verifier.h"
// ... potentially more includes

// (Inside a function)
using namespace llvm;
static LLVMContext TheContext;
static IRBuilder<> Builder(TheContext);
static std::unique_ptr<Module> TheModule = std::make_unique<Module>("my_module", TheContext);

Function* createAddFunc() {
    std::vector<Type*> ArgTypes(2, Type::getInt32Ty(TheContext));
    FunctionType* FT = FunctionType::get(Type::getInt32Ty(TheContext), ArgTypes, false);
    Function* F = Function::Create(FT, Function::ExternalLinkage, "add", TheModule.get());

    BasicBlock* BB = BasicBlock::Create(TheContext, "entry", F);
    Builder.SetInsertPoint(BB);

    // Argument access is less direct
    auto Args = F->arg_begin();
    Value* Arg1 = Args++;
    Value* Arg2 = Args;

    Value* Sum = Builder.CreateAdd(Arg1, Arg2, "addtmp");
    Builder.CreateRet(Sum);

    verifyFunction(*F);
    return F; // Caller needs to manage the lifetime of the module
}
```

从头文件管理、命名空间、手动内存管理(`std::unique_ptr`)到函数签名的创建和参数的获取，C++版本的代码在每个环节都更为复杂。MoonBit的绑定库极大地降低了使用LLVM的门槛。

---

## mbtcc：一个用MoonBit实现的C编译器

项目地址：https://github.com/moonbitlang/mbtcc

基于以上优势，我们可以尝试用MoonBit实现一个能编译大型C项目的C11编译器。接下来，我们将深入其核心模块，一窥其设计细节。

### 词法分析

词法分析是将原始的C代码字符串转换为Token序列的过程。首先，我们定义了一个庞大的`Token`枚举，它涵盖了C语言中所有的关键字、符号、字面量等。为了方便调试和错误报告，我们在`mbtcc`中为每个Token都附加了位置信息。

```moonbit
// A simplified Token definition
pub enum Token {
  // Keywords
  Int; Return; If; Else, ...
  // Symbols
  Plus; Minus; LBrace; RBrace; Semi; ...
  // Literals, Identifiers and more
  Identifier(String)
  IntLit(String)
  StringLiteral(String)
  // Special tokens for macros
  Hash // #
  Hash2 // ##
  // End of File
  EOF,
}
```

随后，我们使用函数式循环`loop`来遍历整个源代码字符串，以下的代码展示了`mbtcc`的核心，在真正的`mbtcc`中，这个循环还会记录行列号等信息，这样可以在语法分析中提供友好的报错提示。

```moonbit
// Simplified logic from `lexer.mbt`
pub fn ParserContext::tokenize(self: Self) -> Unit {
  ...
  loop self.code[:] {
    [] => { self.alltoks.push(...); break } // Push EOF and finish

    // Skip whitespace and update location
    [' ' | '\n' | '\r' | '\t', .. rest] => { continue rest }

    // Skip comments
    [.. "//", ..] => { continue self.skip_line_comment() }
    [.. "/*", ..] => { continue self.skip_block_comment() }

    // Match operators
    [.. "->", .. rest] => { self.add_tok(Arrow); continue rest }
    ['-', ..rest ] => { self.add_tok(Minus); continue rest }
    ...

    // Match keywords or identifiers
    ['a'..'z' | 'A'..'Z' | '_', ..] as chunk => {
        continue self.tokenize_identifier_or_keyword(chunk)
    }
    // other cases for numbers, strings, etc.
    ...
  }
}
```

### 宏展开

宏展开过程的核心是再次遍历Token流，并根据宏指令（如`#define`, `#include`）对Token流进行转换：

> 可能部分读者会有疑问，C编译器的流程不应该是预处理，然后再词法分析吗？实际上，预处理中宏展开本身就要先做词法分析，得到Token序列之后直接替换掉特殊的Token，例如将`[Hash, Identifier("include"), StringLit(file), NewLine]`这四个Token，替换成file文件里经过词法分析得到的Token。有些C编译器的实现中，预处理宏展开所使用的词法分析可能与C代码所用的词法分析相同，有些可能不同，mbtcc所采用的是前者的策略，即使用相同的词法分析。这样实现起来更加简单。

```moonbit
// Simplified logic from `preprocess.mbt`
pub fn ParserContext::preprocess(self: Self) -> Unit {
  let new_toks: Array[Token] = []
  // A map to store macro definitions, from name to its token sequence
  let def_toks: Map[String, Array[Token]] = Map::new()

  loop self.toks[:] {
    // Handle `#include`, for example #include "file.h"
    [Hash, Identifier("include"), StringLiteral(f), ..rest] => {
      // Lex & preprocess the included file, then push tokens into `new_toks`
      ...
      continue rest
    }
    // Handle `#define` for example #define PI 3.14
    [Hash, Identifier("define"), Identifier(def_name), ..def_body] => {
      // Store the macro body in `def_toks`
      ...
      continue rest // The #define directive itself is consumed
    }
    // Handle #ifdef MACRO
    [Hash, Identifier("ifdef"), Identifier(def_name), ..rest] => { ... }

    // An identifier that might be a macro that needs expansion
    [Identifier(name), ..rest] if def_toks.contains_key(name) => {
      new_toks.push_all(def_toks[name]) // Replace with macro body
      continue rest
    }
    // Other tokens are passed through directly
    [tok, ..rest] => { new_toks.push(tok); continue rest }
    [] => break,
  }
  self.toks = new_toks // Replace the old token stream
}
```

### 语法分析

在得到最终的Token流后，便进入了语法分析阶段，其目标是构建抽象语法树（AST）。这是`mbtcc`中最能体现MoonBit语言优势的部分。`mbtcc`参考了C11的BNF范式来设计解析器。

一个关键的辅助工具是`ParserContext`，它贯穿整个解析过程，其中存储了如`typedefs`这样的关键信息。在C语言中，`typedef`的存在使得一个标识符可能是类型名也可能是变量名，正确区分它们是语法分析的一大难点。

```moonbit
// From `Context.mbt`
struct ParserContext {
  // ... other fields
  // A set of all identifiers that have been declared as a type via typedef
  typedefs: Set[String]
}
```

以解析一个主表达式（Primary Expression）为例，其解析函数`PrimExpr::parse`充分展现了模式匹配的威力：

```moonbit
// Simplified logic from `parser.mbt`
fn ParserContext::parse_prim_expr(
  self: Self, toks: ArrayView[Token]
) -> (PrimExpr, ArrayView[Token]) raise {
  match toks {
    // Identifier, but it must NOT be a type name.
    // This is where `ctx.typedefs` becomes crucial.
    [Identifier(name), ..rest] if !ctx.typedefs.contains(name) =>
      (PrimExpr::Identifier(name), rest)

    // A constant value
    [Constant(c), ..rest] => (Constant(c), rest)

    // String literals can be concatenated, e.g., "hello" " world".
    // A nested loop handles this concatenation.
    [StringLiteral(lit), ..rest] => {
      let mut s = lit
      let rest = loop rest {
        [StringLiteral(next_lit), ..next_rest] => {
          s += next_lit
          continue next_rest
        }
        r => break r
      }
      (PrimExpr::StringLiteral(s), rest)
    }

    // A parenthesized expression: ( expr )
    [LParen, ..rest] => {
      let (expr, rest_after_expr) = Expr::parse(rest, ctx)?
      // Use `guard` to ensure a closing parenthesis exists
      guard rest_after_expr is [RParen, ..rest_after_paren] else {
        raise ParseError("Expected ')'")
      }
      (ParenExpr(expr), rest_after_paren)
    }

    // Other cases for __builtin_offsetof, etc.
    _ => raise ParseError("Unrecognized primary expression")
  }
}
```

通过这种方式，我们几乎能以一种声明式的方式来描述语法规则，代码的可读性和可维护性都非常高。

### 代码生成

当AST构建完毕后，就进入了将AST转换为LLVM IR的最后阶段。`mbtcc`为每个函数维护一个`CodeGenContext`，其中最重要的部分是符号表`sym_table`，它负责将源代码中的变量名映射到LLVM世界中的值。

```moonbit
traitalias @IR.Value as LLVMValue

struct CodeGenContext {
  // ... llvm context, builder, module
  sym_table: Map[String, &LLVMValue]
  // ... other fields like current function, parent context etc.
}
```

代码生成的过程是递归遍历AST的过程。例如，当遇到一个变量引用时，我们从`sym_table`中查找它对应的`LLVMValue`。当遇到一个`if`语句时，我们为其生成对应的基本块（basic block）和条件跳转指令。

为一个`if`语句生成代码的逻辑大致如下：

```moonbit
// Simplified code generation for an if statement
fn IfStmt::codegen(self: IfStmt, ctx: CodeGenContext) -> Unit {
  let builder = ctx.builder
  let func = builder.getInsertBlock().getParent()

  // Create basic blocks for the branches and the merge point
  let then_bb = func.addBasicBlock(name="then")
  let else_bb = func.addBasicBlock(name="else")
  let merge_bb = func.addBasicBlock(name="ifcont")

  // Codegen for the condition, resulting in a boolean value
  let cond_val = self.cond.codegen(ctx)
  // ... convert cond_val to a 1-bit integer (i1)

  // Create the conditional branch instruction
  builder.createCondBr(cond_bool, then_bb, else_bb)

  // Populate the 'then' block
  builder.setInsertPoint(then_bb)
  self.then_branch.codegen(ctx)
  builder.createBr(merge_bb) // Jump to merge block

  // Populate the 'else' block
  builder.setInsertPoint(else_bb)
  if self.else_branch is Some(e) { e.codegen(ctx) }
  builder.createBr(merge_bb) // Jump to merge block

  // Continue code generation from the merge block
  builder.setInsertPoint(merge_bb)
}
```

### 质量保证：如何测试一个编译器

编译器的正确性至关重要。`mbtcc`采用了一套严格的端到端（End-to-End）测试方案，以确保其编译结果的正确性。这个过程被编写在`test.sh`脚本中，其核心思想是——**与****`gcc`****对拍**。

“对拍”，即让我们的程序和公认的、成熟的程序（在这里是`gcc`）运行同样的输入，并比对它们的输出。如果输出完全一致，我们就很有信心地认为我们的程序在这次测试中是正确的。

`mbtcc`的测试流程如下：

1. **准备测试用例**：我们在`ctest/`目录下准备了大量的C语言源文件，这些文件覆盖了C语言的各种语法特性和常用算法，例如`quick_sort.c`, `hash_table.c`, `kruskal.c`等。
2. **获取标准答案**：测试脚本首先会用`gcc`编译每一个C测试文件，并运行生成的可执行文件，将其输出作为“期望输出”（Expected Output）。
3. **编译与运行****`mbtcc`**：接着，脚本会调用`mbtcc`来编译同一个C文件，将其转换为LLVM IR。
4. **生成****`mbtcc`****可执行文件**：然后，使用`clang`将`mbtcc`生成的LLVM IR编译成最终的可执行文件。
5. **获取实际输出**：运行这个由`mbtcc`产生的可执行文件，得到“实际输出”（Actual Output）。
6. **比对结果**：最后，脚本会断言“期望输出”和“实际输出”是否完全一致。如果不一致，测试失败并立即退出；如果一致，则测试通过。

通过这个自动化的对拍流程，`mbtcc`得以在每次代码变更后，都能快速验证其核心功能的正确性，确保我们向着一个可靠的C编译器的目标稳步前进。

### 尝试

让我们用`mbtcc`编译一个经典的斐波那契函数：

```c
int fib(int n) {
  if (n <= 2) { return 1; }
  return fib(n-1) + fib(n-2);
}
```

使用`mbtcc`对上面的代码进行编译，很快得到`llvm IR`:

```llvm
define i32 @fib(i32 %n) {
entry:
  %cmp = icmp sle i32 %n, 2
  br i1 %cmp, label %if.then, label %if.else

if.then:
  ret i32 1

if.else:
  %sub1 = sub nsw i32 %n, 1
  %call1 = call i32 @fib(i32 %sub1)
  %sub2 = sub nsw i32 %n, 2
  %call2 = call i32 @fib(i32 %sub2)
  %add = add nsw i32 %call1, %call2
  ret i32 %add
}
```

这正是我们想要的IR。

## 展望

目前，`mbtcc`项目已经能够编译许多常用的数据结构，包括链表，哈希表，堆。也可以编译一些算法，例如快速排序，归并排序，Dijkstra，kruskal，Prim等。初步验证了使用MoonBit开发C编译器的可行性与优越性。

这个项目已经初步展示出MoonBit在编程语言实现领域的潜力。未来，`mbtcc`会被继续完善，向着支持完整C11标准的目标迈进。如果你对这个项目感兴趣，欢迎访问源码仓库，

## 参考资料

- `mbtcc`: https://github.com/moonbitlang/mbtcc/tree/master
- `llvm.mbt`: https://mooncakes.io/docs/Kaida-Amethyst/llvm
- `C11 BNF`: https://github.com/moonbitlang/mbtcc/blob/master/parser/c.g4
- MoonBit: https://www.moonbitlang.cn/
