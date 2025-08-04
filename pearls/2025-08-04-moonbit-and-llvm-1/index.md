---
description: 'Dancing with LLVM: A Moonbit Chronicle (Part 1) - Implementing the Frontend'
slug: moonbit-and-llvm-1
image: cover.png
---

# Dancing with LLVM: A Moonbit Chronicle (Part 1) - Implementing the Frontend

![](./cover.png)

---

## Introduction

Programming language design and compiler implementation have long been considered among the most challenging topics in computer science. The traditional path to learning compilers often requires students to first master a complex set of theoretical foundations:

- **Automata Theory**: Finite state machines and regular expressions
- **Type Theory**: The mathematical underpinnings of λ-calculus and type systems
- **Computer Architecture**: Low-level implementation from assembly language to machine code

However, Moonbit, a functional programming language designed for the modern development landscape, offers a fresh perspective. It not only features a rigorous type system and exceptional memory safety guarantees but, more importantly, its rich syntax and toolchain tailored for the AI era make it an ideal choice for learning and implementing compilers.

> **Series Overview**
> This series of articles will delve into the core concepts and best practices of modern compiler implementation by building a small programming language compiler called **TinyMoonbit**.
>
> - **Part 1**: Focuses on the implementation of the language frontend, including lexical analysis, parsing, and type checking, ultimately generating an abstract syntax tree with complete type annotations.
> - **Part 2**: Dives into the code generation phase, utilizing Moonbit's official `llvm.mbt` binding library to convert the abstract syntax tree into LLVM intermediate representation and finally generate RISC-V assembly code.

---

## TinyMoonbit Language Design

TinyMoonbit is a systems-level programming language with an abstraction level comparable to C. Although its syntax heavily borrows from Moonbit, TinyMoonbit is not a subset of the Moonbit language. Instead, it is a simplified version designed to test the feature completeness of `llvm.mbt` while also serving an educational purpose.

> Note: Due to space constraints, the TinyMoonbit implementation discussed in this series is simpler than the actual TinyMoonbit. For the complete version, please refer to [TinyMoonbitLLVM](https://github.com/moonbitlang/llvm.mbt).

### Core Features

TinyMoonbit provides the fundamental features required for modern systems programming:

- ✅ **Low-level Memory Operations**: Direct pointer manipulation and memory management
- ✅ **Control Flow Structures**: Conditional branches, loops, and function calls
- ✅ **Type Safety**: Static type checking and explicit type declarations
- ❌ **Simplified Design**: To reduce implementation complexity, advanced features like type inference and closures are not supported.

### Syntax Example

Let's demonstrate TinyMoonbit's syntax with a classic implementation of the Fibonacci sequence:

```moonbit
extern fn print_int(x : Int) -> Unit;

// Recursive implementation of the Fibonacci sequence
fn fib(n : Int) -> Int {
  if n <= 1 {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}

fn main {
  print_int(fib(10));
}
```

### Compilation Target

After the complete compilation process, the above code will generate the following LLVM Intermediate Representation:

```llvm
; ModuleID = 'tinymoonbit'
source_filename = "tinymoonbit"

define i32 @fib(i32 %0) {
entry:
  %1 = alloca i32, align 4
  store i32 %0, ptr %1, align 4
  %2 = load i32, ptr %1, align 4
  %3 = icmp sle i32 %2, 1
  br i1 %3, label %4, label %6

4:                                                ; preds = %entry
  %5 = load i32, ptr %1, align 4
  ret i32 %5

6:                                                ; preds = %4, %entry
  %7 = load i32, ptr %1, align 4
  %8 = sub i32 %7, 1
  %9 = call i32 @fib(i32 %8)
  %10 = load i32, ptr %1, align 4
  %11 = sub i32 %10, 2
  %12 = call i32 @fib(i32 %11)
  %13 = add i32 %9, %12
  ret i32 %13
}

define void @main() {
entry:
  %0 = call i32 @fib(i32 10)
  call void @print_int(i32 %0)
}

declare void @print_int(i32 %0)
```

---

## Chapter 2: Lexical Analysis

**Lexical Analysis** is the first stage of the compilation process. Its core mission is to convert a continuous stream of characters into a sequence of meaningful **tokens**. This seemingly simple conversion process is, in fact, the cornerstone of the entire compiler pipeline.

### From Characters to Symbols: Token Design and Implementation

Consider the following code snippet:

```moonbit
let x : Int = 5;
```

After being processed by the lexer, it will produce the following sequence of tokens:

```
(Keyword "let") → (Identifier "x") → (Symbol ":") →
(Type "Int") → (Operator "=") → (IntLiteral 5) → (Symbol ";")
```

This conversion process needs to handle various complex situations:

1.  **Whitespace Filtering**: Skipping spaces, tabs, and newlines.
2.  **Keyword Recognition**: Distinguishing reserved words from user-defined identifiers.
3.  **Numeric Parsing**: Correctly identifying the boundaries of integers and floating-point numbers.
4.  **Operator Handling**: Differentiating between single-character and multi-character operators.

### Token Type System Design

Based on the TinyMoonbit syntax specification, we classify all possible symbols into the following token types:

```moonbit
pub enum Token {
  Bool(Bool)       // Boolean values: true, false
  Int(Int)         // Integers: 1, 2, 3, ...
  Double(Double)   // Floating-point numbers: 1.0, 2.5, 3.14, ...
  Keyword(String)  // Reserved words: let, if, while, fn, return
  Upper(String)    // Type identifiers: start with an uppercase letter, e.g., Int, Double, Bool
  Lower(String)    // Variable identifiers: start with a lowercase letter, e.g., x, y, result
  Symbol(String)   // Operators and punctuation: +, -, *, :, ;, ->
  Bracket(Char)    // Brackets: (, ), [, ], {, }
  EOF              // End-of-file marker
} derive(Show, Eq)
```

### Leveraging Pattern Matching

Moonbit's powerful pattern matching capabilities allow us to implement the lexer in an unprecedentedly elegant way. Compared to the traditional finite state machine approach, this pattern-matching-based implementation is more intuitive and easier to understand.

#### Core Analysis Function

```moonbit
pub fn lex(code: String) -> Array[Token] {
  let tokens = Array::new()

  loop code[:] {
    // Skip whitespace characters
    [' ' | '\n' | '\r' | '\t', ..rest] =>
      continue rest

    // Handle single-line comments
    [.."//", ..rest] =>
      continue loop rest {
        ['\n' | '\r', ..rest_str] => break rest_str
        [_, ..rest_str] => continue rest_str
        [] as rest_str => break rest_str
      }

    // Recognize multi-character operators (order is important!)
    [.."->", ..rest] => { tokens.push(Symbol("->")); continue rest }
    [.."==", ..rest] => { tokens.push(Symbol("==")); continue rest }
    [.."!=", ..rest] => { tokens.push(Symbol("!=")); continue rest }
    [.."<=", ..rest] => { tokens.push(Symbol("<=")); continue rest }
    [..">=", ..rest] => { tokens.push(Symbol(">=")); continue rest }

    // Recognize single-character operators and punctuation
    [':' | '.' | ',' | ';' | '+' | '-' | '*' |
     '/' | '%' | '>' | '<' | '=' as c, ..rest] => {
      tokens.push(Symbol("\{c}"))
      continue rest
    }

    // Recognize brackets
    ['(' | ')' | '[' | ']' | '{' | '}' as c, ..rest] => {
      tokens.push(Bracket(c))
      continue rest
    }

    // Recognize identifiers and literals
    ['a'..='z', ..] as code => {
      let (tok, rest) = lex_ident(code);
      tokens.push(tok)
      continue rest
    }

    ['A'..='Z', ..] => { ... }
    ['0'..='9', ..] => { ... }

    // Reached the end of the file
    [] => { tokens.push(EOF); break tokens }
  }
}
```

#### Keyword Recognition Strategy

Identifier parsing requires special handling for keyword recognition:

```moonbit
pub fn let_ident(rest: @string.View) -> (Token, @string.View) {
  // Predefined keyword map
  let keyword_map = Map.from_array([
    ("let", Token::Keyword("let")),
    ("fn", Token::Keyword("fn")),
    ("if", Token::Keyword("if")),
    ("else", Token::Keyword("else")),
    ("while", Token::Keyword("while")),
    ("return", Token::Keyword("return")),
    ("extern", Token::Keyword("extern")),
    ("true", Token::Bool(true)),
    ("false", Token::Bool(false)),
  ])

  let identifier_chars = Array::new()
  let remaining = loop rest {
    ['a'..='z' | 'A'..='Z' | '0'..='9' | '_' as c, ..rest_str] => {
      identifier_chars.push(c)
      continue rest_str
    }
    _ as rest_str => break rest_str
  }

  let ident = String::from_array(identifier_chars)
  let token = keyword_map.get(ident).or_else(() => Token::Lower(ident))

  (token, remaining)
}
```

### 💡 In-depth Analysis of Moonbit Syntax Features

The implementation of the lexer above fully demonstrates several outstanding advantages of Moonbit in compiler development:

1.  **Functional Loop Construct**

    ```moonbit
    loop initial_value {
      pattern1 => continue new_value1
      pattern2 => continue new_value2
      pattern3 => break final_value
    }
    ```

    `loop` is not a traditional loop structure but a **functional loop**:

    - It accepts an initial parameter as the loop state.
    - It handles different cases through pattern matching.
    - `continue` passes the new state to the next iteration.
    - `break` terminates the loop and returns the final value.

2.  **String Views and Pattern Matching**

    Moonbit's string pattern matching feature greatly simplifies text processing:

    ```moonbit
    // Match a single character
    ['a', ..rest] => // Starts with the character 'a'

    // Match a character range
    ['a'..='z' as c, ..rest] => // A lowercase letter, bound to the variable c

    // Match a string literal
    [.."hello", ..rest] => // Equivalent to ['h','e','l','l','o', ..rest]

    // Match multiple possible characters
    [' ' | '\t' | '\n', ..rest] => // Any whitespace character
    ```

3.  **The Importance of Pattern Matching Priority**

    > ⚠️ **Important Reminder: The order of matching is crucial.**
    >
    > When writing pattern matching rules, you must place more specific patterns before more general ones. For example:
    >
    > ```moonbit
    > // ✅ Correct order
    > loop code[:] {
    >   [.."->", ..rest] => { ... }     // Match multi-character operators first
    >   ['-' | '>' as c, ..rest] => { ... }  // Then match single characters
    > }
    >
    > // ❌ Incorrect order - "->" will never be matched
    > loop code[:] {
    >   ['-' | '>' as c, ..rest] => { ... }
    >   [.."->", ..rest] => { ... }     // This will never be executed
    > }
    > ```

By using this pattern-matching-based approach, we not only avoid complex state machine implementations but also achieve a clearer and more maintainable code structure.

---

## Chapter 3: Parsing and Abstract Syntax Tree Construction

**Syntactic Analysis** (or Parsing) is the second core stage of the compiler. Its task is to reorganize the sequence of tokens produced by lexical analysis into a hierarchical **Abstract Syntax Tree (AST)**. This process not only verifies whether the program conforms to the language's grammatical rules but also provides a structured data representation for subsequent semantic analysis and code generation.

### Abstract Syntax Tree Design: A Structured Representation of the Program

Before building the parser, we need to carefully design the structure of the AST. This design determines how the program's syntactic structure is represented and how subsequent compilation stages will process these structures.

#### 1. Core Type System

First, we define the representation of the TinyMoonbit type system in the AST:

```moonbit
pub enum Type {
  Unit    // Unit type, represents no return value
  Bool    // Boolean type: true, false
  Int     // 32-bit signed integer
  Double  // 64-bit double-precision floating-point number
} derive(Show, Eq, ToJson)

pub fn parse_type(type_name: String) -> Type {
  match type_name {
    "Unit" => Type::Unit
    "Bool" => Type::Bool
    "Int" => Type::Int
    "Double" => Type::Double
    _ => abort("Unknown type: \{type_name}")
  }
}
```

#### 2. Layered AST Node Design

We use a layered design to clearly represent the different abstraction levels of the program:

1.  **Atomic Expressions (AtomExpr)**
    Represent the most basic, indivisible expression units:

    ```moonbit
    pub enum AtomExpr {
      Bool(Bool)                                    // Boolean literal
      Int(Int)                                      // Integer literal
      Double(Double)                                // Floating-point literal
      Var(String, mut ty~ : Type?)                  // Variable reference
      Paren(Expr, mut ty~ : Type?)                  // Parenthesized expression
      Call(String, Array[Expr], mut ty~ : Type?)    // Function call
    } derive(Show, Eq, ToJson)
    ```

2.  **Compound Expressions (Expr)**
    More complex structures that can contain operators and multiple sub-expressions:

    ```moonbit
    pub enum Expr {
      AtomExpr(AtomExpr, mut ty~ : Type?)          // Wrapper for atomic expressions
      Unary(String, Expr, mut ty~ : Type?)         // Unary operation: -, !
      Binary(String, Expr, Expr, mut ty~ : Type?)  // Binary operation: +, -, *, /, ==, !=, etc.
    } derive(Show, Eq, ToJson)
    ```

3.  **Statements (Stmt)**
    Represent executable units in the program:

    ```moonbit
    pub enum Stmt {
      Let(String, Type, Expr)                      // Variable declaration: let x : Int = 5;
      Assign(String, Expr)                         // Assignment statement: x = 10;
      If(Expr, Array[Stmt], Array[Stmt])           // Conditional branch: if-else
      While(Expr, Array[Stmt])                     // Loop statement: while
      Return(Expr?)                                // Return statement: return expr;
      Expr(Expr)                                   // Expression statement
    } derive(Show, Eq, ToJson)
    ```

4.  **Top-Level Structures**
    Function definitions and the complete program:

    ```moonbit
    pub struct Function {
      name : String                     // Function name
      params : Array[(String, Type)]    // Parameter list: [(param_name, type)]
      ret_ty : Type                     // Return type
      body : Array[Stmt]                // Sequence of statements in the function body
    } derive(Show, Eq, ToJson)

    // The program is defined as a map from function names to function definitions
    pub type Program Map[String, Function]
    ```

> **Design Highlight: Mutability of Type Annotations**
>
> Notice that each expression node contains a `mut ty~ : Type?` field. This design allows us to fill in type information during the type-checking phase without having to rebuild the entire AST.

### Recursive Descent Parsing: A Top-Down Construction Strategy

**Recursive Descent** is a top-down parsing method where the core idea is to write a corresponding parsing function for each grammar rule. In Moonbit, pattern matching makes the implementation of this method exceptionally elegant.

#### Parsing Atomic Expressions

```moonbit
pub fn parse_atom_expr(
  tokens: ArrayView[Token]
) -> (AtomExpr, ArrayView[Token]) raise {
  match tokens {
    // Parse literals
    [Bool(b), ..rest] => (AtomExpr::Bool(b), rest)
    [Int(i), ..rest] => (AtomExpr::Int(i), rest)
    [Double(d), ..rest] => (AtomExpr::Double(d), rest)

    // Parse function calls: func_name(arg1, arg2, ...)
    [Lower(func_name), Bracket('('), ..rest] => {
      let (args, rest) = parse_argument_list(rest)
      match rest {
        [Bracket(')'), ..remaining] =>
          (AtomExpr::Call(func_name, args, ty=None), remaining)
        _ => raise SyntaxError("Expected ')' after function arguments")
      }
    }

    // Parse variable references
    [Lower(var_name), ..rest] =>
      (AtomExpr::Var(var_name, ty=None), rest)

    // Parse parenthesized expressions: (expression)
    [Bracket('('), ..rest] => {
      let (expr, rest) = parse_expression(rest)
      match rest {
        [Bracket(')'), ..remaining] =>
          (AtomExpr::Paren(expr, ty=None), remaining)
        _ => raise SyntaxError("Expected ')' after expression")
      }
    }

    _ => raise SyntaxError("Expected atomic expression")
  }
}
```

#### Parsing Statements

Statement parsing needs to dispatch to different handler functions based on the starting keyword:

```moonbit
pub fn parse_stmt(tokens : ArrayView[Token]) -> (Stmt, ArrayView[Token]) {
  match tokens {
    // Parse let statements
    [Keyword("let"), Lower(var_name), Symbol(":"), ..] => { /* ... */ }

    // Parse if/while/return statements
    [Keyword("if"), .. rest] => parse_if_stmt(rest)
    [Keyword("while"), .. rest] => parse_while_stmt(rest)
    [Keyword("return"), .. rest] => { /* ... */ }

    // Parse assignment statements
    [Lower(_), Symbol("="), .. rest] => parse_assign_stmt(tokens)

    // Parse single expression statements
    [Lower(_), Symbol("="), .. rest] => parse_single_expr_stmt(tokens)

    _ => { /* Error handling */ }
  }
}
```

> **Challenge**: Handling Operator Precedence:
>
> The most complex part of expression parsing is handling operator precedence. We need to ensure that `1 + 2 * 3` is correctly parsed as `1 + (2 * 3)` and not `(1 + 2) * 3`.

### 💡 Application of Advanced Moonbit Features

#### Automatic Derivation Feature

```moonbit
pub enum Expr {
  // ...
} derive(Show, Eq, ToJson)
```

Moonbit's `derive` feature automatically generates common implementations for types. Here we use three:

- **`Show`**: Provides debugging output functionality.
- **`Eq`**: Supports equality comparison.
- **`ToJson`**: Serializes to JSON format, which is convenient for debugging and persistence.

These automatically generated features are extremely useful in compiler development, especially during the debugging and testing phases.

#### Error Handling Mechanism

```moonbit
pub fn parse_expression(tokens: ArrayView[Token]) -> (Expr, ArrayView[Token]) raise {
  // The 'raise' keyword indicates that this function may throw an exception
}
```

Moonbit's `raise` mechanism provides structured error handling, allowing syntax errors to be accurately located and reported.

Through this layered design and recursive descent parsing strategy, we have built a parser that is both flexible and efficient, laying a solid foundation for the subsequent type-checking phase.

---

## Chapter 4: Type Checking and Semantic Analysis

**Semantic Analysis** is a crucial intermediate stage in compiler design. While parsing ensures the program's structure is correct, it doesn't mean the program is semantically valid. **Type Checking**, as the core component of semantic analysis, is responsible for verifying the type consistency of all operations in the program, ensuring type safety and runtime correctness.

### Scope Management: Building the Environment Chain

The primary challenge in type checking is correctly handling variable **scopes**. At different levels of the program (global, function, block), the same variable name may refer to different entities. We adopt the classic design of an **Environment Chain** to solve this problem:

```moonbit
pub struct TypeEnv[K, V] {
  parent : TypeEnv[K, V]?     // Reference to the parent environment
  data : Map[K, V]            // Variable bindings in the current environment
}
```

The core of the environment chain is the variable lookup algorithm, which follows the rules of **lexical scoping**:

```moonbit
pub fn TypeEnv::get[K : Eq + Hash, V](self : Self[K, V], key : K) -> V? {
  match self.data.get(key) {
    Some(value) => Some(value)    // Found in the current environment
    None =>
      match self.parent {
        Some(parent_env) => parent_env.get(key)  // Recursively search the parent environment
        None => None              // Reached the top-level environment, variable not defined
      }
  }
}
```

> **Design Principle: Lexical Scoping**
>
> This design ensures that variable lookup follows lexical scoping rules:
>
> 1.  First, search in the current scope.
> 2.  If not found, recursively search in the parent scope.
> 3.  Continue until the variable is found or the global scope is reached.

### Type Checker Architecture

Environment management alone is not sufficient to complete the type-checking task. Some operations (like function calls) need to access global program information. Therefore, we design a comprehensive type checker:

```moonbit
pub struct TypeChecker {
  local_env : TypeEnv[String, Type]    // Local variable environment
  current_func : Function              // The function currently being checked
  program : Program                    // Complete program information
}
```

### Implementation of Partial Node Type Checking

The core of the type checker is to apply the corresponding type rules to different AST nodes. The following is the implementation of expression type checking:

```moonbit
pub fn Expr::check_type(
  self : Self,
  env : TypeEnv[String, Type]
) -> Type raise {
  match self {
    // Type checking for atomic expressions
    AtomExpr(atom_expr, ..) as node => {
      let ty = atom_expr.check_type(env)
      node.ty = Some(ty)  // Fill in the type information
      ty
    }

    // Type checking for unary operations
    Unary("-", expr, ..) as node => {
      let ty = expr.check_type(env)
      node.ty = Some(ty)
      ty
    }

    // Type checking for binary operations
    Binary("+", lhs, rhs, ..) as node => {
      let lhs_type = lhs.check_type(env)
      let rhs_type = rhs.check_type(env)

      // Ensure operand types are consistent
      guard lhs_type == rhs_type else {
        raise TypeCheckError(
          "Binary operation requires matching types, got \{lhs_type} and \{rhs_type}"
        )
      }

      let result_type = match op {
        // Comparison operators always return a boolean value
        "==" | "!=" | "<" | "<=" | ">" | ">=" => Type::Bool

        // Arithmetic operators, etc., maintain the operand type
        _ => lhs_type
      }

      node.ty = Some(result_type)
      result_type
    }
  }
}
```

**💡 Moonbit Enum Modification Trick**

During the type-checking process, we need to fill in type information for the AST nodes. Moonbit provides an elegant way to modify the mutable fields of enum variants:

```moonbit
pub enum Expr {
  AtomExpr(AtomExpr, mut ty~ : Type?)
  Unary(String, Expr, mut ty~ : Type?)
  Binary(String, Expr, Expr, mut ty~ : Type?)
} derive(Show, Eq, ToJson)
```

By using the `as` binding in pattern matching, we can get a reference to the enum variant and modify its mutable fields:

```moonbit
match expr {
  AtomExpr(atom_expr, ..) as node => {
    let ty = atom_expr.check_type(env)
    node.ty = Some(ty)  // Modify the mutable field
    ty
  }
  // ...
}
```

This design avoids the overhead of rebuilding the entire AST while maintaining a functional programming style.

---

## Complete Compilation Flow Demonstration

After the three stages of lexical analysis, parsing, and type checking, our compiler frontend is now able to convert source code into a fully typed abstract syntax tree. Let's demonstrate the complete process with a simple example:

### Source Code Example

```moonbit
fn add(x: Int, y: Int) -> Int {
  return x + y;
}
```

### Compilation Output: Typed AST

Using the `derive(ToJson)` feature, we can output the final AST in JSON format for inspection:

```json
{
  "functions": {
    "add": {
      "name": "add",
      "params": [
        ["x", { "$tag": "Int" }],
        ["y", { "$tag": "Int" }]
      ],
      "ret_ty": { "$tag": "Int" },
      "body": [
        {
          "$tag": "Return",
          "0": {
            "$tag": "Binary",
            "0": "+",
            "1": {
              "$tag": "AtomExpr",
              "0": {
                "$tag": "Var",
                "0": "x",
                "ty": { "$tag": "Int" }
              },
              "ty": { "$tag": "Int" }
            },
            "2": {
              "$tag": "AtomExpr",
              "0": {
                "$tag": "Var",
                "0": "y",
                "ty": { "$tag": "Int" }
              },
              "ty": { "$tag": "Int" }
            },
            "ty": { "$tag": "Int" }
          }
        }
      ]
    }
  }
}
```

From this JSON output, we can clearly see:

1.  **Complete Function Signature**: Including the parameter list and return type.
2.  **Type-Annotated AST Nodes**: Each expression carries type information.
3.  **Structured Program Representation**: Provides a clear data structure for the subsequent code generation phase.

---

## Conclusion

In this article, we have delved into the complete implementation process of a compiler frontend. From a stream of characters to a typed abstract syntax tree, we have witnessed the unique advantages of the Moonbit language in compiler construction:

### Core Takeaways

1.  **The Power of Pattern Matching**: Moonbit's string pattern matching and structural pattern matching greatly simplify the implementation of lexical analysis and parsing.
2.  **Functional Programming Paradigm**: The combination of the `loop` construct, environment chains, and immutable data structures provides a solution that is both elegant and efficient.
3.  **Expressive Type System**: Through mutable fields in enums and trait objects, we can build data structures that are both type-safe and flexible.
4.  **Engineering Features**: Features like `derive`, structured error handling, and JSON serialization significantly improve development efficiency.

### Looking Ahead to Part 2

Having mastered the implementation of the frontend, the next article will guide us into the more exciting code generation phase. We will:

- Delve into the design philosophy of LLVM Intermediate Representation.
- Explore how to use Moonbit's official `llvm.mbt` binding library.
- Implement the complete conversion from AST to LLVM IR.
- Generate executable RISC-V assembly code.

Building a compiler is a complex and challenging process, but as we have shown in this article, Moonbit provides powerful and elegant tools for this task. Let's continue this exciting compiler construction journey in the next part.

> **Recommended Resources**
>
> - [Moonbit Official Documentation](https://www.moonbitlang.com/docs/)
> - [llvm.mbt Documentation](https://mooncakes.io/docs/Kaida-Amethyst/llvm)
> - [llvm.mbt Project](https://github.com/moonbitlang/llvm.mbt)
> - [LLVM Official Tutorial](https://llvm.org/docs/tutorial/)

---

```

```
