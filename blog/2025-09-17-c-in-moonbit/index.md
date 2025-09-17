---
description: "Developing a C Compiler in MoonBit"
slug: moonbit-c-compiler
image: /img/blogs/2025-09-17-c-in-moonbit/cover.jpg
tags: [MoonBit]
---

# Developing a C Compiler in MoonBit

![](./cover.jpg)

## Foreword

The C language is a cornerstone of the programming world, with countless systems and applications built upon it. For any computer science student or engineer, understanding the C compilation process is a classic yet challenging endeavor.

MoonBit is an emerging programming language designed for cloud and edge computing. It boasts powerful algebraic data types (ADTs) and pattern matching, concise functional features, and a comprehensive toolchain. So, what is it like to write a C compiler in MoonBit? And what unique advantages does it offer?

## Why MoonBit?

Compared to many traditional languages, MoonBit's features make it particularly adept at building complex language tools like compilers. The features I value most in MoonBit are its ADTs, pattern matching, functional loops, and LLVM bindings, which are especially crucial for implementing a compiler.

### Powerful Pattern Matching: Goodbye to Verbose if-else and Visitors

In the compiler frontend, we are constantly dealing with "patterns": Does this sequence of tokens represent a function definition or a variable declaration? Is this AST node a binary expression or a function call?

MoonBit possesses pattern-matching capabilities that far exceed those of many traditional languages. It can directly deconstruct structs, arrays, and even strings, making the logic of syntax analysis exceptionally intuitive.

Suppose we have converted C code into a sequence of tokens and now need to parse the pattern `int main() { ... }`.

**In MoonBit, you can write it like this:**

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

This code is almost a direct translation of a BNF-style grammar rule—clear, safe, and less prone to errors.

**In C++, however, we typically need to manually manage an iterator or an index**, checking the type and value of each token through a series of `if` statements. The code is not only verbose, but the details of boundary checks and index progression are highly susceptible to bugs.

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

In contrast, MoonBit's pattern matching frees developers from tedious procedural logic, allowing them to focus on the core structure of the grammar.

### Functional Loops: Elegant State Machine Implementation

Lexical analysis is essentially a state machine that scans the source code string, deciding its next action based on the current state and the character it encounters. MoonBit's unique "functional loop" (`loop` expression) is perfectly suited for such tasks. It takes the state of the loop (e.g., the remaining string view) as a parameter and "returns" a new state in each iteration, thus advancing the state machine in a declarative style.

**In MoonBit, the core loop of a tokenizer looks like this:**

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

The entire process involves no mutable index variables. The state transition is clear and visible, and the logic unfolds as naturally as a chain reaction.

**In C++, implementing the same logic typically involves a procedural `while` loop**, requiring a mutable `pos` variable to manually track the current position in the string.

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

While this imperative style of state management is routine for C++ programmers, it undoubtedly adds cognitive load and is more prone to off-by-one errors compared to MoonBit's functional loops.

### LLVM Bindings: Safe and Concise IR Generation

LLVM is the foundation of modern compilers, but its C++ API is notorious for its complexity and steep learning curve. Developers must contend with a multitude of header files, raw pointers, and manual memory management.

MoonBit provides an official binding library that maintains a style consistent with the LLVM C++ API but is significantly safer and easier to use. It leverages MoonBit's type system to encapsulate unsafe operations.

**Generating an `add` function with MoonBit's LLVM bindings:**

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

The code is clean and straightforward. There are no raw pointers, and the lifetimes of objects like `Context`, `Module`, and `Builder` are managed by MoonBit, allowing the developer to focus on the logic of IR construction.

**In C++, the same operation is much more cumbersome:**

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

From header management and namespaces to manual memory management (`std::unique_ptr`) and the creation of function signatures and argument retrieval, the C++ version is more complex at every step. MoonBit's binding library significantly lowers the barrier to using LLVM.

---

## mbtcc: A C Compiler Implemented in MoonBit

Project URL: https://github.com/moonbitlang/mbtcc

Building on these advantages, we can attempt to implement a C11 compiler in MoonBit capable of compiling large C projects. Next, we will delve into its core modules to get a glimpse of its design details.

### Lexical Analysis

Lexical analysis is the process of converting the raw C code string into a sequence of tokens. First, we define a large `Token` enum that covers all keywords, symbols, literals, etc., in the C language. For ease of debugging and error reporting, we attach position information to each token in `mbtcc`.

```moonbit
// A simplified Token definition
pub enum Token {
  // Keywords
  Int; Return; If; Else; ...
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
  EOF
}
```

Next, we use a functional `loop` to iterate through the entire source code string. The code below shows the core of `mbtcc`. In the actual implementation, this loop also records line and column numbers to provide friendly error messages during syntax analysis.

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

### Macro Expansion

The core of the macro expansion process is to iterate over the token stream again and transform it based on macro directives (like `#define`, `#include`).

> Some readers might wonder, shouldn't the C compiler's workflow be preprocessing followed by lexical analysis? In reality, macro expansion within preprocessing itself requires lexical analysis first. After obtaining a token sequence, special tokens are replaced directly. For example, the four tokens `[Hash, Identifier("include"), StringLit(file), NewLine]` are replaced by the tokens obtained from lexically analyzing the content of `file`. In some C compiler implementations, the lexical analysis used for macro expansion may be the same as that used for C code, while in others it may differ. `mbtcc` adopts the former strategy, using the same lexical analysis, which simplifies the implementation.

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

### Syntax Analysis

After obtaining the final token stream, we enter the syntax analysis phase, with the goal of building an Abstract Syntax Tree (AST). This is the part of `mbtcc` that best demonstrates the advantages of the MoonBit language. `mbtcc` designs its parser with reference to the BNF grammar of C11.

A key utility is the `ParserContext`, which persists throughout the parsing process and stores critical information such as `typedefs`. In C, the existence of `typedef` means an identifier could be either a type name or a variable name. Correctly distinguishing between them is a major challenge in parsing.

```moonbit
// From `Context.mbt`
struct ParserContext {
  // ... other fields
  // A set of all identifiers that have been declared as a type via typedef
  typedefs: Set[String]
}
```

Taking the parsing of a primary expression as an example, the `PrimExpr::parse` function fully showcases the power of pattern matching:

```moonbit
// Simplified logic from `parser.mbt`
fn ParserContext::parse_prim(
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

In this way, we can describe grammar rules in an almost declarative fashion, resulting in highly readable and maintainable code.

### Code Generation

Once the AST is built, the final stage is to convert the AST into LLVM IR. `mbtcc` maintains a `CodeGenContext` for each function. The most important part of this context is the symbol table, `sym_table`, which maps variable names from the source code to their corresponding values in the LLVM world.

```moonbit
traitalias @IR.Value as LLVMValue

struct CodeGenContext {
  // ... llvm context, builder, module
  sym_table: Map[String, &LLVMValue]
  // ... other fields like current function, parent context etc.
}
```

The code generation process is a recursive traversal of the AST. For example, when we encounter a variable reference, we look up its corresponding `LLVMValue` in the `sym_table`. When we encounter an `if` statement, we generate the corresponding basic blocks and conditional branch instructions.

The logic for generating code for an `if` statement is roughly as follows:

```moonbit
// Simplified code generation for an if statement
fn IfStmt::codegen(self: IfStmt, ctx: CodeGenContext) -> Unit {
  let builder = ctx.builder
  let func = builder.getInsertBlock().getParent()

  // Create basic blocks for the branches and the merge point
  let then_bb = func.addBasicBlock("then")
  let else_bb = func.addBasicBlock("else")
  let merge_bb = func.addBasicBlock("ifcont")

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

### Quality Assurance: How to Test a Compiler

The correctness of a compiler is paramount. `mbtcc` employs a rigorous end-to-end testing strategy to ensure the correctness of its compilation results. This process is scripted in `test.sh`, and its core idea is **comparison against `gcc`**. We have our program and a recognized, mature program (`gcc` in this case) run on the same input and compare their outputs. If the outputs are identical, we can be highly confident that our program is correct for that test case.

The testing flow for `mbtcc` is as follows:

1.  **Prepare Test Cases**: We have a large number of C source files in the `ctest/` directory, covering various language features and common algorithms, such as `quick_sort.c`, `hash_table.c`, and `kruskal.c`.
2.  **Obtain the Standard Answer**: The test script first compiles each C test file with `gcc`, runs the resulting executable, and saves its output as the "Expected Output."
3.  **Compile and Run `mbtcc`**: The script then invokes `mbtcc` to compile the same C file into LLVM IR.
4.  **Generate `mbtcc` Executable**: Next, `clang` is used to compile the LLVM IR generated by `mbtcc` into a final executable file.
5.  **Obtain Actual Output**: This executable, produced by `mbtcc`, is run to get the "Actual Output."
6.  **Compare Results**: Finally, the script asserts whether the "Expected Output" and "Actual Output" are identical. If they are not, the test fails and exits immediately; if they are, the test passes.

Through this automated comparison process, `mbtcc` can quickly verify the correctness of its core functionality after every code change, ensuring steady progress toward our goal of a reliable C compiler.

### Trying It Out

Let's compile a classic Fibonacci function with `mbtcc`:

```c
int fib(int n) {
  if (n <= 2) { return 1; }
  return fib(n-1) + fib(n-2);
}
```

Compiling the code above with `mbtcc` quickly yields the following LLVM IR:

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

This is exactly the IR we wanted.

## Future Outlook

Currently, the `mbtcc` project can compile many common data structures, including linked lists, hash tables, and heaps. It can also compile algorithms like quicksort, mergesort, Dijkstra's, Kruskal's, and Prim's. This has served as an initial validation of the feasibility and advantages of developing a C compiler in MoonBit.

This project has begun to showcase MoonBit's potential in the field of programming language implementation. In the future, `mbtcc` will be further improved with the goal of supporting the full C11 standard. If you are interested in this project, feel free to visit the source code repository.

## References

- `mbtcc`: https://github.com/moonbitlang/mbtcc/tree/master
- `llvm.mbt`: https://mooncakes.io/docs/Kaida-Amethyst/llvm
- `C11 BNF`: https://github.com/moonbitlang/mbtcc/blob/master/parser/c.g4
- MoonBit: https://www.moonbitlang.com/
