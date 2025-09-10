---
description: 'Two Approaches to Regex Engines: Derivative and Thompson VM'
slug: moonbit-regex
image: cover.png
---
# Two Approaches to Regex Engines: Derivative and Thompson VM

![](./cover.png)

Regular expression engines can be implemented using fundamentally different approaches, each with distinct trade-offs in performance, memory usage, and implementation complexity. This article explores two mathematically equivalent but practically different methods for regex matching: Brzozowski derivatives and Thompson's virtual machine approach.

Both methods operate on the same abstract syntax tree representation, providing a unified foundation for direct performance comparison. The key insight is how these seemingly different approaches solve identical problems through different computational strategies—one through algebraic transformation, the other through program execution.

## Conventions & Definitions

To establish a common foundation, both regex engines start with a shared AST representation that captures the essential structure of regular expressions in a tree format:

```moonbit
enum Ast {
  Chr(Char)
  Seq(Ast, Ast)
  Rep(Ast, Int?)
  Opt(Ast)
} derive(Show, Hash, Eq)
```

Additionally, we provide smart constructors to simplify regex construction:

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

The AST defines four fundamental regex operations:

1. `Chr(Char)` matches a single literal character.
2. `Seq(Ast, Ast)` matches one pattern followed by another through concatenation.
3. `Rep(Ast, Int?)` repeats a pattern either unlimited times when `None` or exactly n times when `Some(n)`.
4. `Opt(Ast)` makes a pattern optional, equivalent to `pattern?` in standard regex syntax.

For example, we can build the regex `(ab*)?`—an optional sequence of 'a' followed by zero or more 'b's—as:

```moonbit no-check
Ast::chr('a').seq(Ast::chr('b').rep()).opt()
```

## Brzozowski Derivative

The derivative-based approach transforms regular expressions algebraically using formal language theory. For each input character, it computes the "derivative" of the regex by asking: "what remains to be matched after consuming this character?" This creates a new regex representing the remaining pattern.

We extend the basic `Ast` type to represent derivatives and nullability explicitly:

```moonbit
enum Exp {
  Nil
  Eps
  Chr(Char)
  Alt(Exp, Exp)
  Seq(Exp, Exp)
  Rep(Exp)
} derive(Show, Hash, Eq, Compare)
```

The constructors in `Exp` represent:

1. `Nil` represents an impossible pattern that can never match anything.
2. `Eps` matches the empty string.
3. `Chr(Char)` matches a single character.
4. `Alt(Exp, Exp)` represents alternation, providing choice between patterns.
5. `Seq(Exp, Exp)` represents concatenation of two patterns.
6. `Rep(Exp)` represents repetition of a pattern.

We use the `Exp::of_ast` function to convert the `Ast` into the more expressive `Exp` format:

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

We also provide smart constructors for `Exp` to simplify pattern building:

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

However, the smart constructor for `Alt` is strictly necessary—it ensures that the constructed `Exp` is normalized to "similarity" as mentioned in the original paper by Brzozowski. Two regexes are _similar_ if one can be reduced to the other by applying the following rules:

$$
  \begin{align}
    & A \mid \emptyset &&\rightarrow A \\
    & A \mid B &&\rightarrow B \mid A \\
    & A \mid (B \mid C) &&\rightarrow (A \mid B) \mid C
  \end{align}
$$

Therefore, we normalize the `Alt` construction to always use the same associativity and order of alternatives:

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

The `nullable` function determines if a pattern can match the empty string without consuming input:

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

The `deriv` function computes the derivative of a pattern with respect to a character, transforming the pattern based on the rules defined in the Brzozowski derivative. We have reordered the rules to match the order in the `deriv` function:

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

To simplify our implementation, we only perform strict matching—the pattern must match the entire input string. Therefore, we only check for nullability after the entire input has been consumed:

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

## Virtual Machine

The VM approach compiles regular expressions into bytecode instructions for a simple virtual machine. This method transforms the pattern-matching problem into program execution, where the VM simulates all possible paths through a non-deterministic finite automaton simultaneously.

Ken Thompson's 1968 paper described a regex engine that compiled patterns into IBM 7094 machine code. The key insight was to avoid exponential backtracking by maintaining multiple execution threads that advance through input in lockstep, processing one character at a time across all possible matching paths.

### Instruction Set and Program Representation

The VM operates on four fundamental instructions that correspond to NFA operations:

```moonbit
enum Ops {
  Done
  Char(Char)
  Jump(Int)
  Fork(Int)
} derive(Show)
```

Each instruction serves a specific purpose in NFA simulation. `Done` marks successful completion of pattern matching, equivalent to Thompson's original `match`. `Char(c)` consumes input character `c` and advances to the next instruction. `Jump(addr)` provides unconditional jump to instruction at address `addr` (Thompson's `jmp`). `Fork(addr)` creates two execution paths—one continues to the next instruction, another jumps to `addr` (Thompson's `split`).

The `Fork` instruction is crucial for handling non-determinism in patterns like alternation and repetition, where multiple execution paths must be explored simultaneously. This maps directly to NFA ε-transitions, where execution can spontaneously branch without consuming input.

We define a `Prg` that wraps an array of instructions with convenience methods for building and manipulating bytecode programs.

```moonbit
struct Prg(Array[Ops]) derive(Show)

fn Prg::push(self : Prg, inst : Ops) -> Unit {
  self.0.push(inst)
}

fn Prg::length(self : Prg) -> Int {
  self.0.length()
}

fn Prg::op_set(self : Prg, index : Int, inst : Ops) -> Unit {
  self.0[index] = inst
}
```

### AST Compilation to Bytecode

The `Prg::of_ast` function translates AST patterns into VM instructions using standard NFA construction techniques:

1. `Seq(a, b)`:

   ```plaintext
   code for a
   code for b
   ```

2. `Rep(a, None)` (unbounded repetition):

   ```plaintext
       Fork L1, L2
   L1: code for a
       Jump L1
   L2:
   ```

3. `Rep(a, Some(n))` (fixed repetition):

   ```plaintext
   code for a
   code for a
   ... (n times) ...
   ```

4. `Opt(a)` (optional):

   ```plaintext
       Fork L1, L2
   L1: code for a
   L2:
   ```

Note that the `Fork` constructor only accepts one address, because we always want to proceed to the next instruction after the `Fork`.

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

### VM Execution Loop

In Rob Pike's implementation, the VM executes one-past the end of the input string to handle the final acceptance state. To make this explicit, our `matches` function implements the core VM execution loop using a two-phase approach:

**Phase 1** handles character processing. For each input character, it processes all active threads in the current context. `Char` instructions that match the current character create new threads in the next context. `Jump` and `Fork` instructions immediately spawn new threads in the current context. After processing all threads, it swaps contexts and continues with the next character.

**Phase 2** handles final acceptance. After consuming all input, it processes remaining threads looking for `Done` instructions. It handles any final `Jump`/`Fork` instructions that don't consume input. It returns `true` if any thread reaches a `Done` instruction.

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

In the original blog post, Rob Pike uses a recursive function to handle `Fork` and `Jump` instructions so that threads are executed according to their priorities. Instead, we use a stack-like structure to manage all threads of execution, which naturally respects thread priority:

```moonbit
struct Ctx {
  deque : @deque.Deque[Int]
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

The `visit` array is used to drop low-priority threads. When a new thread is added, we first check if it is already in the `deque` using the `visit` array. If it is, we drop it; otherwise, we add it to the `deque` and mark it as visited. This mechanism is necessary to avoid infinite loops or exponential blowup when the regex contains patterns that can be expanded indefinitely, such as `(a?)*`.

## Benchmarks and Performance Analysis

The benchmark demonstrates both approaches on a pathological case that challenges many regex implementations:

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

This pattern `(a?){n}a{n}` represents a classical exponential blowup case for backtracking engines. The pattern allows n different ways to match n 'a' characters, creating exponential search spaces in naive implementations.

```plaintext
name     time (mean ± σ)         range (min … max)
derive     41.78 µs ±   0.14 µs    41.61 µs …  42.13 µs  in 10 ×   2359 runs
thompson   12.79 µs ±   0.04 µs    12.74 µs …  12.84 µs  in 10 ×   7815 runs
```

The benchmark results show that the VM approach is significantly faster than the derivative-based approach for this case. The derivative method frequently allocates intermediate regex structures, leading to higher overhead and slower performance. In contrast, the VM executes a fixed set of instructions and rarely allocates new structures once the deque grows to its full size.

However, the derivative approach is easier to reason about. We can easily prove termination of the algorithm, as the number of derivatives to be computed is bounded by the size of the AST and strictly decreases with each recursive application of the `deriv` function. The VM approach, on the other hand, can potentially run indefinitely if the input `Prg` contains infinite loops, and requires careful handling of thread priority to avoid infinite loops and exponential blowup in the number of threads.
