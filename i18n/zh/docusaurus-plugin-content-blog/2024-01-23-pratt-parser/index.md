---
description: 如何用MoonBit编写Pratt解析器？
slug: pratt-parser
image: ./cover.jpg
tags: [MoonBit, Coding Practice]
draft: true
---

import Cover from './cover.jpg'

# 编程实践｜如何使用MoonBit编写Pratt解析器？

<img src={Cover} />

在编译过程中，语法分析（也称为解析，Parsing）是一个关键步骤。解析器（Parser）的主要职责是将Token流转换成抽象语法树（AST）。本文将介绍一种解析器的实现算法：Pratt解析器（Pratt Parsing）， 是一种自顶向下的语法分析器（Top Down Operator Precedence Parsing），并展示如何用MoonBit来实现它。

在编译过程中，语法分析（也称为解析，Parsing）是一个关键步骤。解析器（Parser）的主要职责是将Token流转换成抽象语法树（AST）。本文将介绍一种解析器的实现算法：Pratt解析（Pratt Parsing），也称为自顶向下的运算符优先级解析（Top Down Operator Precedence Parsing），并展示如何用MoonBit来实现它。

本处给出的完整代码例子中便有关于前缀运算符的处理: [try.moonbitlang.cn/#99b19baf](http://try.moonbitlang.cn/#99b19baf)

<!--truncate-->

## 为什么用Pratt解析器

几乎每个程序员都不会对中缀表达式感到陌生, 即使是坚定的Lisp/Forth程序员，至少也知道世界上有大半人这样写算术表达式：

```
24 * (x + 4)

```

而对于编译器(或者解释器)的编写者而言，这样的中缀表达式要比Lisp所用的前缀表达式和Forth使用的后缀表达式难解析一点。例如，使用朴素的手写递归下降解析器来解析就需要多个互相递归的函数，还得在分析表达式语法时消除左递归，这样的代码在运算符增多时变得很不友好。解析器生成工具在这一问题上也不是很令人满意的选项，以一个简单加法和乘法运算表达式的BNF为例

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

这绝对不是很直观，搞不好还得花时间复习一下大学里上过的形式语言课程。

而有些语言如haskell支持自定义的中缀运算符，这几乎不太可能简单地用某种解析器生成工具解决。

Pratt解析器很好地解决了中缀表达式解析的问题，与此同时，它还很方便扩展支持添加新的运算符(不需要改源码)。它被著名的编译原理书籍*crafting interpreters*推荐和递归下降解析器一同使用，rust-analyzer项目中也使用了它。

[https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d8368ccba02b422aa01c37f0a7cb3954~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=675&h=1080&s=458515&e=png&b=f2edda](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d8368ccba02b422aa01c37f0a7cb3954~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=675&h=1080&s=458515&e=png&b=f2edda)

## **结合力**

Pratt 解析器中用于描述结合性和优先级的概念叫做*binding power*(结合力)，对于每个中缀运算符而言，其结合力是一对整数 - 左右各一个。如下所示

```
expr:   A     +     B     *     C
power:     3     3     5     5

```

而其作用和名字非常符合，数字越大，越能优先获取某个操作数(operand, 这个例子中A B C都是操作数)。

上面的例子展示了具有不同优先级的运算符，而同一运算符的结合性通过一大一小的结合力来表示。

```
expr:   A     +     B     +     C
power:     1     2     1     2

```

在这个例子中，当解析到B时，由于左边的结合力较大，表达式会变成这样

```
expr:   (A + B)     +     C
power:           1     2

```

接下来让我们看看Pratt解析器在具体执行时如何使用这一概念。

## **概览与前期准备**

Pratt解析器的主体框架大概是这样

```moonbit
fn parseExpr(self : Tokens, min_bp : Int) -> Result[SExpr, String] {
    ......

    while true {
        .....
        parseExpr()
    }
}

```

从上文可以看出，它是交替使用递归和循环实现的。这其实对应着两种模式：

- 永远是最左边的表达式在最内层，即`"1 + 2 + 3" = "(1 + 2) + 3"`, 只需要使用循环就能解析
- 永远最右边的表达式在最内层，即`"1 + 2 + 3" = "1 + (2 + 3)"`, 这只使用递归也可以解析

`min_bp`是一个代表左侧某个还没有解析完毕的运算符结合力的参数。

由于这个过程中可能有各种各样的错误，所以`parseExpr`的返回值类型是`Result[SExpr, String]`.

不过在开始编写解析器之前，我们还需要对字符串进行分割，得到一个简单的Token流。

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

这个token流需要三个方法：`peek()` `next()` `eat()`

`peek()`方法能获取token流中的第一个token，对状态无改变，换言之它是无副作用的，只是偷看一眼将要处理的内容。对于空token流，它返回`Eof`。

```moonbit
fn peek(self : Tokens) -> Token {
  match self.tokens {
    Cons(t, _) => t
    Nil => Eof
  }
}

```

`next()`在peek的基础上消耗一个token

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

我们的目标是读入一个token流，并输出一个不需要考虑优先级的前缀表达式

```moonbit
enum SExpr {
  Atom(String)
  Cons(String, Array[SExpr])
}

```

最后我们还需要一个计算运算符结合力的函数，这可以用简单的match实现。在实际操作中为了便于添加新运算符，应该使用某种键值对容器

```moonbit
fn infix_binding_power(op : String) -> Result[(Int, Int), String] {
  match op {
    "+" => Ok((1, 2))
    "-" => Ok((1, 2))
    "/" => Ok((3, 4))
    "*" => Ok((3, 4))
    _ => Err("infix_binding_power(): bad op \\(op)")
  }
}

```

## **解析器实现**

最开始的工作是简单的，首先取出第一个token并赋值给变量`lhs`(left hand side的缩写，表示左侧参数)。

- 如果它是操作数，就存储下来
- 如果是括号(括号也被当作一种运算符处理，不过它受特别对待)，则递归解析出第一个表达式，然后消耗掉一个成对的括号。此处的`?`是MoonBit新提供的错误处理语法糖，如果前面的表达式是`Err()`则当前函数会直接终止并把这个`Err()`当成返回值
- 其他结果都说明解析出了问题，抛出错误, 此处用`Err`包裹一个报错用的字符串。

```moonbit
let mut lhs : Result[SExpr, String] = match self.next() {
  Operand(s) => Ok(Atom(s))
  Operator("(") => {
    let expr = parseExpr(self, 0)?
    self.eat(Operator(")"))
    Ok(expr)
  }
  t => Err("bad token \\(t)")
}

```

接着我们试着看一眼第一个运算符:

- 假如此时结果是Eof, 那并不能算失败，一个操作数也可以当成是完整的表达式，直接跳出循环
- 结果是运算符正常返回
- 其他结果返回错误

```moonbit
  while true {
    let op : Result[String, String] = match self.peek() {
      Eof => { break }
      Operator(op) => Ok(op)
      t => Err("bad token \\(t)")
    }
    let op = op?
    ......

```

接下来我们需要决定`lhs`归属于哪个操作符了，这里就要用到`min_bp`这个参数，它代表左边最近的一个尚未完成解析的操作符的结合力，其初始值为0(没有任何操作符在左边争抢第一个操作数)。不过，此处我们要先做个判断，就是运算符是不是括号 - 假如是括号，说明当前是在解析一个括号里的表达式，也应该跳出循环直接结束。这也是使用`peek`方法的原因之一，因为我们无法确定到底要不要在这里就消耗掉这个运算符。

在计算好当前运算符`op`的结合力之后，首先将左侧结合力`l_bp`和`min_bp`进行比较

- `l_bp`小于`min_bp`，马上break, 这样就会将`lhs`返回给上层还等着右侧参数的运算符
- 否则用`next`方法消耗掉当前操作符，并且递归调用`parseExpr`获取右侧参数，只是第二个参数使用当前操作符的右结合力。解析成功之后将结果赋值给`lhs`，继续循环

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

在整个函数的最后，只需要`return lhs`即可。

## **使用例子：基于栈的计算器**

逆波兰表示法（英语：Reverse Polish notation，缩写RPN），是一种由波兰数学家扬·卢卡西维茨于1920年引入的数学表达式形式。 这种表示法的特点是运算符写在数字后面，而藏在这一略显奇怪外表下的是它和数据结构中栈的紧密关联。举一个例子：`17 + 13 * 3` 对应的逆波兰表达式`17 13 3 * +`可以用一连串的指令实现

```moonbit
Push(17)
Push(13)
Push(3)
Mul() // 取出栈顶的两个元素相乘，再把结果放回栈顶
Add() // 如上，只是相乘换成相加

```

从算术表达式到指令序列的转换过程简单直接。

```moonbit
fn compile(this : SExpr) -> List[Instruction] {
  // 只能处理算术表达式
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

## 总结

pratt解析器不仅可以处理中缀运算符，后缀和前缀运算符乃至`arr[i]`这种访问运算符都可以一网打尽。

感谢matklad的这篇博客：[https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html](https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html)
