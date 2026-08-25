---
description: "Learn how MoonBit's QuickCheck combines properties, generators, and shrinking to uncover bugs beyond example-based unit tests."
slug: property-based-testing-moonbit
image: /img/blogs/2026-08-25-property-based-testing-moonbit/cover.png
tags: [MoonBit]
---

# From Example Enumeration to Mechanized Falsification: Property-Based Testing in MoonBit

![](./cover.png)

#### Author: CAIMEO

## Introduction

Software testing is inherently asymmetric: a single counterexample is sufficient to prove that a program contains a bug, yet no matter how many passing test cases we accumulate, we can rarely deduce that the program is correct for all possible inputs. Traditional unit testing builds confidence by incrementally adding representative examples. While effective, this approach leaves developers with a fundamental question: *"Just how many examples do we need to write before it is enough?"*

Property-based testing (PBT) answers this question from a different view. Rather than enumerating concrete inputs and their expected outputs, it asks us to specify the **properties** that a program must universally satisfy: Does an operation preserve length? Does encoding followed by decoding reconstruct the original value? Do different implementations produce identical results? Does a data structure preserve its invariants across an arbitrary sequence of operations? QuickCheck then generates a barrage of inputs to repeatedly test these propositions, searching for a minimal counterexample whenever a property fails.

Readers familiar with formal verification will recognize this as a lightweight, pragmatic alternative to theorem proving: QuickCheck ultimately executes only a finite number of tests. The paradigm shift, however, is that our tests no longer define isolated points in the input space; they define invariants that govern the entire domain. A well-crafted property often takes just a few lines of code yet drives hundreds or thousands of test cases. When a test fails, shrinking distills the failure down to a minimal counterexample that often points directly to the root cause.

Recently, MoonBit's `core` library has embraced PBT extensively, uncovering several subtle issues that conventional unit tests easily miss: behavioral discrepancies of `BigInt` across different internal representations and backends, JSON parser edge cases around Unicode boundaries, `diff` operations generating edits that violate structural invariants, and `LazyList` losing stack safety under specific combinator compositions. Believing PBT to be an indispensable tool, this article introduces how to use this system in MoonBit, aiming to help you build more robust and reliable software.

## Tests That Describe Invariants

Suppose we implement an array reversal function `reverse` and write unit tests for `[]`, `[1]`, and `[1, 2, 3]`. All tests pass, and coverage reports even indicate 100% branch coverage. But how much confidence does this actually give us?

It merely shows that the program correctly handles the **handful of inputs we thought of**. Even if these tests exercise every code path, we still cannot deduce that `reverse(xs)` is correct for an arbitrary array `xs`. Code coverage tells us which lines were executed; it tells us nothing about whether those lines preserve the intended semantics across all possible inputs.

Fuzzing is a common technique that explores a program's state space by automatically generating vast amounts of random inputs, relying on crashes, assertions, sanitizers, or other test oracles to detect anomalies. In our case, however, fuzzing `reverse` for correctness is not straightforward. Suppose we have a data source capable of continuously generating random arrays `xs : Array[Int]`. We can certainly call:

```moonbit
let ys = reverse(xs)
```

The question is: once we obtain `ys`, what exactly should we assert? If we already have a known-correct reference implementation `reverse_`, the problem is simply solved:
$$
\operatorname{reverse}(xs) \stackrel{?}{=} \operatorname{reverse\_}(xs)
$$
This is differential testing. It is remarkably powerful, and we will revisit this idea later. In practice, however, such ready-made oracles are rarely available. More often than not, the function under test is the sole implementation; even if an alternative exists, it may be just as complex, offering no guarantee of correctness.

This highlights the fundamental limitation of traditional example-based testing: we constantly try to assert what exact output corresponds to a specific input ($f(x) \stackrel{?}{=} y$). Stripped of hardcoded expected values or reference implementations, testing hits a wall. The breakthrough lies in **changing the question**: for `reverse`, we might not know the exact output of reversing an arbitrary array in advance, but we know properties that are far more fundamental than concrete outputs. Regardless of what an array contains or how long it is, any correct `reverse` implementation must satisfy certain invariant laws:

1. **Length Preservation**: $\operatorname{len}(\operatorname{reverse}(xs)) = \operatorname{len}(xs)$
2. **Head-Tail Swap**: If the array is non-empty, $\operatorname{head}(\operatorname{reverse}(xs)) = \operatorname{last}(xs)$
3. **Involution**: $\operatorname{reverse}(\operatorname{reverse}(xs)) = xs$
4. **Anti-distributivity over Concatenation**: $\forall xs, ys,\operatorname{reverse}(xs \mathbin{+} ys) = \operatorname{reverse}(ys) \mathbin{+} \operatorname{reverse}(xs)$

These propositions share a key trait: instead of specifying the answer for a particular input, they describe **laws that must hold across all inputs**. Such laws are **Properties**.

For instance, the involution property translates almost verbatim into a MoonBit test:

```moonbit
test "reverse is involutory" {
  @qc.check((xs : Array[Int]) => {
    reverse(reverse(xs)) == xs
  })
}
```

Here, we never told QuickCheck whether to test `[1, 2, 3]` or `[0, 0, -1]`, nor did we supply an expected array. We simply stated a law: "Reversing any array `xs` twice yields the original array."

QuickCheck then generates a multitude of distinct `xs` values, evaluating this property repeatedly. The moment an input violates the equation, it flags a **counterexample** that disproves the proposition.

### Decomposing the Problem

In essence, Property-Based Testing decomposes testing into two distinct questions:

- **What invariants must the program universally satisfy?**
- **What data should be generated to challenge these invariants?**

The first question belongs to the **Property**, while the second belongs to the **Generator**. Both are indispensable: a rigorous property paired with a poor input distribution will never trigger edge-case bugs; a sophisticated generator paired with weak properties will churn through inputs without being able to judge correctness.

Of course, a single property is rarely enough to fully specify a function. For instance, the buggy implementation:

```moonbit
fn reverse(xs : Array[Int]) -> Array[Int] { xs.copy() }
```

also satisfies length preservation and involution. A property is part of a specification, and specifications can be under-constrained. In practice, we combine multiple orthogonal properties—and introduce reference implementations for differential testing when necessary—making it increasingly impossible for buggy code to slip through.

## Handing Invariants to QuickCheck

With properties in hand, the next step is running them with QuickCheck. The previous section's involution test demonstrates the most common entry point:

```moonbit
test "reverse is involutory" {
  @qc.check((xs : Array[Int]) => {
    reverse(reverse(xs)) == xs
  })
}
```

The core testing utilities reside in `moonbitlang/core/quickcheck` (referred to as `qc` hereafter). `@qc.check` accepts a property with the signature `(A) -> Bool`. Here, `A` is `Array[Int]`. We only define the passing criteria; QuickCheck takes care of generating the concrete test arrays. When a counterexample is found, `@qc.check` raises a failure and prints the offending input. If you require structured test output, use `@qc.report`.

To achieve this, the input type must implement several capabilities:

* `Arbitrary`: Instructs QuickCheck how to generate a random `A`;
* `Shrink`: Attempts to reduce a failing input to a simpler counterexample upon test failure;
* `Debug`: Handles formatting and printing the final counterexample.

QuickCheck provides built-in implementations for standard types like `Int`, `String`, and `Array`. Thus, in many cases, you can focus purely on writing properties without worrying about the mechanics of random generation.

The test flow can be conceptualized as follows:

![test-flow](./flow.png)

By default, this loop runs repeatedly. If all generated inputs satisfy the property, the test passes. If an iteration returns `false`, QuickCheck shrinks the counterexample along its structural decomposition to find the simplest failing case before reporting it.

Random does not mean irreproducibility. QuickCheck executions are deterministic when driven by a `seed`. A fixed seed guarantees reproducible runs, while `count`, `max_size`, and `max_shrinks` configure the number of test iterations, maximum input scale, and shrinking budget respectively:

```moonbit
@qc.check(
  (xs : Array[Int]) => reverse(reverse(xs)) == xs,
  count=500,
  max_size=200,
  seed=2026,
)
```

Some properties only hold under specific preconditions. For example, integer division $x / x = 1$ requires $x \neq 0$. Such conditions can be expressed via `filter`:

```moonbit
@qc.check(
  (x : Int) => x / x == 1,
  filter=x => x != 0,
)
```

Note that `filter` comes with a cost: if valid inputs are sparse, most generated values will be discarded. In such cases, rather than "generating randomly and filtering," it is far more efficient to design a dedicated generator that produces only valid inputs by construction.

## Where Do Properties Come From?

Once we know how to run properties, a practical question arises: **Where do we find these properties?** For `reverse`, involution feels obvious; but when faced with a real-world parser, collection, or numeric library, crisp mathematical identities are not always apparent. This is a common stumbling block in property-based testing: translating our intuition of "how things should work" into executable relations. A practical rule of thumb is: **Don't start with the test data; look for relations implicit in the specification.**

### Algebraic Laws

The most direct source of properties is the algebraic structure of the operations themselves—such as commutativity, associativity, identity, idempotence, and involution:

$$
\begin{aligned}
x + 0 &= x \\
a + b &= b + a \\
\operatorname{sort}(\operatorname{sort}(xs)) &= \operatorname{sort}(xs) \\
\operatorname{reverse}(\operatorname{reverse}(xs)) &= xs
\end{aligned}
$$

The advantage of algebraic properties is that they require virtually no external oracles. We simply invoke the same API in different ways and verify their expected mathematical relationships.

The same applies to set operations:

$$
\begin{aligned}
A \cup \varnothing &= A \\
A \cap A &= A \\
A \cup B &= B \cup A
\end{aligned}
$$

If an interface implicitly embodies an algebraic structure, these laws often form your first line of defense. Well-designed software naturally exhibits elegant algebraic properties.

### Round-tripping and Inverse Operations

Another ubiquitous pattern emerges from inverse operations:

$$
\begin{aligned}
\operatorname{decode}(\operatorname{encode}(x)) &= x \\
\operatorname{parse}(\operatorname{print}(x)) &= x \\
\operatorname{deserialize}(\operatorname{serialize}(x)) &= x
\end{aligned}
$$

These are known as round-trip properties. Instead of manually inspecting encoded strings or byte sequences, we simply assert that composing the inverse operations restores the original value:

```moonbit
@qc.check((xs : Bytes) => {
  decode(encode(xs)) == xs
})
```

This pattern is particularly well-suited for codecs, parsers, and serializers. Note, however, that these operations are not always symmetric. Parsers often tolerate multiple representations (e.g., whitespace formatting), meaning

$$
\operatorname{print}(\operatorname{parse}(s)) = s
$$

might not hold. A more robust formulation is:

$$
\operatorname{parse}(\operatorname{print}(\operatorname{parse}(s))) = \operatorname{parse}(s)
$$

### Trusted Oracles

When the exact output of a function is hard to describe declaratively, we can fall back to writing a reference implementation that is **obviously correct, even if inefficient**.

For instance, a complex sorting algorithm can be verified against a trivial insertion sort; an optimized edit-distance implementation can be checked against textbook 2D dynamic programming; fixed-width integer operations can be verified against arbitrary-precision `BigInt` calculations. The property then simplifies to:

$$
f_{\text{optimized}}(x) = f_{\text{reference}}(x)
$$

```moonbit
@qc.check((xs : Array[Int]) => {
  fast_sort(xs) == insertion_sort(xs)
})
```

While an $O(n^2)$ algorithm has no place in production, it is ideal in a testing context: test inputs can be kept relatively small, and simplicity ensures that the reference model won't reproduce the subtle bugs of the production code.

### Modeling Complex State with Simple Models

For stateful data structures like Queues, Maps, or Sets, single-call properties often fall short. Failures frequently manifest only after a long sequence of state mutations:

```
add -> add -> remove -> clear -> add -> ...
```

Here, we can maintain a simple reference model, applying randomly generated operations concurrently to both the real implementation and the model, asserting equivalent observable behavior at each step.

For example, when testing a `Queue`, an `Array` serves as a natural reference model:

```
Queue::push(x)    <-> Array::push(x)
Queue::pop()      <-> Array::shift()
Queue::peek()     <-> Array[0]
```

The model does not need to mirror the internal data layout of the actual Queue. On the contrary, the simpler and more decoupled the model, the better. The production implementation might use ring buffers, chunked lists, or persistent trees; the model only needs to capture interface semantics faithfully.

### Invariants

In scenarios lacking both simple invariants and trusted oracles, we can fall back to asserting **output invariants**.

For instance, a sorted array must at least:

* Preserve the original length;
* Be monotonically ordered;
* Contain the exact same elements as the input (permutation equivalence).

Similarly, a diff algorithm's edit script might not be unique, but we can verify that every edit has valid bounds, indices are continuous, and applying the edit script to the old text reconstructs the new text exactly.

This encapsulates the core philosophy of finding properties: **You don't always need to know what the exact correct answer looks like—you just need to know what a correct answer cannot violate.**

---

These strategies are not mutually exclusive. A robust test suite often combines algebraic laws, round-trips, reference models, and structural invariants to constrain an implementation from multiple angles. Ultimately, properties stem from specifications: once a specification is codified into an executable relationship, the machine can search for violations at scale.

## Principles of Generator Design

Having correct properties does not guarantee effective testing. An equally critical question is: **What kind of inputs are we actually generating?**

Uniform random sampling across the entire value space is straightforward, but it often yields poor distributions. Real-world bugs cluster around edge cases: boundary values, duplicate elements, extreme sizes, malformed encodings, or esoteric internal states reachable only via specific operation sequences. If these inputs have near-zero probability in a naive distribution, running tens of thousands of tests will still fail to discover them. Furthermore, uniform sampling over an infinite domain is mathematically impossible.

Therefore, generator design must encode domain insights:

* Skew distributions toward boundary and corner cases;
* Introduce correlations across multiple inputs rather than generating them independently;
* Generate valid structural invariants directly by construction, rather than relying on heavy filtering;
* Construct diverse construction paths and pathological shapes for complex data structures.

`diff` is a classic example. If we generate two random arrays independently, they will share almost no common elements, reducing the test to the trivial case: deleting the entire old array and inserting the entire new array.

A far more effective approach is to generate a base sequence and derive the second sequence through small perturbations: insertions, deletions, substitutions, and block moves. The inputs are then inherently correlated, stressing the algorithmic complexity of diff where it truly matters.

JSON testing faces similar pitfalls. A standard `String` generator emits valid Unicode sequences, meaning lone surrogates will never appear naturally. If we want to test parser robustness against malicious or malformed input, we must explicitly synthesize adversarial Unicode distributions.

### The `Arbitrary` Trait

Returning to MoonBit code: semantically, `Generator[T]` is a constructive computation parameterized by a size bound and a random state:

```moonbit
Generator[T] = (size: Int, rs: RandomState) -> T
```

The `size` parameter constrains recursion depth and data scale, preventing unbounded generation in recursive data structures. Combined with monadic combinators like `pure`, `map`, and `flat_map`, developers can compose complex sampling strategies bottom-up.

The `Arbitrary` trait lifts this generative capability to the type-system level. It associates a type `T` with a **canonical generator** and a shrinking strategy. The testing framework uses this to perform type-driven counterexample search without requiring manual generator plumbing.

For primitive scalar and container types (`Int`, `String`, `Array[T]`, etc.), the standard library provides built-in `Arbitrary` instances. For standard algebraic data types formed by products and sums, MoonBit supports structural auto-derivation via `derive(Arbitrary)`:

```moonbit
enum Color {
  Red
  Green
  Blue
} derive(Arbitrary)
```

Crucially, however: auto-derivation yields only a syntactically free distribution over the type's structure. When a data structure relies on deep representation invariants (such as ordered maps, red-black tree balance conditions, or canonical zero-representations in `BigInt`), an unconstrained free generator will produce semantically invalid values almost every time. In such cases, one must avoid compiler-derived instances and write custom generators to ensure the sample space is strictly confined to well-formed domains.

## Minimal Counterexamples and Shrinking Semantics

Random generation excels at **discovering** counterexamples, but raw failing inputs are often laden with incidental noise. For example, a 100-element random array might trigger an assertion failure, but the root cause might simply be unhandled duplicate values. Diagnosing the issue from a massive array is tedious. If the framework instead reduces the counterexample to `([0, 0], 0)`, the minimal case itself serves as an exact bug report. The role of shrinking is to navigate a predefined simplification lattice when a property fails, pinpointing the minimal counterexample that reproduces the defect.

```moonbit
// Buggy implementation that removes only the first occurrence
fn remove_all(xs : Array[Int], x : Int) -> Array[Int] {
  let result = xs.copy()
  guard result.search(x) is Some(i) else { result }
  result.remove(i) |> ignore
  result
}

test "remove_all removes every occurrence" {
  @qc.check((input : (Array[Int], Int)) => {
    let (xs, x) = input
    !remove_all(xs, x).contains(x)
  })
}
```

While QuickCheck might stumble upon a large array during initial sampling, the shrinker systematically prunes elements and steps numbers toward zero, swiftly converging to `([0, 0], 0)`.

### The `Shrink` Trait

In `core/quickcheck`, `trait Shrink` equips a type with candidate generation rules for transitioning toward "simpler" forms. Conceptually, a shrinker can be understood as a function producing an `Iter[A]`:

```moonbit
fn shrink(rep: A) -> Iter[A]
```

Likewise, the standard library comes with predefined shrinkers for common types:

* **Scalars**: Integers step toward `0`;
* **Containers**: Try removing sub-sequences first, then recursively shrink remaining elements;
* **Product Types**: Shrink components independently and cross-combine, composing naturally.

Shrinking is fundamentally a local greedy search bounded by a budget (e.g., `max_shrinks`). While it does not guarantee a globally minimal counterexample, it consistently yields low-noise, highly readable inputs. Shrinker design must also guarantee that generated candidates are **closed** under domain invariants:
$$
\forall x' \in \operatorname{shrink}(x) \implies \operatorname{Invariant}(x')
$$
If the system under test relies on structural constraints (such as BST ordering $\operatorname{isBST}(t)$ or sorted array monotonicity $x_0 \le x_1 \le \cdots \le x_n$), naive value substitution will violate well-formedness, degrading subsequent "failures" into invalid tests on illegal inputs. Shrinkers should therefore be designed in tandem with generators, taking structural invariants into explicit account.

### Failure Modes

Shrinking must preserve the **monotonic consistency of failure modes**. If a counterexample was originally triggered by a logical assertion failure (evaluating to `false`), but during shrinking a candidate triggers a division-by-zero error, the shrinker must reject that candidate. Otherwise, the original logical bug gets obscured by an unrelated runtime crash, derailing the debugging process. In QuickCheck, failure modes are categorized into:

1. **Semantic assertion failure** (Property evaluated to `false`)
2. **Runtime exception** (Property raised an unexpected error)

The shrinking engine strictly preserves the initial failure mode throughout minimization.

## QuickCheck in the Era of AI Agents

Evaluating algebraic invariants against random data incurs negligible compute overhead. Historically, the primary barrier to adopting QuickCheck has been formal specification design. Despite a wealth of excellent literature, papers, and blog posts on property design, the learning curve remains steep.

To write a meaningful property, developers must step away from imperative instruction flows and embrace equational reasoning—abstracting involutions, homomorphisms, or representation invariants from implementations; handcrafting inductive generators for domain constraints; or writing inefficient yet unambiguous denotational models for differential testing. Formulating formal specifications on a blank canvas imposes substantial cognitive friction on developers.

### Agent-Driven Test Synthesis

While many developers already use LLM agents to write unit tests, can we take this a step further and have agents synthesize properties and generators? Research indicates that LLMs possess strong statistical intuition for inductive algebraic patterns. Given a type signature and its core operations, a model can quickly propose intuitive property candidates: associativity, identity elimination, serialization round-tripping, and monotonicity. These free theorems serve as powerful invariants for testing system reliability; in other words, properties are readily searchable by LLMs.

As noted earlier, production implementations of complex data structures (like HAMTs, B-trees, or optimized `BigInt` representations) are packed with performance-oriented, state-mutating operations that destroy spatial locality, making their correctness hard to assess at a glance. The semantic baseline of such systems can often be expressed through an utterly naive, stateless, asymptotically inefficient—yet **semantically undeniable**—reference model. In the past, writing these naive reference implementations felt uneconomical. With AI agent assistance, synthesizing these models becomes remarkably cost-effective.

Generators can be constructed in similar fashion. An agent can analyze branches, constants, and data structures in the implementation to deduce high-value input domains: coverage boundaries, floating-point edge cases, duplicate elements, divergent construction paths, or correlated state sequences. It can also synthesize multiple generators for the same property, observe which distributions exercise target code paths, and iteratively refine weights and structures.

## Conclusion

Rather than spoon-feeding our programs a handful of hardcoded answers, we should specify the overarching laws they must obey and let the machine falsify them for us. Next time you write tests for a MoonBit module, try importing `moonbitlang/core/quickcheck` and see firsthand how property-based testing can elevate the reliability of your project.
