---
description: "MoonBit 0.9 introduces formal verification for AI-native workflows, enabling AI systems to generate code that is not just functional, but provably correct."
slug: moonbit-0-9-release
image: /img/blogs/2026-04-08-moonbit-0-9-release/cover.png
tags: [MoonBit, AI]
---

# MoonBit 0.9: Introducing First-Class Formal Verification

![](./cover.png)

As code generation accelerates, the central problem in software engineering becomes harder to ignore: how do we ensure that AI can generate large amounts of code while still keeping that code reliable and constrained by the properties it is supposed to satisfy?

Recently, the tech press reported on an AI-generated hosted application that looked complete on the surface, but contained serious flaws in authentication, access control, and database permissions. The result was a leak affecting tens of thousands of user records.

![](./lovable-security-report.png)

Related report: [The Register coverage](https://www.theregister.com/2026/02/27/lovable_app_vulnerabilities/)

The core issue exposed by this case is that an application can appear to work while the constraints that actually determine whether the system is trustworthy are neither clearly expressed nor systematically verified.

Testing and fuzzing still matter, but both depend on samples and coverage. They are not well suited to answering the stronger question: does the program always satisfy a critical property? On their own, they are still not enough to eliminate this class of problem at the root.

Formal proof offers a clearer path forward. Instead of approximating correctness through repeated testing, we can directly describe the properties a program must satisfy and automatically check whether the implementation really satisfies them. More importantly, as long as the underlying assumptions are sound, the proof process itself can also be generated at scale by AI.

One of the core advances in MoonBit 0.9 is a complete set of formal proof capabilities built for AI collaboration. It helps AI automatically construct nontrivial proofs, generate specifications, and verify whether implementations satisfy those specifications, providing a foundation for large-scale generation of high-quality, verifiable code. This is also the first breakthrough of its kind in this area.

<!--truncate-->

## Formal Verification in MoonBit: Writing Proofs Alongside Code

Take binary search as a classic example. Binary search looks simple, but it is famously easy to get wrong. In 2006, Joshua Bloch wrote about an integer overflow bug in the Java standard library implementation of binary search, a defect that had remained in production for nearly a decade before it was discovered.

![](./binary-search-verification.png)

The figure above shows a complete verification of binary search in MoonBit. On the left is the function implementation, annotated with contracts and loop invariants. On the right is the predicate definition file. At the bottom, the terminal output shows that verification succeeds completely.

### Contracts: Mathematical Promises Made by a Function

At the start of the function, `proof_requires(sorted(xs))` and `proof_ensures(binary_search_ok(xs, key, result))` form a contract between the function and the outside world. The caller promises that the input array is sorted. The function promises that the return value is correct: if it finds a result, that result really is the target element; if it returns nothing, then the target value truly does not appear in the array. These are not comments or documentation. They are constraints checked rigorously by the machine.

### Predicates: Removing Ambiguity with Mathematics

The `.mbtp` file on the right gives precise definitions for every concept that appears in the contract. For example, "sorted" is defined as: for any valid indices `i <= j`, `xs[i] <= xs[j]`. "Binary-search correctness" is defined as: when the function returns `Some(i)`, `xs[i]` equals the target value; when it returns `None`, no element in the array is equal to the target. Every concept is expressed with quantifiers and logical connectives, leaving no ambiguity for natural language to hide behind.

### Loop Invariants: The Bridge Between Code and Proof

The `proof_invariant` entries in the `where` block describe the properties that must remain true on every iteration of the loop: the search interval `[i, j)` always remains valid, every element to the left of the interval is smaller than the target, and every element to the right is larger than the target. These invariants are what turn an ordinary loop into an object that can be reasoned about step by step.

### How Verification Works

When the developer runs `moon prove`, the MoonBit toolchain translates the program logic and predicate definitions into constraint-solving problems and hands them to SMT solvers such as Z3 for automated verification. The solver checks, one by one, whether the loop invariants hold in the initial state, whether they are preserved after each iteration, and whether the postcondition follows when the loop terminates. What is being verified here is not that the program happens to return the right answer for a few inputs, but a mathematical proof that covers all possible inputs. In other words, for any sorted array of any length and any target value, this implementation of binary search satisfies its contract.

MoonBit can also use AI to help verify an AVL tree: [moonbit-community/verified/tree/main/avl](https://github.com/moonbit-community/verified/tree/main/avl)

This raises a more important question: if formal verification is itself too difficult, how can it ever become widely adopted?

## AI Can Write Proofs Too

The most intimidating part of formal verification is writing the proof itself. Loop invariants have to be chosen with great care: they must be strong enough to imply the postcondition, yet stable enough to remain true after every iteration.

One of MoonBit's key research directions is using AI to lower that barrier. In fact, much of the binary search and AVL-tree verification mentioned above, including loop invariants, predicate definitions, and the chain of guiding `proof_assert` statements, was generated with the assistance of AI agents. The developer provides the implementation and the intended contract; the AI proposes candidate invariants and intermediate assertions; then the theorem prover checks them with machine rigor.

This creates an elegant collaboration model: AI guesses, and the prover checks. The AI can be wrong. It may propose invariants that are too weak, or intermediate assertions that miss a necessary step. But incorrect guesses cannot pass the prover's review. The prover either confirms that each reasoning step is valid, or points out exactly which goal cannot be proved, allowing the AI to revise and try again. The final result is always something that has been mathematically verified, rather than something that merely sounds plausible because of AI hallucination.

Related repository: [moonbit-community/verified](https://github.com/moonbit-community/verified)

## Native, First-Class Formal Verification Built into the Language

Today, formal verification approaches fall broadly into two categories.

**Adding verification support to existing languages**, such as Frama-C for C, OpenJML for Java, and Creusot for Rust.

The advantage of these systems is that they can verify production code directly. But they face a structural problem: verification is separate from the language itself. Contracts and specifications are injected through comments or macros, effectively acting as external add-ons that the language cannot truly see. As a result, IDEs cannot understand verification annotations natively, so completion, navigation, and diagnostics require extra plugin support. Build systems do not know that verification exists, so developers must maintain a separate toolchain manually. And when the language evolves, verification tooling often lags behind by months or even years.

**Languages designed specifically for verification**, such as Microsoft's Dafny, Rocq (formerly Coq), and Lean.

These systems provide stronger verification capabilities and a more natural integration between language and proof. But they generally lack the ecosystem foundations of a general-purpose programming language: no mature package management, no broad third-party library ecosystem, and no large industrial user base. Rocq and Lean are highly expressive, but verifying an existing language such as C or Java requires rebuilding the semantics of that target language inside the prover, which is costly and difficult to maintain. Ada/SPARK is one of the few approaches with both industrial verification strength and real deployment history, but it is tied to the Ada ecosystem and has very little overlap with modern cloud-native and web development.

MoonBit takes a different path through **vertical integration**. Contracts, predicates, loop invariants, and `proof_assert` are all first-class parts of the language syntax, not second-class constructs hidden inside comments or macros. The compiler understands them directly. That means the IDE can provide syntax highlighting, autocomplete, type checking, and error locations for verification annotations in the same way it does for ordinary code. `moon prove` is a built-in command in the toolchain, standing alongside `moon build` and `moon test`, so developers do not need to configure a separate toolchain or switch workflows. From writing code, to writing proofs, to running verification, everything happens in the same language, the same IDE, and the same command line.

With AI further reducing the cost of writing proofs, MoonBit is trying to solve both historical problems at once: formal verification has been too hard to use, and too hard to learn. The goal is not only to make verification more powerful, but to make it genuinely usable for ordinary developers.

![](./moonbit-vertical-integration.png)

## Outlook

In this context, the meaning of formal verification is also changing. It is no longer just a specialized technique reserved for a tiny number of safety-critical systems. It is becoming a practical path toward more trustworthy software. Through language design, AI assistance, and toolchain integration, MoonBit aims to keep lowering the barrier to verification, making it more natural for expressing constraints, generating proofs, and checking results to become part of everyday development workflows. We hope that, as this capability matures, "proving code correct" can become as routine as writing tests and running builds.

Beyond formal verification, the 0.9 release also includes a range of other important updates. See [MoonBit v0.9 Release](/updates/2026/04/07/index) for the full release notes.
