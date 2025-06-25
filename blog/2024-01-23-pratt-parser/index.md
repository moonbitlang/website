---
description: How to implement a Pratt Parser in MoonBit?
slug: pratt-parser
image: ./cover.png
tags: [MoonBit, Coding Practice]
draft: true
---

import Cover from './cover.png'

# Programming Practice | How to implement a Pratt Parser in MoonBit?

<img src={Cover} />

In the realm of programming, syntax analysis, commonly referred to as parsing, plays a pivotal role during the compilation process. The parser's primary responsibility is to transform a stream of tokens into an abstract syntax tree (AST).

In this article, we will introduce Pratt parsing, a renowned algorithm for parsing, often recognized as top-down operator precedence parsing, and we will demonstrate how to implement it using MoonBit.

You can experience the Pratt parsing code in this blog at https://try.moonbitlang.cn/#99b19baf.

<!--truncate-->

## Why Using Pratt Parser

Almost all programmers are familiar with infix expressions, including staunch Lisp/Forth programmers. At least, they are aware that the majority of the world writes arithmetic expressions in this way:

```
24 * (x + 4)

```

For compiler (or interpreter) writers, parsing such infix expressions is slightly more challenging than parsing the prefix expressions used in Lisp and the postfix expressions used in Forth. For instance, using a basic handwritten recursive descent parser requires multiple mutually recursive functions, and handling left recursion in the grammar for expression syntax can make the code less user-friendly, especially as the number of operators increases. Parser generator tools also do not offer a very satisfactory solution in this regard. Take a BNF example of a simple addition and multiplication expression:

```
Expr ::=
    Factor
    | Expr '+' Factor
Factor ::=
    Atom
    | Factor '*' Atom
Atom ::=
    'number'
    | '(' Expr ')'

```

This is definitely not very intuitive, and one might even need to spend time revisiting formal language courses taken in university. In some languages like Haskell, which supports custom infix operators, solving this with a parser generator tool is almost impractical.

In such situations, the Pratt parser emerges as an effective solution for the complexities associated with parsing infix expressions. Its design is not only adept at handling these challenges but also offers remarkable versatility. It also allows for the straightforward integration of new operators, all without the need to modify existing source code. Esteemed in the field of compiler construction, the Pratt parser is recommended for use in conjunction with recursive descent parsers in the renowned book "_Crafting Interpreters_". Additionally, it is used in the Rust-analyzer project.

## Binding Power in Pratt Parser

In the Pratt parser, the concept used to describe associativity and precedence is called "binding power." For each infix operator, its binding power consists of a pair of integers - one for the left and one for the right. This is illustrated below:

```
expr:   A     +     B     *     C
power:     3     3     5     5

```

And its function aligns perfectly with its name – the larger the number, the higher the precedence it has in grabbing a particular operand (in this example, A, B, C are operands).

The above example illustrates operators with different precedence levels, and the associativity of the same operator is represented by a pair of binding powers, one larger and one smaller.

```
expr:   A     +     B     +     C
power:     1     2     1     2

```

In this particular instance, as the parser encounters B, the expression undergoes a transformation due to its stronger left binding power, resulting in the following configuration:

```
expr:   (A + B)     +     C
power:           1     2

```

Next, let's delve into the practical application of Pratt parser and examine how it effectively employs this concept during execution.

## Overview and Preliminary Preparation

The general framework of the Pratt parser is roughly as follows:

```moonbit
fn parseExpr(self : Tokens, min_bp : Int) -> Result[SExpr, String] {
    ......

    while true {
        .....
        parseExpr()
    }
}

```

From the above text, it can be seen that it is implemented using a combination of recursions and loops. This actually corresponds to two modes:

- Always have the leftmost expression at the innermost level, i.e., `"1 + 2 + 3" = "(1 + 2) + 3"`, and this can be parsed using loops.
- Always have the rightmost expression at the innermost level, i.e., `"1 + 2 + 3" = "1 + (2 + 3)"`, and this can be parsed using recursion.

`min_bp` is a parameter representing the binding power of an operator on the left that has not been parsed yet.

Since various errors may occur during this process, the return type of `parseExpr` is `Result[SExpr, String]`.

However, before starting to write the parser, we also need to tokenize the string to obtain a simple token stream.

```moonbit
enum Token {
  Operand(String)
  Operator(String)
  Eof
} derive(Debug, Show, Eq)

struct Tokens {
  mut tokens : List[Token]
}

```

This token stream requires three methods: `peek()`, `next()`, and `eat()`.

The `peek()` method retrieves the first token in the token stream without altering the state. In other words, it is side-effect-free; it merely takes a peek at the content to be processed. For an empty token stream, it returns `Eof`.

```moonbit
fn peek(self : Tokens) -> Token {
  match self.tokens {
    Cons(t, _) => t
    Nil => Eof
  }
}

```

`next()` consumes a token based on `peek()`.

```moonbit
fn next(self : Tokens) -> Token {
  match self.tokens {
    Cons(t, ts) => {
      self.tokens = ts
      return t
    }
    Nil => Eof
  }
}

```

Our goal is to take in a token stream and output a prefix expression without considering precedence.

```moonbit
enum SExpr {
  Atom(String)
  Cons(String, Array[SExpr])
}

```

Finally, we need a function to calculate the binding power of operators, which can be implemented using a simple `match`statement. In practical implementation, to facilitate the addition of new operators, some key-value pair container should be used.

```moonbit
fn infix_binding_power(op : String) -> Result[(Int, Int), String] {
  match op {
    "+" => Ok((1, 2))
    "-" => Ok((1, 2))
    "/" => Ok((3, 4))
    "*" => Ok((3, 4))
    _ => Err("infix_binding_power(): bad op \(op)")
  }
}

```

## Parser Implementation

The initial steps are straightforward. First, take out the first token and assign it to the variable `lhs` (short for left hand side, representing the left-hand side parameter).

- If it is an operand, store it.
- If it is a parenthesis (parentheses are also treated as an operator, but they are handled specially), recursively parse the first expression, then consume a pair of parentheses. The `?` here is a new error-handling syntax introduced by MoonBit. If the preceding expression is `Err()`, the current function will terminate immediately, considering this `Err()` as the return value.
- Any other results indicate a parsing issue, throw an error. Here, wrap an error string using `Err()`.

```moonbit
let mut lhs : Result[SExpr, String] = match self.next() {
  Operand(s) => Ok(Atom(s))
  Operator("(") => {
    let expr = parseExpr(self, 0)?
    self.eat(Operator(")"))
    Ok(expr)
  }
  t => Err("bad token \(t)")
}

```

Next, let's take a look at the first operator:

- If the result is Eof at this point, it doesn't necessarily mean failure. An operand can also be considered a complete expression, so we can exit the loop.
- If the result is an operator, return it normally.
- Any other result indicates an error.

```moonbit
  while true {
    let op : Result[String, String] = match self.peek() {
      Eof => { break }
      Operator(op) => Ok(op)
      t => Err("bad token \(t)")
    }
    let op = op?
    ......

```

Next, we need to determine which operator `lhs` belongs to. Here, we use the `min_bp` parameter, which represents the binding power of the nearest unfinished operator on the left. Its initial value is 0 (indicating no operator is competing for the first operand on the left). However, before that, we need to make a decision: is the operator a parenthesis? If it is, it means we are parsing an expression inside parentheses, and we should exit the loop directly. This is one of the reasons for using the `peek` method because we cannot determine whether to consume the operator here.

After calculating the binding power `l_bp` of the current operator `op`, we first compare it with `min_bp`:

- If `l_bp` is less than `min_bp`, immediately break. This will return `lhs` to the upper level, where an operator is still waiting for the right-hand parameter.
- Otherwise, use the `next` method to consume the current operator, and recursively call `parseExpr` to obtain the right-hand parameter. The second parameter is the right binding power of the current operator. After a successful parsing, assign the result to `lhs` and continue the loop.

```moonbit
    if op != ")" {
      let (l_bp, r_bp) = infix_binding_power(op)?
      if l_bp < min_bp {
        break
      }
      self.next()
      let l = lhs?
      let r = parseExpr(self, r_bp)?
      lhs = Ok(Cons(op, [l, r]))
      continue
    }
    break

```

At the end of the entire function, simply return `lhs`.

## Usage Example: Stack-based Calculator

Reverse Polish Notation (RPN) is a mathematical notation introduced by Polish mathematician Jan Łukasiewicz in 1920. The distinctive feature of this notation is that operators are written after operands. Behind this somewhat peculiar appearance lies a close connection to the stack data structure. For example, the infix expression

`17 + 13 * 3` corresponds to the RPN expression `17 13 3 * +`. This can be implemented with a series of instructions.

```moonbit
Push(17)
Push(13)
Push(3)
Mul() // Take the top two elements from the stack, multiply them, and then put the result back on top of the stack.
Add() // As above, but replace multiplication with addition.

```

The conversion process from an arithmetic expression to a sequence of instructions is simple and direct.

```moonbit
fn compile(this : SExpr) -> List[Instruction] {
  // Can only handle arithmetic expressions.
  match this {
    Atom(s) => Cons(Push(string_to_int(s)), Nil)
    Cons("*", arr) => {
      append(append(compile(arr[0]), compile(arr[1])), Cons(Mul, Nil))
    }
    Cons("+", arr) => {
      append(append(compile(arr[0]), compile(arr[1])), Cons(Add, Nil))
    }
  }
}

```

## Conclusion

The Pratt parser is not only capable of handling infix operators but also versatile enough to cover postfix and prefix operators, as well as access operators like `arr[i]`.

## Reference

Matklad. (Apr 13, 2020) Simple but Powerful Pratt Parsing. [https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html](https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html)
