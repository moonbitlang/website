---
description: '正则表达式引擎的两种实现方法：导数与 Thompson 虚拟机'
slug: moonbit-regex
image: cover.png
---

# 正则表达式引擎的两种实现方法：导数与 Thompson 虚拟机

正则表达式引擎的实现方式多样，不同方法在性能、内存消耗和实现复杂度上各有权衡。本文将介绍两种数学上等价但实际表现迥异的正则匹配方法：Brzozowski 导数方法和 Thompson 虚拟机方法。

这两种方法都基于相同的抽象语法树表示，为直接的性能对比提供了统一的基础。其核心思想在于：这些看似不同的方法实际上是用不同的计算策略来解决同一个问题——一个依靠代数变换，另一个则通过程序执行。

## 约定与定义

为了建立统一的基础，两种正则表达式引擎都采用相同的抽象语法树（AST）表示，用树形结构来描述正则表达式的基本构造：

```moonbit
enum Ast {
  Chr(Char)
  Seq(Ast, Ast)
  Rep(Ast, Int?)
  Opt(Ast)
} derive(Show, ToJson, Hash, Eq)
```

此外，我们还提供了智能构造函数来简化正则表达式的构建：

```moonbit
fn Ast::chr(chr : Char) -> Ast {
  Chr(chr)
}

fn Ast::seq(self : Ast, other : Ast) -> Ast {
  Seq(self, other)
}

fn Ast::rep(self : Ast, n? : Int) -> Ast {
  Rep(self, n)
}

fn Ast::opt(self : Ast) -> Ast {
  @fs.
  Opt(self)
}
```

AST 定义了四种基本的正则表达式操作：

1. `Chr(Char)` - 匹配单个字符字面量
2. `Seq(Ast, Ast)` - 序列匹配，即一个模式紧跟另一个模式
3. `Rep(Ast, Int?)` - 重复匹配，`None` 表示无限次重复，`Some(n)` 表示恰好重复 n 次
4. `Opt(Ast)` - 可选匹配，相当于标准正则语法中的 `pattern?`

举个例子，正则表达式 `(ab*)?` 表示一个可选的序列（'a' 后跟零个或多个 'b'），可以这样构建：

```moonbit no-check
Ast::chr('a').seq(Ast::chr('b').rep()).opt()
```

## Brzozowski 导数方法

导数方法基于形式语言理论，通过代数变换来处理正则表达式。对于输入的每个字符，该方法计算正则表达式的"导数"，实质上是在问："消费掉这个字符后，还剩下什么需要匹配？"这样就得到了一个新的正则表达式，代表剩余的匹配模式。

为了明确表示导数和可空性，我们对基本的 `Ast` 类型进行了扩展：

```moonbit
enum Exp {
  Nil
  Eps
  Chr(Char)
  Alt(Exp, Exp)
  Seq(Exp, Exp)
  Rep(Exp)
} derive(Show, Hash, Eq, Compare, ToJson)
```

`Exp` 中各构造器的含义如下：

1. `Nil` - 表示不可能匹配的模式，即空集
2. `Eps` - 匹配空字符串
3. `Chr(Char)` - 匹配单个字符
4. `Alt(Exp, Exp)` - 表示选择（或），在多个模式间进行选择
5. `Seq(Exp, Exp)` - 表示连接，将两个模式依次连接
6. `Rep(Exp)` - 表示重复，对模式进行零次或多次重复

通过 `Exp::of_ast` 函数，我们可以将 `Ast` 转换为表达能力更强的 `Exp` 格式：

```moonbit
fn Exp::of_ast(ast : Ast) -> Exp {
  match ast {
    Chr(c) => Chr(c)
    Seq(a, b) => Seq(Exp::of_ast(a), Exp::of_ast(b))
    Rep(a, None) => Rep(Exp::of_ast(a))
    Rep(a, Some(n)) => {
      let sec = Exp::of_ast(a)
      let mut exp = sec
      for _ in 1..<n {
        exp = Seq(exp, sec)
      }
      exp
    }
    Opt(a) => Alt(Exp::of_ast(a), Eps)
  }
}
```

同样，我们也为 `Exp` 提供了智能构造函数来简化模式构建：

```moonbit
fn Exp::seq(a : Exp, b : Exp) -> Exp {
  match (a, b) {
    (Nil, _) | (_, Nil) => Nil
    (Eps, b) => b
    (a, Eps) => a
    (a, b) => Seq(a, b)
  }
}
```

不过，`Alt` 的智能构造函数特别重要——它保证构造出的 `Exp` 符合 Brzozowski 原论文中的"相似性"标准化要求。两个正则表达式如果能通过以下规则相互转换，就被认为是相似的：

$$
  \begin{align}
    & A \mid \emptyset &&\rightarrow A \\
    & A \mid B &&\rightarrow B \mid A \\
    & A \mid (B \mid C) &&\rightarrow (A \mid B) \mid C
  \end{align}
$$

因此，我们对 `Alt` 构造进行标准化，确保始终使用一致的结合律和选择顺序：

```moonbit
fn Exp::alt(a : Exp, b : Exp) -> Exp {
  match (a, b) {
    (Nil, b) => b
    (a, Nil) => a
    (Alt(a, b), c) => a.alt(b.alt(c))
    (a, b) => {
      if a == b {
        a
      } else if a > b {
        Alt(b, a)
      } else {
        Alt(a, b)
      }
    }
  }
}
```

`nullable` 函数用于判断一个模式是否能够在不消费任何输入的情况下成功匹配（即匹配空字符串）：

```moonbit
fn Exp::nullable(self : Exp) -> Bool {
  match self {
    Nil => false
    Eps => true
    Chr(_) => false
    Alt(l, r) => l.nullable() || r.nullable()
    Seq(l, r) => l.nullable() && r.nullable()
    Rep(_) => true
  }
}
```

`deriv` 函数计算模式对于特定字符的导数，按照 Brzozowski 导数理论中定义的规则对模式进行变换。我们对规则进行了重新排列，使其与 `deriv` 函数的实现顺序保持一致：

$$
  \begin{align}
    D_{a} \emptyset &= \emptyset \\
    D_{a} \epsilon &= \emptyset \\
    D_{a} a &= \epsilon \\
    D_{a} b &= \emptyset & \text{ for }(a \neq b) \\
    D_{a} (P \mid Q) &= (D_{a} P) \mid (D_{a} Q) \\
    D_{a} (P \cdot Q) &= (D_{a} P \cdot Q) \mid (\nu(P) \cdot D_{a} Q) \\
    D_{a} (P\ast) &= D_{a} P \cdot P\ast \\
  \end{align}
$$

```moonbit
fn Exp::deriv(self : Exp, c : Char) -> Exp {
  match self {
    Nil => self
    Eps => Nil
    Chr(d) if d == c => Eps
    Chr(_) => Nil
    Alt(l, r) => l.deriv(c).alt(r.deriv(c))
    Seq(l, r) => {
      let dl = l.deriv(c)
      if l.nullable() {
        dl.seq(r).alt(r.deriv(c))
      } else {
        dl.seq(r)
      }
    }
    Rep(e) => e.deriv(c).seq(self)
  }
}
```

为了简化实现，我们这里只进行严格匹配，也就是说模式必须匹配整个输入字符串。因此，只有在处理完所有输入字符后，我们才检查最终模式的可空性：

```moonbit
fn Exp::matches(self : Exp, s : String) -> Bool {
  loop (self, s.view()) {
    (Nil, _) => {
      return false
    }
    (e, []) => {
      return e.nullable()
    }
    (e, [c, .. s]) => {
      continue (e.deriv(c), s)
    }
  }
}
```

## 虚拟机方法

虚拟机方法将正则表达式编译成简单虚拟机的字节码指令。这种方法把模式匹配问题转化为程序执行过程，虚拟机同时模拟非确定性有限自动机中所有可能的执行路径。

Ken Thompson 在 1968 年的经典论文中描述了一种将正则模式编译为 IBM 7094 机器代码的引擎。其关键思路是：通过维护多个执行线程来避免指数级回溯，这些线程同步地在输入中前进，每次处理一个字符，同时探索所有可能的匹配路径。

### 指令集与程序表示

该虚拟机基于四种基本指令运行，它们分别对应 NFA 的不同操作：

```moonbit
enum Ops {
  Done
  Char(Char)
  Jump(Int)
  Fork(Int)
} derive(Show, ToJson)
```

每条指令在 NFA 模拟中都有其特定作用：`Done` 标记匹配成功完成，对应 Thompson 原设计中的 `match`；`Char(c)` 消费输入字符 `c` 并跳转到下一条指令；`Jump(addr)` 无条件跳转至地址 `addr`，即 Thompson 的 `jmp`；`Fork(addr)` 创建两条执行路径——一条继续执行下一条指令，另一条跳转到 `addr`，对应 Thompson 的 `split`。

`Fork` 指令是处理模式非确定性的关键，比如选择和重复操作，这些情况下需要同时探索多条执行路径。这直接对应了 NFA 中的 ε-转换，即执行流可以在不消费输入的情况下发生分支。

我们定义了 `Prg` 类型，它封装了指令数组并提供便捷的方法来构建和操作字节码程序：

```moonbit
type Prg Array[Ops] derive(Show, ToJson)

fn Prg::push(self : Prg, inst : Ops) -> Unit {
  self.inner().push(inst)
}

fn Prg::length(self : Prg) -> Int {
  self.inner().length()
}

fn Prg::op_set(self : Prg, index : Int, inst : Ops) -> Unit {
  self.inner()[index] = inst
}
```

### AST 到字节码的编译

`Prg::of_ast` 函数采用标准的 NFA 构造技术，将 AST 模式转换为虚拟机指令：

1. `Seq(a, b)`：

   ```plaintext
   code for a
   code for b
   ```

2. `Rep(a, None)` (无界重复)：

   ```plaintext
       Fork L1, L2
   L1: code for a
       Jump L1
   L2:
   ```

3. `Rep(a, Some(n))` (固定重复)：

   ```plaintext
   code for a
   code for a
   ... (n times) ...
   ```

4. `Opt(a)` (可选)：

   ```plaintext
       Fork L1, L2
   L1: code for a
   L2:
   ```

需要注意的是，`Fork` 构造器只接受一个地址参数，这是因为我们总是希望在 `Fork` 指令后继续执行下一条指令。

```moonbit
fn Prg::of_ast(ast : Ast) -> Prg {
  fn compile(prog : Prg, ast : Ast) -> Unit {
    match ast {
      Chr(chr) => prog.push(Char(chr))
      Seq(l, r) => {
        compile(prog, l)
        compile(prog, r)
      }
      Rep(e, None) => {
        let fork = prog.length()
        prog.push(Fork(0))
        compile(prog, e)
        prog.push(Jump(fork))
        prog[fork] = Fork(prog.length())
      }
      Rep(e, Some(n)) =>
        for _ in 0..<n {
          compile(prog, e)
        }
      Opt(e) => {
        let fork_inst = prog.length()
        prog.push(Fork(0))
        compile(prog, e)
        prog[fork_inst] = Fork(prog.length())
      }
    }
  }

  let prog : Prg = []
  compile(prog, ast)
  prog.push(Done)
  prog
}
```

### 虚拟机执行循环

在 Rob Pike 的实现中，虚拟机会在输入字符串结束后再执行一轮来处理最终的接受状态。为了明确这个过程，我们的 `matches` 函数采用两阶段方法来实现核心的虚拟机执行循环：

**阶段一：字符处理**。对于每个输入字符，处理当前上下文中所有活跃的线程。如果 `Char` 指令匹配当前字符，就在下一个上下文中创建新线程。`Jump` 和 `Fork` 指令会立即在当前上下文中产生新线程。处理完所有线程后，交换上下文并继续处理下一个字符。

**阶段二：最终接受判断**。处理完所有输入后，检查剩余线程中是否有 `Done` 指令。同时处理那些不消费输入的 `Jump`/`Fork` 指令。如果有任何线程到达 `Done` 指令，就返回 `true`。

```moonbit
fn Prg::matches(self : Prg, data : @string.View) -> Bool {
  let Prg(prog) = self
  let mut curr = Ctx::new(prog.length())
  let mut next = Ctx::new(prog.length())
  curr.add(0)
  for c in data {
    while curr.pop() is Some(pc) {
      match prog[pc] {
        Done => ()
        Char(char) if char == c => {
          next.add(pc + 1)
        }
        Jump(jump) =>
          curr.add(jump)
        Fork(fork) => {
          curr.add(fork)
          curr.add(pc + 1)
        }
        _ => ()
      }
    }
    let temp = curr
    curr = next
    next = temp
    next.reset()
  }
  while curr.pop() is Some(pc) {
    match prog[pc] {
      Done => return true
      Jump(x) => curr.add(x)
      Fork(x) => {
        curr.add(x)
        curr.add(pc + 1)
      }
      _ => ()
    }
  }
  false
}
```

在 Rob Pike 的原始博客中，他使用递归函数来处理 `Fork` 和 `Jump` 指令，以保证线程按优先级执行。而我们这里采用了类似栈的结构来管理所有执行线程，这样可以自然地维护线程优先级：

```moonbit
struct Ctx {
  deque : @deque.T[Int]
  visit : FixedArray[Bool]
}

fn Ctx::new(length : Int) -> Ctx {
  { deque: @deque.new(), visit: FixedArray::make(length, false) }
}

fn Ctx::add(self : Ctx, pc : Int) -> Unit {
  if !self.visit[pc] {
    self.deque.push_back(pc)
    self.visit[pc] = true
  }
}

fn Ctx::pop(self : Ctx) -> Int? {
  match self.deque.pop_back() {
    Some(pc) => {
      self.visit[pc] = false
      Some(pc)
    }
    None => None
  }
}

fn Ctx::reset(self : Ctx) -> Unit {
  self.deque.clear()
  self.visit.fill(false)
}
```

`visit` 数组用于过滤掉低优先级的重复线程。添加新线程时，我们先通过 `visit` 数组检查该线程是否已存在于 `deque` 中。如果已存在就直接丢弃；否则加入 `deque` 并标记为已访问。这个机制对于处理像 `(a?)*` 这样可能无限扩展的模式很重要，能够有效避免无限循环或指数级的线程爆炸。

## 基准测试与性能分析

我们通过一个对很多正则表达式实现都构成挑战的病理性案例来比较这两种方法：

```moonbit
test (b : @bench.T) {
  let n = 15
  let txt = "a".repeat(n)
  let chr = Ast::chr('a')
  let ast : Ast = chr.opt().rep(n~).seq(chr.rep(n~))
  let exp = Exp::of_ast(ast)
  b.bench(name="derive", () => exp.matches(txt) |> ignore())
  let tvm = Prg::of_ast(ast)
  b.bench(name="thompson", () => tvm.matches(txt) |> ignore())
}
```

模式 `(a?){n}a{n}` 是回溯引擎中典型的指数爆炸案例。这个模式有 n 种不同的方式来匹配 n 个 'a' 字符，在朴素的实现中会产生指数级的搜索空间。

```plaintext
name     time (mean ± σ)         range (min … max)
derive     41.78 µs ±   0.14 µs    41.61 µs …  42.13 µs  in 10 ×   2359 runs
thompson   12.79 µs ±   0.04 µs    12.74 µs …  12.84 µs  in 10 ×   7815 runs
```

从基准测试结果可以看出，在这种情况下虚拟机方法明显快于导数方法。导数方法需要频繁分配中间的正则表达式结构，带来了更高的开销和更慢的性能。相比之下，虚拟机执行的是一组固定的指令，一旦双端队列扩展到完整大小后，就很少需要分配新的结构了。

不过，导数方法在理论分析上更简洁。我们可以很容易地证明算法的终止性，因为需要计算的导数数量受到 AST 大小的限制，并且随着 `deriv` 函数的每次递归调用而严格递减。而虚拟机方法则不同，如果输入的 `Prg` 包含无限循环，程序可能永远不会终止，这就需要仔细处理线程优先级，以避免无限循环和线程数量的指数级增长。
