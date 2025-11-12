---
slug: shunting-yard
description: 'Implementing the Shunting Yard Algorithm in MoonBit'
image: cover.png
---

# Implementing the Shunting Yard Algorithm in MoonBit

![](./cover.png)

## What is the Shunting Yard Algorithm?

In the implementation of programming languages or interpreters, how to handle mathematical expressions has always been a classic problem. We want to be able to understand "infix expressions" (like 3 + 4 * 2) just like humans do, and correctly consider operator precedence and parentheses.

In 1961, Edsger Dijkstra proposed the famous Shunting Yard algorithm, which provides a mechanical way to convert infix expressions to postfix expressions (RPN) or abstract syntax trees (AST). The algorithm's name comes from railway marshalling yards: train cars are sorted by shunting between tracks, and in expression processing, we use two stacks to store and manage operands and operators. Imagine the process of calculating 3 + 4 * 2 in your head:

1. You know that multiplication has higher precedence, so you need to calculate 4 * 2 first.
2. During this process, you temporarily "remember" the preceding 3 and +.
3. Once the multiplication result is available, you add it to 3.

Dijkstra's insight is that this human thought process of "temporarily remembering something and coming back to process it" can actually be simulated using stacks. Just like railway marshalling yards temporarily park train cars on sidings and then shunt them as needed, the algorithm controls the order of operations by moving numbers and operators between different stacks. The name "Shunting Yard" comes from this railway analogy:

* Train cars are sorted by moving between tracks;
* Operators and numbers in mathematical expressions can also be correctly sorted and calculated by moving between stacks.

Dijkstra abstracted our scattered, chaotic human calculation process into a clear, mechanical workflow, allowing computers to process expressions using the same logic.

## Basic Flow of the Shunting Yard Algorithm

The Shunting Yard algorithm ensures that expressions are parsed with correct precedence and associativity by maintaining two stacks:

1. **Initialization**

    Create two empty stacks:
    * Operator stack (op_stack), used to temporarily store unprocessed operators and parentheses;
    * Value stack (val_stack), used to store operands and partially constructed sub-expressions.

2. **Scan input tokens one by one**

    * **If token is a number or variable**: Push directly into val_stack.
    * **If token is an operator**:
    
        1. Check the top element of op_stack.
        2. If and only if the precedence of the top operator is higher than the current operator, or they have equal precedence and the top operator is left-associative, pop the top operator, combine it with two operands from val_stack to **form a new sub-expression**, and push it back into val_stack.
        3. Repeat this process until the condition is no longer met, then push the current operator into op_stack.

    * **If token is a left parenthesis**: Push into op_stack as a delimiter marker.
    * **If token is a right parenthesis**: Continuously pop operators from op_stack and combine them with operands from the top of val_stack to form sub-expressions, until a left parenthesis is encountered; the left parenthesis itself is discarded and does not enter val_stack.

3. **Clear the operator stack**

    After all tokens have been scanned, if there are still operators in op_stack, pop them one by one and combine them with operands from val_stack to form larger expressions, until the operator stack is empty.

4. **End condition**

    Finally, val_stack should contain only one element, which is the complete abstract syntax tree or postfix expression. If the number of elements in the stack is not one, or there are unmatched parentheses, it indicates that the input expression contains errors.

### Example Walkthrough

Let's use the parsing of `(1 + 2) * (3 - 4) ^ 2` as an example to demonstrate how the two stacks change during the token reading process, helping us better understand the Shunting Yard algorithm:

| Step | Token Read | Operator Stack (op\_stack) | Value Stack (val\_stack)                                        | Description                                                     |
| -- | -------- | --------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| 1  | `(`      | [`(`]           | []                                                     | Left parenthesis pushed into operator stack                                              |
| 2  | `1`      | [`(`]           | [`1`]                                                   | Number pushed into value stack                                                 |
| 3  | `+`      | [`(`, `+`]        | [`1`]                                                   | Operator pushed into operator stack                                              |
| 4  | `2`      | [`(`, `+`]        | [`1`, `2`]                                                | Number pushed into value stack                                                 |
| 5  | `)`      | []               | [`1 + 2`]                                           | Pop until left parenthesis: `1` and `2` combined into `1+2`                          |
| 6  | `*`      | [`*`]            | [`1 + 2`]                                             | Operator pushed into operator stack                                              |
| 7  | `(`      | [`*`, `(`]       | [`1 + 2`]                                             | Left parenthesis pushed into operator stack                                              |
| 8  | `3`      | [`*`, `(`]       | [`1 + 2`, `3`]                                          | Number pushed into value stack                                                 |
| 9  | `-`      | [`*`, `(`, `-`]    | [`1 + 2`, `3`]                                          | Operator pushed into operator stack                                              |
| 10 | `4`      | [`*`, `(`, `-`]    | [`1 + 2`, `3`, `4`]                                       | Number pushed into value stack                                                 |
| 11 | `)`      | [`*`]            |  [`1 + 2`, `3 - 4`]                                    | Pop until left parenthesis: `3` and `4` combined into `3-4`                          |
| 12 | `^`      | [`*`, `^`]         | [`1 + 2`, `3 - 4`]                                      | Power operator pushed into stack (right-associative, won't trigger pop)                                    |
| 13 | `2`      | [`*`, `^`]         | [`1 + 2`, `3 - 4`, `2`]                                   | Number pushed into value stack                                                 |
| 14 | End of input     | []               | [`(1 + 2) * (3 - 4) ^ 2`] | Clear operator stack: first pop `^`, combine `3-4` with `2`; then pop `*`, combine `1+2` with result |

In this example, there are several noteworthy points:

* **Parentheses processed first**
In the first group of parentheses `(1 + 2)`, the operator `+` is delayed in the operator stack until a right parenthesis is encountered, then combined with 1 and 2. The second group of parentheses `(3 - 4)` is processed in exactly the same way.

* **Precedence manifestation**
When `*` is encountered, it's pushed into the operator stack. But when the power operator `^` is encountered later, since `^` has higher precedence than `*` and is right-associative, it's pushed directly without triggering the pop of `*`.

* **Role of associativity**
The power operator `^` is typically defined as right-associative, meaning the expression `a ^ b ^ c` will be parsed as `a ^ (b ^ c)`. In this example, `(3-4) ^ 2` maintains this associativity, correctly constructing the sub-expression.

* **Final result**
After input ends, the operator stack is cleared sequentially, ultimately forming the complete expression:
```
(1 + 2) * ((3 - 4) ^ 2)
```

## Implementing the Shunting Yard Algorithm in MoonBit

First, we need to define the types for expressions and tokens:
```moonbit
enum Expr {
  Literal(Int)
  BinExpr(String, Expr, Expr)
} derive(Show)

enum Token {
  Literal(Int)
  Op(String)
  LeftParen
  RightParen
} derive(Show)
```

We can leverage MoonBit's regular expression matching syntax to quickly implement a simple tokenizer:

```moonbit
pub fn tokenize(input : StringView) -> Array[Token] raise {
  let tokens = []
  for str = input {
    lexmatch str {
      "[0-9]+" as n, rest => {
        tokens.push(Token::Literal(@strconv.parse_int(n)))
        continue rest
      }
      "[\-+*/^]" as o, rest => {
        tokens.push(Token::Op(o.to_string()))
        continue rest
      }
      "\(", rest => {
        tokens.push(Token::LeftParen)
        continue rest
      }
      "\)", rest => {
        tokens.push(Token::RightParen)
        continue rest
      }
      "[ \n\r\t]+", rest => continue rest
      "$", _ => break
      _ => fail("Invalid input")
    }
  }
  tokens
}
```

The `tokenize` function splits the input string into a series of tokens:
* Matches numbers `[0-9]+` and converts them to Token::Literal;
* Matches arithmetic and power operators `[-+*/^]` and converts them to Token::Op;
* Matches parentheses `(` and `)` and converts them to LeftParen and RightParen respectively;
* Skips whitespace characters like spaces and newlines;
* Reports an error if encountering characters that don't match the rules.
Through lexmatch and regular expressions, the entire tokenization process is both concise and efficient.

Next, we define a global operator table to store operator precedence and associativity:
```moonbit
priv enum Associativity {
  Left
  Right
}

priv struct OpInfo {
  precedence : Int
  associativity : Associativity
}

let op_table : Map[String, OpInfo] = {
  "+": { precedence: 10, associativity: Left },
  "-": { precedence: 10, associativity: Left },
  "*": { precedence: 20, associativity: Left },
  "/": { precedence: 20, associativity: Left },
  "^": { precedence: 30, associativity: Right },
}
```
Here, we define the precedence and associativity of common operators through `op_table`:

+ `+` and `-` have the lowest precedence (10) and are left-associative;

* `*` and `/` have higher precedence (20) and are also left-associative;

* `^` (power operation) has the highest precedence (30) but is right-associative.

Next, we define a helper function to determine whether we need to process (pop) the top operator when encountering a new operator:

```moonbit
fn should_pop(top_op_info~ : OpInfo, incoming_op_info~ : OpInfo) -> Bool {
  top_op_info.precedence > incoming_op_info.precedence ||
  (
    top_op_info.precedence == incoming_op_info.precedence &&
    top_op_info.associativity is Left
  )
}
```

The logic of `should_pop` is one of the cores of the Shunting Yard algorithm:
* If the precedence of the top operator is **higher than** the new operator, we should process the top operator first;
* If they have equal precedence and the top operator is **left-associative**, we should also process the top operator first;
* Otherwise, keep the top operator and push the new operator directly into the stack.

Next, we implement the expression parsing function:

```moonbit
pub fn parse_expr(tokens : Array[Token]) -> Expr {
  let op_stack : Array[String] = []
  let val_stack : Array[Expr] = []
  fn push_binary_expr(top_op) {
    let right = val_stack.pop().unwrap()
    let left = val_stack.pop().unwrap()
    val_stack.push(Expr::BinExpr(top_op, left, right))
  }

  for token in tokens {
    match token {
      Literal(n) => val_stack.push(Expr::Literal(n))
      Op(incoming_op) => {
        let incoming_op_info = op_table[incoming_op]
        while true {
          match op_stack.last() {
            None => break
            Some(top_op) =>
              if top_op != "(" &&
                should_pop(top_op_info=op_table[top_op], incoming_op_info~) {
                op_stack.pop() |> ignore
                push_binary_expr(top_op)
              } else {
                break
              }
          }
        }
        op_stack.push(incoming_op)
      }
      LeftParen => op_stack.push("(")
      RightParen =>
        while op_stack.pop() is Some(top_op) {
          if top_op != "(" {
            push_binary_expr(top_op)
          } else {
            break
          }
        }
    }
  }
  while op_stack.pop() is Some(top_op) {
    push_binary_expr(top_op)
  }
  val_stack.pop().unwrap()
}
```

`parse_expr` is the core implementation of the entire Shunting Yard algorithm:

1. **Data structure preparation**
    * `op_stack` stores operators and parentheses;
    * `val_stack` stores operands or partially constructed sub-expressions;
    * The internal function `push_binary_expr` encapsulates a small step: pop two operands from the value stack, combine them with an operator, generate a new `BinExpr` node, and push it back into the value stack.

2. **Iterate through tokens**

    * Numbers: Push directly into `val_stack`.
    * Operators: Continuously check the top operator in `op_stack`, if it has higher precedence or needs to be calculated first, pop it and construct a sub-expression; when the condition is no longer met, push the new operator into the stack.
    * Left parenthesis: Push into `op_stack` to separate sub-expressions.
    * Right parenthesis: Continuously pop operators and combine them with operands from the value stack to form sub-expressions, until a matching left parenthesis is encountered.

3. **Clear the operator stack**

    After iteration is complete, there may still be operators remaining in `op_stack`, which need to be popped one by one and combined with operands from the value stack until the operator stack is empty.

4. **Return result**

    Finally, the value stack should contain only one element, which is the complete abstract syntax tree. If this is not the case, it indicates that the input expression contains syntax errors.

Finally, we can define a simple eval function for testing:
```moonbit
pub fn eval(expr : Expr) -> Int {
  match expr {
    Literal(n) => n
    BinExpr(op, left, right) =>
      match op {
        "+" => eval(left) + eval(right)
        "-" => eval(left) - eval(right)
        "*" => eval(left) * eval(right)
        "/" => eval(left) / eval(right)
        "^" => {
          fn pow(base : Int, exp : Int) -> Int {
            if exp == 0 {
              1
            } else {
              base * pow(base, exp - 1)
            }
          }

          pow(eval(left), eval(right))
        }
        _ => abort("Invalid operator")
      }
  }
}

///|
pub fn parse_and_eval(input : String) -> Int raise {
  eval(parse_expr(tokenize(input)))
}
```

And verify our implementation with some simple test cases:

```moonbit
test "parse_and_eval" {
  inspect(parse_and_eval("1 + 2 * 3"), content="7")
  inspect(parse_and_eval("2 ^ 3 ^ 2"), content="512")
  inspect(parse_and_eval("(2 ^ 3) ^ 2"), content="64")
  inspect(parse_and_eval("(1 + 2) * 3"), content="9")
  inspect(parse_and_eval("10 - (3 + 2)"), content="5")
  inspect(parse_and_eval("2 * (3 + 4)"), content="14")
  inspect(parse_and_eval("(5 + 3) / 2"), content="4")
  inspect(parse_and_eval("10 / 2 - 1"), content="4")
  inspect(parse_and_eval("1 + 2 + 3"), content="6")
  inspect(parse_and_eval("10 - 5 - 2"), content="3")
  inspect(parse_and_eval("5"), content="5")
  inspect(parse_and_eval("(1 + 2) * (3 + 4)"), content="21")
  inspect(parse_and_eval("2 ^ (1 + 2)"), content="8")
  inspect(parse_and_eval("1 + 2 * 3 - 4 / 2 + 5"), content="10")
  inspect(parse_and_eval("((1 + 2) * 3) ^ 2 - 10"), content="71")
  inspect(parse_and_eval("100 / (2 * 5) + 3 * (4 - 1)"), content="19")
  inspect(parse_and_eval("2 ^ 2 * 3 + 1"), content="13")
  inspect(parse_and_eval("1 + 2 * 3 ^ 2 - 4 / 2"), content="17")
}
```

## Summary

The core idea of the Shunting Yard algorithm lies in using two stacks to explicitly manage the computation process:

* Value stack (val_stack) is used to store numbers and partially combined sub-expressions;
* Operator stack (op_stack) is used to store unprocessed operators and parentheses.

By defining operator precedence and associativity, and continuously comparing and popping top operators during token scanning, the Shunting Yard algorithm ensures that expressions are combined into abstract syntax trees (AST) in the correct order.
Finally, when all tokens have been read and the operator stack is cleared, what remains in the value stack is the complete expression tree.

This method intuitively simulates our manual calculation approach: first "remember" content that cannot be calculated immediately, then retrieve and process it when conditions are appropriate. Its process is clear and implementation is concise, making it very suitable as a starting point for learning expression parsing.

Previously, MoonBit Pearl published an [article](https://www.moonbitlang.cn/pearls/pratt-parse) introducing Pratt parsing. Both are classic methods for solving "how to correctly parse expression precedence and associativity," but their approaches are completely different.
Shunting Yard uses loops and explicit data structures, managing unprocessed symbols and partial sub-expressions through operator and value stacks. The entire process is like manually manipulating two stacks, with clear logic that's easy to track. Pratt Parser, on the other hand, is based on recursive descent, where each token defines parsing methods in different contexts, and parsing progress depends on the language runtime's call stack: each recursive call is equivalent to pushing unfinished state onto the stack, then continuing to combine when returning. In other words, Pratt Parser hides the existence of the "stack" within recursive calls, while Shunting Yard makes this state management explicit, directly simulating it with loops and data structures. Therefore, it can be considered that Shunting Yard is a transcription of the mechanisms implicit in Pratt Parser's call stack into explicit stack operations. The former is mechanical in steps, suitable for quickly implementing fixed operator parsing; the latter is more flexible, especially more natural when handling prefix, postfix, or custom operators.
