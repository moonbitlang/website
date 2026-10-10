---
description: "How MoonBit combines testing, formal verification, structured concurrency, and MoonX to support agent automation."
slug: building-agents-moonbit
image: /img/blogs/2026-10-10-building-agents-moonbit/cover.png
tags: [MoonBit, AI]
---

# Building Agents, MoonBit is all you need

![](./cover.png)

## Abstract

An agent is only as trustworthy as the substrate it operates on. To be given autonomy, an agent needs three things from its platform: an *objective* notion of success and failure, a feedback loop fast enough to stay inside its reasoning, and a boundary the operator controls so the agent's code can act without escaping its sandbox. MoonBit was designed for exactly this setting. It is an end-to-end programming language toolchain for cloud and edge computing across the `wasm`, `wasm-gc`, `js`, and `native` backends, with tests, proofs, structured concurrency, a script mode, and a sandbox at its center. This paper argues that these are not incidental features but the precise properties an agent platform needs ― and that MoonBit already provides them as first-class language features rather than bolted-on tooling.

## 1. What is MoonBit?

MoonBit is a programming language and an end-to-end toolchain built with AI in mind. It compiles to backends including `wasm`, `js`, and `native`. A project can therefore mix a wasm powered command line tool; an application powered by a native backend and a web frontend while sharing the same domain-model package. That range matters for agents: the same code the agent writes can run in a constrained environment or a full one, with the same toolchain and the same guarantees.

Crucially, MoonBit treats *validation* and *execution boundaries* as language-level concerns, not things the user assembles from external scripts. Tests, formal verification, structured concurrency, and sandboxed backends are all part of the platform, and the `moon` command exposes them uniformly.

## 2. What Does Agent Automation Require?

Three properties decide whether a platform can host autonomous work.

**It has to be reliable.** There should be clear, machine-checkable criteria for success and failure ― a correct/incorrect distinction that does not depend on a human reading prose. An agent that cannot tell whether it succeeded cannot improve, and cannot be trusted to act unattended.

**It has to be fast.** The platform must not lag the agent's development. If each edit‒run‒check cycle costs seconds of compilation, the agent spends its budget waiting instead of reasoning; if the cycle is quick, the agent can iterate the way a human developer does.

**It has to be sandbox-native and cross-platform.** The agent's code must be constrainable, and its behavior must be consistent across operating systems and across users. A platform that relies on OS-specific shell scripts is neither safe nor portable.

## 3. How MoonBit Meets These Requirements

### 3.1 Reliability: Feedback the Agent Can Use

MoonBit's reliability story is a ladder of increasing strength, so the agent (and the reviewer) can pick the right ring for the job.

- **Assertion tests.** A `test "name" { ... }` block has type `() -> Unit raise Error` and runs under `moon test`. Plain assertions (`assert_eq`, `assert_true`) fail loudly.

- **Snapshot tests.** For cases where hand-writing expected values is tedious, `inspect` records any `Show` value, `json_inspect` records a readable JSON rendering, and `@test.T::write` / `writeln` + `snapshot` capture the output into a file. All of these are inserted and refreshed mechanically by `moon test --update`, turning "what should this produce?" into a one-command answer.

- **Cram tests.** Integrated, transcript-style tests (`moon cram test`) pin the exact stdout, stderr, and exit status of a real command-line binary, so end-to-end CLI behavior becomes a durable fixture rather than a manual check.

- **Property tests.** Through `quickcheck` and `derive(Arbitrary)` / `derive(Shrink)`, random inputs exercise edge cases and shrink failures to minimal counterexamples ― the kind of coverage an agent rarely writes by hand.

- **Formal verification.** Beyond testing, MoonBit offers `moon prove`. Logic-side predicates live in `.mbtp` files; program-side functions carry preconditions, postconditions, loop invariants, and `proof_assert` steps; The package is lowered to the Why3 toolchain and obligations are discharged by SMT solvers: agents do not need to write sophiscated proof process. Correctness here is promised by mathematics rather than by test coverage.

Two further guarantees make concurrent code trustworthy. **Structured concurrency**: tasks can only be spawned inside a task group created by `@async.with_task_group`, and the group returns only after every child has terminated; if a child fails, siblings are cancelled and their cleanup runs, so orphan tasks cannot exist. **First-class cancellation**: every asynchronous operation is cancellable by default. It propagates automatically through asynchronous code, bypassing ordinary `catch` handlers while still running cleanup registered with `defer` and `errdefer`. Timeouts and other control-flow mechanisms can therefore compose without ordinary error handling accidentally swallowing cancellation.

Together, these give the agent a loop it can close on its own: run `moon check` or `moon test`, read a precise pass/fail, and fix what the compiler or tests name.

### 3.2 Speed: Keep the Development Loop Short

MoonBit's toolchain is tuned so that compilation does not lag development. Language features are added with caution, and those might drag the compilations are avoided.

Script mode removes ceremony entirely. A `.mbtx` file declares its imports inline and needs no module or package configuration, so a single file is a runnable program:


```text
---
import {
  "moonbitlang/async",
  "moonbitlang/async/shell",
}
---
///|
async fn main {
  let out = @shell.Cmd("moon", ["check", "--output-json"]).output()
  println(out.stdout())
}
```

Run it with `moonx script.mbtx`. The result is that writing MoonBit as a script feels almost as quick as writing an interpreted language ― while keeping a real type checker and the full platform behind it. For an agent that generates and re-generates code, that difference is the whole game.

### 3.3 Sandboxing and Portability: Control That Survives Composition

MoonBit's sandboxed backend (`wasm`) is the execution target for agent work, and the language reaches the real world through a portable surface. File IO, HTTP/HTTPS, sockets, and process spawning are provided with consistent APIs across targets. An agent therefore writes one program that reads files, makes a request, or runs a subprocess the same way on macOS, Linux, and Windows ― and is constrained the same way on each.

## 4. Two Ways to Empower Agents

There are two complementary measures, and the right one depends on how common the need is.

For **common, widely used needs**, we ship built software: vetted, published binaries the agent can simply call. The behavior is fixed, tested, and predictable, and the agent spends no tokens reinventing it.

For **narrow, specific cases and complicated jobs**, we let the agent write code that orchestrates existing tools and libraries. New problems are, almost by definition, not covered by the shipped catalog; here the agent's ability to compose the platform's primitives is what gives it reach.

Shipping a trusted catalog and allowing open-ended code generation together give breadth *and* control: the agent uses the built tool when one exists and writes a sandboxed program when one does not.

## 5. MoonX: One Entry Point, Two Execution Modes

MoonX unifies both measures behind a single tool with two modes of execution:

1. **Run published, built, sandboxed applications** ― the shipped "softwares," treated as commands.

2. **Run a single-file script in the sandbox** ― agent-authored `.mbtx` code, executed under the same constraints.

One entry point means one mental model for the agent and one policy surface for the operator. Because both modes run on the sandboxed backends and go through the same portable IO layer, we expect more stable behavior across different operating systems and fast execution ― the two properties that made the sandbox requirement worth having in the first place. The recursively applied policy also makes sure that within the process tree constructed by the script and sandboxed applications, there shall be no escape.

## 6. Conclusion

MoonBit connects the capabilities that agent automation depends on.

Testing and verification provide actionable feedback. Structured concurrency and first-class cancellation give asynchronous work predictable lifetimes. Fast compilation and single-file scripts support short development cycles. Sandboxed execution and portable interfaces keep generated programs useful across environments while preserving operator control.

MoonX makes this platform available through one entry point: run the tool that already exists, or write the program the task requires.

For building agents, MoonBit is all you need.
