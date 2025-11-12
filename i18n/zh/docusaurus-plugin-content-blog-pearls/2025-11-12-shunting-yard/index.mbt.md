---
slug: shunting-yard
description: '在 MoonBit 中实现 Shunting Yard 算法'
image: cover.png
---

# 在 MoonBit 中实现 Shunting Yard 算法

![](./cover.png)

## 什么是 Shunting Yard 算法？

在编程语言或解释器的实现中，如何处理数学表达式一直是一个经典问题。我们希望能够像人一样理解“中缀表达式”（如 3 + 4 * 2），并正确考虑运算符优先级与括号。

1961 年，Edsger Dijkstra 提出了著名的 Shunting Yard 算法，它提供了一种机械化的方式来将中缀表达式转换为后缀表达式（RPN）或抽象语法树（AST）。算法的名字来源于铁路编组场：火车车厢通过在轨道之间来回调度实现排序，而在表达式处理中，我们通过两个栈来存储和调度操作数与操作符。想象一下你在脑子里计算 3 + 4 * 2 的过程：

1. 你知道乘法优先级更高，所以要先算 4 * 2。
2. 在此过程中，你会把前面的 3 和 + 临时“记在心里”。
3. 等乘法结果出来，再把它和 3 相加。

Dijkstra 的洞见在于：这种人类计算时“临时记住某些东西再回来处理”的思维过程，其实可以用栈（stack）来模拟。就像铁路编组场会把火车车厢先临时停放在侧轨，再根据需要调度一样，算法通过把数字和运算符在不同的栈之间移动，来实现对运算顺序的控制。“Shunting Yard”（调度场算法）的名字正是来自这种铁路类比：

* 火车车厢通过在轨道间移动来完成排序；
* 数学表达式中的运算符和数字，也可以通过在栈之间移动来完成正确的排序与计算。

Dijkstra 把我们人类零散、混乱的计算过程，抽象成了一个清晰、机械化的流程，让计算机也能按照同样的逻辑来处理算式。

## Shunting Yard 算法的基本流程

Shunting Yard 算法通过维护两个栈来保证表达式按照正确的优先级和结合性进行解析：

1. **初始化**

    建立两个空栈：
    * 运算符栈（op_stack），用于临时存放尚未处理的运算符和括号；
    * 值栈（val_stack），用于存放操作数以及已经构造好的部分子表达式。

2. **逐一扫描输入 token**

    * **若 token 为数字或变量**：直接压入 val_stack。
    * **若 token 为运算符**：
    
        1. 检查 op_stack 栈顶元素。
        2. 当且仅当栈顶运算符的优先级高于当前运算符，或优先级相等且为左结合时，将该栈顶运算符弹出，并结合 val_stack 中的两个操作数，**合成一个新的子表达式**，再压回 val_stack。
        3. 重复此过程，直到不满足条件为止，然后将当前运算符压入 op_stack。

    * **若 token 为左括号**：压入 op_stack，作为分界标记。
    * **若 token 为右括号**：不断从 op_stack 弹出运算符，并用 val_stack 顶部的操作数组合成子表达式，直到遇到左括号为止；左括号本身丢弃，不会进入 val_stack。

3. **清空运算符栈**

    当所有 token 扫描完成后，若 op_stack 中仍有运算符，则依次弹出，并与 val_stack 中的操作数组合成更大的表达式，直到运算符栈为空。

4. **结束条件**

    最终，val_stack 中应只剩下一个元素，该元素即为完整的抽象语法树或后缀表达式。若栈内元素数量不为一，或存在未匹配的括号，则说明输入表达式存在错误。

### 演算示例

接下来我们以解析 `(1 + 2) * (3 - 4) ^ 2` 为例，来展示在读入 token 的过程中，两个栈是如何变化的，从而更好地理解 Shunting Yard 算法：

| 步骤 | 读入 token | 运算符栈（op\_stack） | 值栈（val\_stack）                                        | 说明                                                     |
| -- | -------- | --------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| 1  | `(`      | [`(`]           | []                                                     | 左括号压入运算符栈                                              |
| 2  | `1`      | [`(`]           | [`1`]                                                   | 数字压入值栈                                                 |
| 3  | `+`      | [`(`, `+`]        | [`1`]                                                   | 运算符压入运算符栈                                              |
| 4  | `2`      | [`(`, `+`]        | [`1`, `2`]                                                | 数字压入值栈                                                 |
| 5  | `)`      | []               | [`1 + 2`]                                           | 弹出直到左括号：`1` 与 `2` 结合为 `1+2`                          |
| 6  | `*`      | [`*`]            | [`1 + 2`]                                             | 运算符压入运算符栈                                              |
| 7  | `(`      | [`*`, `(`]       | [`1 + 2`]                                             | 左括号压入运算符栈                                              |
| 8  | `3`      | [`*`, `(`]       | [`1 + 2`, `3`]                                          | 数字压入值栈                                                 |
| 9  | `-`      | [`*`, `(`, `-`]    | [`1 + 2`, `3`]                                          | 运算符压入运算符栈                                              |
| 10 | `4`      | [`*`, `(`, `-`]    | [`1 + 2`, `3`, `4`]                                       | 数字压入值栈                                                 |
| 11 | `)`      | [`*`]            |  [`1 + 2`, `3 - 4`]                                    | 弹出直到左括号：`3` 与 `4` 结合为 `3-4`                          |
| 12 | `^`      | [`*`, `^`]         | [`1 + 2`, `3 - 4`]                                      | 幂运算符压入栈（右结合，不会触发弹出）                                    |
| 13 | `2`      | [`*`, `^`]         | [`1 + 2`, `3 - 4`, `2`]                                   | 数字压入值栈                                                 |
| 14 | 输入结束     | []               | [`(1 + 2) * (3 - 4) ^ 2`] | 清空运算符栈：先弹出 `^`，结合 `3-4` 与 `2`；再弹出 `*`，结合 `1+2` 与结果 |

在这个例子中，有以下几点值得注意：

* 括号优先处理
在第一组括号 `(1 + 2)` 中，运算符 `+` 被延迟存放在运算符栈中，直到遇到右括号才与 1 和 2 结合。第二组括号 `(3 - 4)` 的处理过程完全相同。

* 优先级的体现
当遇到 `*` 时，它被压入运算符栈。但随后遇到幂运算符 `^` 时，由于 `^` 的优先级高于 `*`，且是右结合，因此直接压栈，而不会触发 `*` 的弹出。

* 结合性的作用
幂运算符 `^` 通常定义为右结合，这意味着表达式 `a ^ b ^ c` 会被解析为 `a ^ (b ^ c)`。在本例中，`(3-4) ^ 2` 保持这种结合方式，正确构建了子表达式。

* 最终结果
在输入结束后，运算符栈依次被清空，最终形成完整的表达式：
```
(1 + 2) * ((3 - 4) ^ 2)
```

## 在 MoonBit 中实现 Shunting Yard 算法

首先我们需要定义表达式和 token 的类型：
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

我们可以利用 MoonBit 中的正则表达式匹配语法，快速的实现一个简单的 tokenizer：

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

`tokenize` 函数的作用是把输入字符串分割成一系列 token：
* 匹配数字 `[0-9]+`，转换为 Token::Literal；
* 匹配四则运算符和幂运算符 `[-+*/^]`，转换为 Token::Op；
* 匹配括号 `(` 与 `)`，分别转换为 LeftParen 和 RightParen；
* 匹配空格、换行等空白字符则直接跳过；
* 如果遇到不符合规则的字符，则报错。
通过 lexmatch 和正则表达式，整个分词过程既简洁又高效。

接下来我们定义一个全局的操作符表，用于存储操作符的优先级和结合性：
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
这里通过 `op_table` 定义了常见运算符的优先级与结合性：

+ `+` 和 `-` 的优先级最低（10），是左结合；

* `*` 和 `/` 的优先级更高（20），同样是左结合；

* `^`（幂运算）的优先级最高（30），但它是右结合。

接下来我们定义一个辅助函数，用于判断在遇到一个新的运算符时，是否需要先处理（弹出）栈顶的运算符：

```moonbit
fn should_pop(top_op_info~ : OpInfo, incoming_op_info~ : OpInfo) -> Bool {
  top_op_info.precedence > incoming_op_info.precedence ||
  (
    top_op_info.precedence == incoming_op_info.precedence &&
    top_op_info.associativity is Left
  )
}
```

`should_pop` 的逻辑是 Shunting Yard 算法的核心之一：
* 如果栈顶运算符的优先级**高于**新运算符，则应当先处理栈顶运算符；
* 如果两者优先级相等，并且栈顶运算符是**左结合**，同样应当先处理栈顶运算符；
* 否则，保留栈顶运算符，把新运算符直接压入栈。

接下来我们实现表达式的解析函数：

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

`parse_expr` 是整个 Shunting Yard 算法的核心实现：

1. 数据结构准备
    * `op_stack` 存储运算符和括号；
    * `val_stack` 存储操作数或部分构造好的子表达式；
    * 内部函数 `push_binary_expr` 封装了一个小步骤：从值栈中弹出两个操作数，结合运算符，生成一个新的 `BinExpr` 节点，并压回值栈。

2. 遍历 token

    * 数字：直接压入 `val_stack`。
    * 运算符：不断检查 `op_stack` 栈顶的运算符，如果优先级更高或需要先计算，则弹出并构造子表达式；直到不满足条件时，把新运算符压入栈。
    * 左括号：压入 `op_stack`，用于分隔子表达式。
    * 右括号：持续弹出运算符，并结合值栈中的操作数形成子表达式，直到遇到匹配的左括号。

3. 清空运算符栈

    遍历完成后，可能仍有运算符滞留在 `op_stack` 中，这时需要逐一弹出，并结合值栈中的操作数，直到运算符栈为空。

4. 返回结果

    最终，值栈中应当只剩下一个元素，它就是完整的抽象语法树。若不是这种情况，说明输入表达式存在语法错误。

最后我们可以定义一个简单的 eval 函数，以便于进行测试：
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

并通过一些简单的测试用例来验证我们的实现：

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

## 小结

Shunting Yard 算法的核心思想在于使用两个栈来显式管理运算过程：

* 值栈（val_stack） 用于保存数字和已经组合好的部分子表达式；
* 运算符栈（op_stack） 用于保存尚未处理的运算符和括号。

通过定义运算符的优先级与结合性，并在扫描 token 的过程中不断比较和弹出栈顶运算符，Shunting Yard 能够保证表达式被按照正确的顺序组合成抽象语法树（AST）。
最终，当所有 token 被读取并且运算符栈清空后，值栈中剩下的就是完整的表达式树。

这种方法直观地模拟了我们手工计算时的思路：先把暂时不能计算的内容“记下来”，等条件合适时再取出处理。它的流程清晰、实现简洁，非常适合作为学习表达式解析的起点。

之前 MoonBit Pearl 中发布过一篇介绍 Pratt parsing 的[文章](https://www.moonbitlang.cn/pearls/pratt-parse)，两者都是解决“如何正确解析表达式优先级和结合性”的经典方法，但它们的思路截然不同。
Shunting Yard 使用循环和显式的数据结构，通过运算符栈和值栈来管理尚未处理的符号和部分子表达式，整个过程像是手工操纵两个栈，逻辑清晰且容易跟踪。Pratt Parser 则基于递归下降，每个 token 定义在不同上下文下的解析方式，解析的推进依赖语言运行时的调用栈：每一次递归调用都相当于把尚未完成的状态压入栈中，返回时再继续组合。换句话说，Pratt Parser 将“栈”的存在隐藏在递归调用里，而 Shunting Yard 则把这种状态管理显式化，用循环和数据结构来直接模拟出来。因此，可以认为 Shunting Yard 是将 Pratt Parser 中隐含在调用栈里的机制转写为显式的栈操作。前者步骤机械化，适合快速实现固定的运算符解析；后者更灵活，尤其在处理前缀、后缀或自定义运算符时更为自然。
