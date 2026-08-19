# 20260819 MoonBit v0.10.9 Release

**moonc version:** `v0.10.9`

## Language Updates

1. `with`-patterns now require explicit parentheses around branches that use `with`, making the precedence of `with`-patterns easier for readers to understand. Users can migrate automatically with `moon fmt`:

    ```moonbit
    fn main {
      let a = Some("hello")
      match a {
        Some(x) | (None with x = "") => println(x)
        //        ^~~~~~~~~~~~~~~~~~ parentheses required here
      }
    }
    ```

2. Bitstring patterns now support `v128le`, which extracts 16 bytes at once from a byte sequence and constructs a `V128` value. Currently only byte-granularity little-endian extraction is supported, i.e. byte 0 of the input maps to the least significant byte of the result:

    ```moonbit
    fn main {
      let bits = Bytes::makei(16, i => i.to_byte())
      guard! bits is [v128le(bits), ..]
      println(bits) // prints V128(0x0706050403020100, 0x0f0e0d0c0b0a0908)
    }
    ```

3. `lexscan` is now officially stable.

    - `lexscan` supports `@lexbuf.Lexbuf`, `@lexbuf.AsyncLexbuf`, and `@lexbuf.StringScanner`. `Lexbuf` and `AsyncLexbuf` operate in streaming mode; we have optimized their memory usage, so you can safely use them on infinite streams.

    - The previous `lexscan` on `String/StringView` has been migrated to the `lexmatch` keyword.

    - A catch-all case is no longer required when it is provably unreachable, and the compiler now reports warnings for unreachable cases.

    ```moonbit
    ///|
    async fn wordcount(
      input : @lexbuf.AsyncLexbuf,
      lines : Int,
      words : Int,
      chars : Int,
    ) -> (Int, Int, Int) {
      lexscan input {
        re"^\n" => wordcount(input, lines + 1, words, chars + 1)
        re"^[^ \t\r\n]+" as word =>
          wordcount(input, lines, words + 1, chars + word.length())
        re"^." => wordcount(input, lines, words, chars + 1)
        re"^" => (lines, words, chars)
      }
    }

    ///|
    async fn main {
      let utf8_reader = Utf8Reader(() => @stdio.stdin.read_some())
      let lexbuf = @lexbuf.AsyncLexbuf::from_fn(() => utf8_reader.read())
      let (lines, words, chars) = wordcount(lexbuf, 0, 0, 0)
      println("lines: \{lines}, words: \{words}, chars: \{chars}")
    }
    ```

    For details, see the documentation:

    - https://docs.moonbitlang.com/en/latest/language/fundamentals.html#lexmatch

    - https://docs.moonbitlang.com/en/latest/language/fundamentals.html#lexscan

4. Introduced the new `errdefer` syntax:

    ```text
    errdefer expr
    rest
    ```

    If `rest` raises an error, or is cancelled while running async code, the `errdefer` statement will be triggered, executing `expr`. The error will then be re-raised. `errdefer` is especially useful for constructor-style functions, for example:

    ```moonbit
    async fn connect_to(addr : @socket.Addr) -> Tcp {
      let socket = make_tcp_socket()
      errdefer socket.close()
      connect_socket(socket)
      socket
    }
    ```

    Here, if `connect_to` returns normally, ownership of `socket` is transferred to the caller through the return value, so `socket` should not be released. But if `connect_socket(socket)` raises an error or is cancelled, `socket` will not be returned. In this case, `socket` should be released to avoid a resource leak. `errdefer` handles this kind of resource cleanup robustly.

    Leaving the scope of an `errdefer` via `return`/`break`/`continue` does not trigger it. Like `defer`, `errdefer` is structured: it only fires when the program leaves the scope of the entire `errdefer` expression. So the following program is wrong:

    ```moonbit
    let result = []
    for x in xs {
      let res = make_resource(x)
      errdefer res.close()
      do_something_with_res(res)
      result.push(res)
    }
    result
    ```

    Here, each `errdefer` only covers the single loop iteration it belongs to. After the first iteration completes, the program has left the scope of that iteration's `errdefer` normally, so that `errdefer` will never fire again. If the second iteration then fails, only the second iteration's own `errdefer` fires, and the result of the first iteration leaks. The correct version is:

    ```moonbit
    let result = []
    errdefer result.each(res => res.close())
    for x in xs {
      let res = make_resource(x)
      do_something_with_res(res)
      result.push(res)
    }
    result
    ```

5. `defer` and `errdefer` now support `raise` and `async`. Previously, the `expr` in `defer expr` could not raise errors or call async code. This restriction has been lifted. If an error is raised inside a `defer`/`errdefer`, the new error replaces the old one. When there are multiple `defer`/`errdefer` statements and one of them raises, the remaining ones still execute in order and are not discarded.

6. Added a new warning for migrating `catch` to `defer`/`errdefer`.

    Currently, in `moonbitlang/async`, a cancelled async program raises a special error as the cancellation signal, so that the cancelled program can release its resources. But this special error can be accidentally caught or transformed, causing the program to misbehave when cancelled. In the future, we plan to stop using a special error to represent the cancellation signal, and make `catch` no longer catch it. However, if a program relies on `catch` to perform resource cleanup, this change would prevent it from releasing resources correctly on cancellation. That is why we introduced `errdefer` and lifted the side-effect restrictions on `defer`: nearly all resource-release code can now be expressed with `defer`/`errdefer` (and the cancellation signal will continue to trigger `defer` and `errdefer` in the future).

    To help users migrate existing `catch`-based resource-release code, we provide a new warning, `fragile_catch_all`. It identifies `catch` expressions that could likely be rewritten as `defer`/`errdefer` and emits a warning prompting migration. Besides handling async cancellation correctly in the future, `defer`/`errdefer` are also more readable and robust than `catch`.

    This new warning may produce false positives. If that happens, you can temporarily disable it for the current function with `#warnings("-fragile_catch_all")`.

7. `guard` now performs exhaustiveness checking and warns on non-exhaustive patterns. Users who want the previous panic-on-no-match semantics should migrate to `guard!` to state that intent explicitly.

    ```moonbit
    fn main {
      let string = Some("content")
      guard string is Some(content)
      //    ^~~~~~ Warning (guard_inexhaustive):
      //               This `guard` pattern is not exhaustive and will panic when
      //               it does not match. Missing cases:
      //               None
      //               To fix: add an `else { ... }` clause after the condition to
      //               handle those cases, or write `guard!` if the panic is intended.
      guard! string is Some(content) // the recommended new form
      println(content)
    }
    ```

8. Labelled blocks are now supported. Once a block is labelled, you can use `break` with a value inside it to exit early, and that value becomes the result of the whole block.

    ```moonbit
    fn absolute(n : Int) -> Int {
      result~: {
        if n < 0 {
          break result~ (-n)
        }
        n
      }
    }
    ```

    Note that labelled blocks have no anonymous form: an unlabelled `break` always targets the nearest loop, never a block. To avoid ambiguity, MoonBit specifies that an unlabelled `break` appearing directly inside a labelled block is always an error, even when there is indeed an enclosing loop it could break out of. In that case you must use a label to state explicitly which layer of control flow to exit.

    ```moonbit
    fn f() -> Int {
      for ;; {
        label~: {
          break 1
    //    ^^^^^^^ An unlabelled `break` is not allowed directly inside a labelled block.
        }
      }
    }
    ```

9. Added a new reserved word: `nocancel`.

10. `#warnings` now also works on syntax warnings. Previously, `#warnings` could only suppress warnings from the type-checking phase; some syntax warnings, such as `deprecated_syntax`, could not be disabled through `#warnings`. This has been fixed: `#warnings` can now locally suppress most warnings, including syntax warnings. A few warnings that span top-level definitions, as well as lexical warnings, still cannot be suppressed with `#warnings`.

## Toolchain Updates

1. The default target is now `wasm`.

2. `moon prove` now works out of the box as long as at least one supported solver (Z3 / Alt-Ergo / CVC5) is installed; a separate Why3 installation is no longer required. Correspondingly, Why3's `data-dir` and `lib-dir` can no longer be specified via environment variables; they are always read from `~/.moon/share/why3/` and `~/.moon/lib/why3/`.

3. You can now run executables from mooncakes.io with `moonx username/example[@version]` (executed on the WASM backend by default; pass `--target native` to run on the native backend):

    ```bash
    $ moonx moonbit-community/moongrep
    error: the following required argument was not provided: 'subcommand'

    Usage: moongrep <command>

    Scan MoonBit source files with structural and taint rules.

    Commands:
      scan  Scan MoonBit source files.
      lint  Scan MoonBit source files with embedded builtin rules.
      docs  Print embedded moongrep documentation.
      dump  Parse a MoonBit impl or expression and print untyped_ast debug output.
      help  Print help for the subcommand(s).

    Options:
      -h, --help  Show help information.
    ```

4. Added support for `.moonignore` files.

    - Previously, whether files were included or excluded when publishing to mooncakes.io was configured by `.gitignore` plus the `"exclude"` and `"include"` fields in `moon.mod`, which was somewhat cumbersome.

    - Packaging now follows conventional ignore-file rules: the `.moonignore` in a folder — or, if absent, `.gitignore` — is used as the ignore file.

    - By default, files and folders starting with `.` are ignored (this rule can be overridden via the ignore file), as is the `_build` folder (not overridable).

    - The `"exclude"` and `"include"` fields in `moon.mod` will be deprecated.

5. mooncakes.io previously allowed uploading packages whose names differ only in case (e.g. `user/pkga` and `user/pkgA`). This causes problems on case-insensitive platforms, so mooncakes.io no longer allows uploading packages that differ only in case.

## Standard Library Updates

1. `moonbitlang/core`

    - QuickCheck updates

        - Two main testing entry points are now provided: `@qc.check` (raises an error on failure, and prints nothing extra on success) and `@qc.report` (returns a structured test report). Users can pass a function `(A) -> Bool raise?` for property-based testing.

        - You can pass a `filter?: (A) -> Bool` parameter to the test functions to filter out generated values that do not meet requirements; the `discard_ratio` parameter controls at what proportion of discarded values the test fails.

        - The `@qc.Generator[T]` type and related functions provide a set of common combinators to help build `Arbitrary` instances.

        - The `core/quickcheck/shrink` package provides `Shrinker`s for most common types; once a counterexample is found, it can be shrunk to search for a smaller, simpler counterexample.

        - Statistical analysis is supported: you can pass an observation combinator `(A) -> Observation` to `check` / `report` via the `observe?` parameter, where an `Observation` can be constructed with the following functions:

            - `@qc.label(val: String)` attaches a string label

            - `@qc.classify(cond: Bool, val: String)` attaches the label `val` when the condition `cond` holds

            - `@qc.collect(val : T)` uses a value's debug representation as the label

        - For more details, see the documentation: https://mooncakes.io/docs/moonbitlang/core/quickcheck

    - New `moonbitlang/core/diff` package

        - Provides two general-purpose sequence diff algorithms, Myers and Patience. Users can obtain the edit script between two sequences via `@diff.Diff(old~, new~).edits()`.

        - Provides several functions for computing edit distances between sequences — `edit_distance(ArrayView[T])`, `edit_distance_str(StringView)` — along with variants that cap the maximum edit distance.

    - New `moonbitlang/core/lexbuf` package, providing `StringScanner`, `Lexbuf`, and `AsyncLexbuf` for use with `lexscan`.

        - `StringScanner`: a synchronous `String`-based scanner; `lexscan` maintains the `cursor` field on the scanner.

        - `Lexbuf`/`AsyncLexbuf`: streaming scanners whose data source is defined via `Lexbuf::from_fn`; they refill automatically during `lexscan`. The difference between the two is that a `lexscan` expression over an `AsyncLexbuf` requires an async context as a whole.

    - The `immut/array` package, deprecated for a long time, has now been formally removed; use `immut/vector` instead.

    - `@debug.to_repr(x)` is deprecated; use `@debug.Repr(x)` instead.

2. `moonbitlang/async` is now at 0.21.0. The main updates since the last monthly report (0.20.2) are:

- **[breaking]** In the `@http` package, the type of HTTP headers changed from `Map[String, String]` to the case-insensitive `type @http.Headers = Map[@http.CaseInsensitiveString, String]`, so you no longer need to handle case-folding manually when constructing or reading HTTP headers.

    `@http.CaseInsensitiveString` can be implicitly constructed from `String`, so code that builds headers with `Map` literals or reads headers needs no changes.

    Code that wrote explicit type annotations for headers must change the type to `@http.Headers`.

- **[breaking]** The `create` and `truncate` parameters of `@fs.open` and related APIs had been deprecated for a while, replaced by `create_mode` and `permission`.

    In this release, `create` and `truncate` are completely removed.

    In addition, the default `create_mode` of `@fs.write_file` and `@process.redirect_to_file` changed from `OpenExisting` to `CreateOrTruncate`.

    The default `create_mode` of `@fs.open` remains `OpenExisting`.

- **[breaking]** The default behavior of `@async.protect_from_cancel` is now `resume_on_cancel=true`, and the `resume_on_cancel=false` option is deprecated.

    Going forward, only the `resume_on_cancel=true` behavior will exist.

    In `moonbitlang/async`, cancellation is implemented by the runtime as a persistent attribute attached to each task.

    Once a task is cancelled, it remains cancelled until it finishes, and users cannot revoke that state.

    To help cancelled code release resources, the runtime notifies it with a special error, triggering `defer` etc.

    However, catching this cancellation signal does not change the fact that the current task is cancelled.

    When cancelled, `protect_from_cancel(resume_on_cancel=false)` guarantees the inner code runs to completion, then discards its result and raises the cancellation signal.

    This is unsafe because the discarded result can lead to resource leaks.

    `protect_from_cancel(resume_on_cancel=true)` does swallow the cancellation signal, but it does not affect the cancelled state of the current task: the next async operation after it will still be cancelled, which makes `resume_on_cancel=true` the more sensible behavior.

    For most user code, this behavior change has no substantive impact.

---

- `moonbitlang/async` now automatically detects deadlocks (e.g. two tasks waiting on each other) and forcibly terminates the program, preventing the event loop from spinning idly forever.

    You can use `@async.set_deadlock_handler` to control the behavior on deadlock or to disable deadlock detection.

- Previously, `moonbitlang/async` had to run its own event loop on the main thread, so it could not integrate with external event loops, such as those that ship with GUI frameworks.

    This update adds the `@async.set_external_event_loop` API for installing an external event loop.

    `moonbitlang/async` will run its own event loop on a separate thread and integrate it with the external loop on the main thread.

    All MoonBit code still runs on the main thread.

    For the APIs an external event loop implementation must provide to `moonbitlang/async`, see the documentation of `@async.set_external_event_loop`.

- Added `@process.pipe`, which redirects the output of one child process into the input of another.

- `@process.read_from_process` and `@process.redirect_to_file` gained a `shared? : Bool = false` parameter.

    With `shared=true`, the output pipe used for redirection can be passed to multiple child processes at the same time, but it must be closed manually with `.close()` after the last child process has started.

    With `shared=false` (the default and previous behavior), the output pipe can only be passed to a single child process (though it may be passed to both `stdout` and `stderr` of that same process), and needs no manual close.

- Added the helper function `@http.request` for performing a single HTTP request with an arbitrary method.

- The Wasm1 backend gained `@websocket` and `@fs.realpath` support; it now supports all functionality except `@fs.Watcher`.

- On Linux/macOS, when a child process is terminated by a signal rather than exiting normally, APIs such as `@process.run` recognize this and return `-signal`.

- Previously, when an `async fn main` program was cancelled by a signal, it would exit with `128 + signal` as its exit code after releasing resources (the bash convention).

    But this is ambiguous to the parent process.

    Now, when cancelled by a signal, `async fn main` finishes cleanup and then re-simulates the state of the current process being forcibly terminated by that signal as the program's exit status.

3. `moonbitlang/x`

    - Deprecated `moonbitlang/sys`; use `moonbitlang/core/env` instead.

    - `moonbitlang/x/path` now works correctly in browser environments, and Windows path comparison now correctly handles non-ASCII characters that have case forms.

    - `moonbitlang/x/rational` no longer suffers from overflow misjudgments or zero-denominator issues.
