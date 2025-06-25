---
description: 'MoonBit Pearls Vol.01：Implementing a Pratt Parser in MoonBit'
slug: pratt-parse
image: cover.png
tags: [MoonBit, Pearls]
authors: myfreess
---

# MoonBit Pearls Vol.01：Implementing a Pratt Parser in MoonBit

![](./cover.png)

Last week, the MoonBit community launched the "MoonBit Pearls" campaign, calling for high-quality documentation and code examples. After meticulous selection, we are proud to officially release the first featured article in the "MoonBit Pearls" column this week.

As a long-term knowledge repository, this column will continuously curate and showcase outstanding documentation. We encourage more developers to contribute in the future, collectively enriching the MoonBit community ecosystem.

Below is the content of the first submission. The author provides a comprehensive case study demonstrating how to implement a Pratt parser in MoonBit:

## **Implementing a Pratt Parser in MoonBit**

During the compilation process, syntax analysis (also known as parsing) is a critical step. The primary responsibility of a parser is to convert a stream of tokens into an Abstract Syntax Tree (AST).

This article introduces an implementation algorithm for parsers: Pratt Parsing, a top-down operator precedence parsing method, and demonstrates how to implement it using MoonBit.

## **Why Use a Pratt Parser?**

Infix expressions are familiar to almost every programmer. Even staunch Lisp/Forth programmers are aware that a majority of the world writes arithmetic expressions like this:

```
24 * (x + 4)
```

For compiler (or interpreter) writers, such infix expressions are slightly more challenging to parse compared to the prefix expressions used in Lisp or the postfix expressions used in Forth.

For example, a naive handwritten recursive descent parser would require multiple mutually recursive functions and the elimination of left recursion during syntax analysis, making the code less maintainable as the number of operators grows. Parser generator tools are also not entirely satisfactory for this problem. Consider the BNF for a simple arithmetic expression with addition and multiplication:

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

This does not look very intuitive and might require revisiting formal language theory from university courses.

Some languages, like Haskell, support custom infix operators, which are almost impossible to handle simply with parser generator tools.

The Pratt parser elegantly solves the problem of parsing infix expressions while also being easily extensible to support new operators (without modifying the source code!). It is recommended alongside recursive descent parsers in the renowned compilation textbook *Crafting Interpreters* and is used in projects like rust-analyzer.

## **Binding Power**

In Pratt parsers, the concept used to describe associativity and precedence is called *binding power*. For each infix operator, the binding power is represented as a pair of integers—one for the left and one for the right. For example:

```
expr:   A     +     B     *     C
power:     3     3     5     5
```

As the name suggests, a higher number means higher priority in capturing an operand (in this example, A, B, and C are operands).

The above example demonstrates operators with different precedence levels, while the associativity of the same operator is represented by asymmetric binding powers.

```
expr:   A     +     B     +     C
power:     1     2     1     2
```

In this case, when parsing reaches B, the expression is grouped as follows due to the higher binding power on the left:

```
expr:   (A + B)     +     C
power:           1     2
```

Next, let’s see how the Pratt parser uses this concept during execution.

## **Overview and Preparation**

The main framework of a Pratt parser looks like this:

```moonbit skip
fn parse(self : Tokens, min_bp : Int) -> SExpr ! ParseError {
    ...
    while true {
       parse(...)
    }
    ...
}
```

As shown above, it is implemented using a combination of recursion and loops. This corresponds to two modes:

- The leftmost expression is always the innermost, e.g., **`"1 + 2 + 3" = "(1 + 2) + 3"`**, which can be parsed using just a loop.
- The rightmost expression is always the innermost, e.g., **`"1 + 2 + 3" = "1 + (2 + 3)"`**, which can be parsed using recursion alone.

The **`min_bp`** parameter represents the binding power of the nearest unfinished operator on the left.

Our goal is to read a token stream and output a prefix expression without worrying about precedence:

```moonbit
enum SExpr {
  Atom(String)
  Cons(Char, Array[SExpr])
}

impl Show for SExpr with output(self, logger) {
    match self {
        Atom(s) => logger.write_string(s)
        Cons(op, args) => {
            logger.write_char('(')
            logger.write_char(op)
            for i = 0; i < args.length(); i = i + 1 {
                logger.write_char(' ')
                logger.write_string(args[i].to_string())
            }
            logger.write_char(')')
        }
    }
}

test {
    inspect(Cons('+', [Atom("3"), Atom("4")]), content="(+ 3 4)")
}
```

Since errors may occur during this process, the return type of **`parseExpr`** is **`SExpr ! ParseError`**.

Before writing the parser, however, we need to split the input string into a simple token stream.

```moonbit
enum Token {
  LParen
  RParen
  Operand(String)
  Operator(Char)
  Eof
} derive(Show, Eq)

struct Tokens {
  mut position : Int
  tokens : Array[Token]
}
```

This token stream requires two methods: **`peek()`** and **`pop()`**.

The **`peek()`** method retrieves the first token in the stream without modifying the state—in other words, it is side-effect-free and merely "peeks" at the upcoming content. For an empty token stream, it returns Eof.

```moonbit
fn peek(self : Tokens) -> Token {
  if self.position < self.tokens.length() {
    self.tokens.unsafe_get(self.position)
  } else {
    Eof
  }
}
```

The **`pop()`** method consumes a token after peeking.

```moonbit
fn pop(self : Tokens) -> Token {
  if self.position < self.tokens.length() {
    let pos = self.position
    self.position += 1
    self.tokens.unsafe_get(pos)
  } else {
    Eof
  }
}
```

The **`tokenize`** function is responsible for converting a string into a token stream.

```moonbit
fn isDigit(this : Char) -> Bool {
    this is '0'..='9'
}

fn isAlpha(this : Char) -> Bool {
    this is 'A'..='Z' || this is 'a'..='z'
}

fn isWhiteSpace(this : Char) -> Bool {
    this == ' ' || this == '\t' || this == '\n'
}

fn isOperator(this : Char) -> Bool {
    let operators = "+-*/"
    operators.contains_char(this)
}

type! LexError Int

fn tokenize(source : String) -> Tokens!LexError {
    let tokens = []
    let source = source.to_array()
    let buf = StringBuilder::new(size_hint = 100)
    let mut i = 0
    while i < source.length() {
        let ch = source.unsafe_get(i)
        i += 1
        if ch == '('{
            tokens.push(LParen)
        } else if ch == ')' {
            tokens.push(RParen)
        } else if isOperator(ch) {
            tokens.push(Operator(ch))
        } else if isAlpha(ch) {
            buf.write_char(ch)
            while i < source.length() && (isAlpha(source[i]) || isDigit(source[i]) || source[i] == '_') {
                buf.write_char(source[i])
                i += 1
            }
            tokens.push(Operand(buf.to_string()))
            buf.reset()
        } else if isDigit(ch) {
            buf.write_char(ch)
            while i < source.length() && isDigit(source[i]) {
                buf.write_char(source[i])
                i += 1
            }
            tokens.push(Operand(buf.to_string()))
            buf.reset()
        } else if isWhiteSpace(ch) {
            continue
        } else {
            raise LexError(i)
        }
    } else {
        return Tokens::{ position : 0, tokens }
    }
}

test {
    inspect(tokenize("(((((47)))))").tokens, content=
      #|[LParen, LParen, LParen, LParen, LParen, Operand("47"), RParen, RParen, RParen, RParen, RParen]
    )
    inspect(tokenize("13 + 6 + 5 * 3").tokens, content=
      #|[Operand("13"), Operator('+'), Operand("6"), Operator('+'), Operand("5"), Operator('*'), Operand("3")]
    )
}
```

Finally, we need a function to compute the binding power of operators, which can be implemented simply using **`match`**. In practice, a key-value container should be used for easy addition of new operators.

```moonbit
fn infix_binding_power(op : Char) -> (Int, Int)? {
  match op {
    '+' => Some((1, 2))
    '-' => Some((1, 2))
    '/' => Some((3, 4))
    '*' => Some((3, 4))
    _ => None
  }
}
```

## **Parser Implementation**

First, retrieve the first token and assign it to the variable **`lhs`** (short for left-hand side, representing the left operand).

- If it is an operand, store it.
- If it is a left parenthesis, recursively parse the first expression and then consume a matching right parenthesis.
- Any other result indicates an error, which should be raised.

Next, we peek at the first operator:

- If the result is **`Eof`**, this is not a failure—a single operand can be a complete expression, so we break the loop.
- If the result is an operator, proceed normally.
- If the result is a right parenthesis, break the loop.
- Any other result raises a **`ParseError`**.

We then need to determine which operator the **`lhs`** belongs to. This is where the **`min_bp`** parameter comes into play, representing the binding power of the nearest unfinished operator on the left. Its initial value is 0 (no operator is competing for the first operand). However, we first check if the operator is a parenthesis—if so, it means we are parsing an expression inside parentheses and should break the loop to end. This is one of the reasons for using the **`peek`** method, as we cannot determine whether to consume the operator here.

After calculating the binding power **`(l_bp, r_bp)`** of the current operator, we compare **`l_bp`** with **`min_bp`**:

- If **`l_bp`** is less than **`min_bp`**, immediately break, returning **`lhs`** to the higher-level operator waiting for the right operand.
- Otherwise, consume the current operator using **`pop`**, recursively call **`parseExpr`** to obtain the right operand with **`r_bp`** as the new **`min_bp`**, and assign the result to **`lhs`** before continuing the loop.

```moonbit
type! ParseError (Int, Token) derive (Show)

fn parseExpr(self : Tokens, min_bp~ : Int = 0) -> SExpr ! ParseError {
    let mut lhs = match self.pop() {
        LParen => {
            let expr = self.parseExpr()
            if self.peek() is RParen {
                ignore(self.pop())
                expr
            } else {
                raise ParseError((self.position, self.peek()))
            }
        }
        Operand(s) => Atom(s)
        t => raise ParseError((self.position - 1, t))
    }
    while true {
        let op = match self.peek() {
            Eof | RParen => break
            Operator(op) => op
            t => raise ParseError((self.position, t))
        }
        guard infix_binding_power(op) is Some((l_bp, r_bp)) else {
            raise ParseError((self.position, Operator(op)))
        }
        if l_bp < min_bp {
            break
        }
        ignore(self.pop())
        let rhs = self.parseExpr(min_bp = r_bp)
        lhs = Cons(op, [lhs, rhs])
        continue
    }
    return lhs
}

fn parse(s : String) -> SExpr ! Error {
    tokenize(s).parseExpr()
}
```

Now we have an extensible parser for arithmetic expressions. Additional test cases can be added to verify its correctness:

```moonbit
test {
  inspect(parse("13 + 6 + 5 * 3"), content="(+ (+ 13 6) (* 5 3))")
  inspect(parse("3 * 3 + 5 * 5"), content="(+ (* 3 3) (* 5 5))")
  inspect(parse("(3 + 4) * 3 * (17 * 5)"), content="(* (* (+ 3 4) 3) (* 17 5))")
  inspect(parse("(((47)))"), content="47")
}
```

However, the capabilities of Pratt parsers extend beyond this. They can also parse prefix operators (e.g., bitwise NOT **`!n`**), array indexing operators **`arr[i]`**, and even ternary operators **`c ? e1 : e2`**. For more detailed parsing techniques, refer to [Simple but Powerful Pratt Parsing](https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html). The author of this blog implemented an industrial-grade Pratt parser in the renowned program analysis tool rust-analyzer.
