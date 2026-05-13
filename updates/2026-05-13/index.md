# 20260513 MoonBit v0.9.2 Release

**moonc version:** `v0.9.2+bbe2b338f`

## Language Updates

1. **New list comprehension syntax:**

    ```moonbit
    // Use `if` to filter elements
    let even_numbers = [
      for i in 0..<100 if i % 2 == 0 => i
    ]

    // When creating an `Iter`, you can create infinite sequences
    let fib_numbers : Iter[Int] = [
      for p1 = 1, p2 = 0;; p1 = p1 + p2, p2 = p1 => p1
    ]
    ```

    The syntax is `[ for .. => <body> ]`. An optional `if <guard>` can be added before `=>` to filter elements. The `is` pattern can be used inside the guard to bind variables, and these bound variables can be used in the body. All forms of `for` loops, including `for .. in` loops and regular `for` loops, can be used in list comprehensions.

    List comprehensions can construct all built-in array-like types, including `Array`/`FixedArray`/`ReadOnlyArray`/`Bytes`/`String` and their corresponding view types. In addition, list comprehensions can be used to construct `Iter` types, in which case the entire sequence is lazily evaluated — elements are only computed when the `Iter` reaches the corresponding element, allowing infinite sequences to be created. The specific type constructed by a list comprehension expression is determined by the context type, and can be explicitly controlled via type annotation.

    The body of a list comprehension currently does not support any control flow operations, including `return`/`break`/`continue`, throwing errors, or async operations.

2. **Support constructing `Iter` types from array literals.**

    Now, when an array literal's expected type can be `Iter`, it becomes an iterator containing the corresponding elements. Elements in the literal are still evaluated immediately when constructing the literal, rather than being wrapped in an `Iter` for lazy evaluation. Therefore, the evaluation order of array literals does not implicitly change with the type.

3. **Adjusted evaluation order when constructing `Iter` via array spread.**

    The array spread syntax `[ a, ..it, b ]` previously supported constructing `Iter` types, but the previous semantics had unnatural evaluation order. Specifically, side effects inside the iterator corresponding to `it` were computed immediately during literal construction, rather than lazily. This made the array spread syntax unable to combine potentially infinite iterators.

    Now, taking `([a, ..it, b] : Iter[_])` as an example, the evaluation order for array spread constructing iterators is:

    - Expressions `a`, `it`, and `b` are immediately evaluated left-to-right when constructing the iterator

    - Side effects inside iterator `it` are only triggered when the corresponding element is traversed

4. **Custom struct constructors have been adjusted and simplified.**

    The new syntax is as follows:

    ```moonbit
    struct Point {
      x : Int
      y : Int
      // Nothing else needs to be written inside the struct
    }

    fn Point::Point(x : Int, y : Int) -> Point {
      { x, y }
    }

    test {
     let _ = Point(1, 2)
    }
    ```

    Compared to the old syntax, the new syntax no longer requires writing the constructor signature twice, and no longer requires defining a `new` method to implement the constructor — it's simpler both syntactically and semantically. For library authors who want to provide a constructor while preserving `new`, they can annotate `#alias(new)` on the `fn Type::Type` declaration, or use `#alias(new, deprecated)`/`#alias(new, deprecated="msg")` to deprecate the `new` method to support downstream migration.

    The old custom constructor syntax is currently retained, but the compiler will issue deprecation warnings for it. The old syntax will be removed in the near future.

5. **Added extensible enums.**

    Extensible enums are primarily used to allow other packages to extend new constructors for enums in the current package. For example, here in the `base` package, the `extenum` keyword is used to declare the `LogEvent` type, indicating that it can be extended:

    ```moonbit
    // base package
    pub(all) extenum LogEvent[T] {
      Info(T)
      Warning(T)
    }
    ```

    In the `plugin` package, the `extenum` and `+=` keywords can be used to extend the `LogEvent` type from the `base` package — here adding a new `Debug` constructor:

    ```moonbit
    // plugin package — extends a type from another package!
    pub(all) extenum @base.LogEvent[T] += {
      Debug(T)
    }
    ```

    In the `app` package, pattern matching on the `@base.LogEvent` type can match constructors from both the `base` package and the `plugin` package. When matching constructors, the `@pkg.C` syntax is required to distinguish constructors from different packages. Since the `LogEvent` type is extensible, a wildcard must be used to ensure exhaustiveness:

    ```moonbit
    // app package — both variants share one type
    fn[T : Show] use_event(event : @base.LogEvent[T]) -> String {
      match event {
        @base.Info(msg)    => "info: \{msg}"
        @base.Warning(msg) => "warn: \{msg}"
        @plugin.Debug(msg) => "debug: \{msg}"
        _                  => "unknown"
      }
    }
    ```

6. **Added `E::@pkg.C` syntax.**

    This syntax is primarily used to support the extensible enums mentioned above. Since regular enums guarantee that the type and constructors come from the same package, the above syntax is equivalent to `@pkg.E::C`. However, considering extensible enums, types and constructors may come from different packages, so explicitly indicating which package a constructor comes from becomes necessary.

    After supporting this syntax, constructor syntax can be summarized into the following four cases:

    - `C` — Constructor declared in the current package

    - `@pkg.C` — Constructor declared in package `pkg`

    - `@pkg.E::C` — If `E` is a regular enum, both `E` and `C` come from `@pkg`; if it's an extensible enum, `E` comes from `pkg` while `C` comes from the current package

    - `@pkg1.E::@pkg2.C` — `E` and `C` come from `@pkg1` and `@pkg2` respectively

7. **Reverse pipe syntax `<|` now supports method calls:**

    ```moonbit
    obj.method(args) <| last_arg
    obj.method() <| last_arg
    obj.method(args) <| (x) => {
      x.do_something()
    }
    ```

    Note that when there's only the `final_arg` parameter, the left side of `<|` must still be written as `obj.method()`, and cannot be written directly as `obj.method <| final_arg`.

8. **The update part of `for` loops can now use variables introduced by the condition part.** For example:

    ```moonbit
    for sum = 0; queue.next() is Some(elem); sum = sum + elem {
    //                                       ^^^^^^ elem can be used here now
    } nobreak {
      sum
    }
    ```

9. **The following long-deprecated old syntax has been removed:**

    - Old `newtype` syntax `type T UnderlyingType`; the new syntax is `struct T(UnderlyingType)`

    - Multiple consecutive local `fn` declarations can no longer be mutually recursive. Mutually recursive local functions need to use `letrec f = .. and g = ..`

## Toolchain Updates

1. **Workspace now uses preferred target.**

    For commands that apply globally to the workspace, such as `moon build`, `moon check`, `moon test`, each workspace member will be operated on using its declared `preferred-target`. This way, mixed projects, such as integrated frontend-backend projects, can complete checking, building, testing, etc., with a single command.

2. **Added `moon run -c` functionality.**

    `moon run -c <script>` allows direct execution of temporary scripts, for example:

    ```moonbit
    $ moon run -c 'fn main { println("hello") }'
    hello
    ```

3. **`moon run` now resolves projects starting from a selected path.**

    Typically, we use a local project as a tool. In such cases, the source code path differs from the working path. Previously, `moon run` had to be executed inside the project, or required an additional `--manifest-path`. This restriction has now been lifted to simplify usage.

4. **Deprecated `--manifest-path`.**

    As mentioned above, `--manifest-path` was used in cases where the source code path differs from the working path, typically only appearing in `moon run` scenarios. Since the restriction on `moon run` has been lifted, this parameter is no longer necessary.

5. **Experimental `moon.mod` configuration.**

    `moon.mod` is an experimental module configuration file used to replace `moon.mod.json`, providing a writing experience consistent with `moon.pkg`. The build system currently supports `moon.mod`, while LSP support is still being adapted.

    ```moonbit
    // Module name
    name = "moonbit-community/mod"
    // Version
    version = "0.1.0"
    // Module dependencies
    import {
      "moonbitlang/async@0.19.0",
      "moonbitlang/x@0.4.43",
    }

    // Other original configuration
    options(
      readme: "README.mbt.md",
      repository: "",
      license: "Apache-2.0",
      keywords: [ "keyword1", "keyword2" ],
      ...
      description: "",
    )
    ```

    The new `moon.mod` deprecates local dependency configuration, recommending `moon.work` as a replacement.

    Projects using the old configuration are unaffected, and currently no migration is performed by default. You can set the environment variable `NEW_MOON_MOD=1` to let `moon` automatically migrate old `moon.mod.json` configurations to the new `moon.mod`.

6. **Build system `rule`/`dev_build` configuration.**

    The build system has deprecated the previous `options("pre-build": ...)` configuration in `moon.pkg`. The improved configuration is as follows:

    ```moonbit
    // Define rule1
    rule(name: "rule1", command: "exe $input -o $output")
    // Use rule1, setting the input and output to use
    dev_build(rule: "rule1", input: "input.txt", output: "output.mbt")
    ```

    Rules defined in `moon.pkg` are only visible within the same configuration. Rules can also be added to the new `moon.mod`, in which case the rule can be used by all `moon.pkg` files in the entire project, reducing configuration duplication.

7. **Added native LSP.**

    This is the MoonBit LSP we've reimplemented in OCaml, compiled directly to binary, planned to replace the current TS-implemented LSP in the future. Use it via `moon lsp`. VSCode plugin users can use it by setting `"moonbit.nativeLsp": true`. We welcome everyone to try it and provide feedback.

8. **Added `MOON_WORK` environment variable** to specify the location of the `moon.work` file, or use `MOON_WORK=off` to disable workspace behavior.

## Standard Library Updates

1. **Deprecation and migration of `Show`-related implementations.**

    We are migrating debug interfaces for most container types from `Show` to `Debug`. `Debug` aims to provide a better debugging experience: it generates structured, indented, human-readable information for data structures. The `Show` trait will focus on generating strings in specific formats, such as having the `Json` type directly output JSON-formatted text. Distinguishing between `Show` and `Debug` also avoids accidentally using unprocessed data in string interpolation.

    This update:

    - Deprecates `Show` implementations for standard library container types, including tuples, `Array`, `Map`, `Set`, `Option`, `Result`

    - Changes the behavior of `Show::output` regarding the `String` and `Char` types

    `Show::output` previously behaved differently from `Show::to_string` when handling `String` and `Char`: it would process the contents of strings and characters, outputting text with quotes and escape sequences. After the change, `Show::output` is consistent with `Show::to_string`, and both `String` and `Char` are output as-is. For example:

    ```moonbit
    // Old behavior
    assert_eq(Show::output("\n"), "\"\\n\"")
    assert_eq(Show::output('\n'), "'\\n'")
    assert_eq(Show::to_string("\n"), "\n")
    assert_eq(Show::to_string('\n'), "\n")
    // Current behavior
    assert_eq(Show::output("\n"), "\n")
    assert_eq(Show::output('\n'), "\n")
    assert_eq(Show::to_string("\n"), "\n")
    assert_eq(Show::to_string('\n'), "\n")
    ```

    When migrating, use `Debug` for test snapshots, test assertions, and log-like output.

    Some common cases can be migrated as follows:

    - For custom types, use `derive(Debug)` to generate the implementation. Only manually implement `Show` when the type has a meaningful specific text representation, such as the `Json` type, `Html` type, or `SqlStatement` type.

    - Use `debug_inspect(value, content=...)` instead of `inspect(value, content=...)`

    - Use `@debug.assert_eq(a, b)` instead of `assert_eq(a, b)`

    - In interpolation, `"\{x}"` will insert the result from `Show`; `"\{to_repr(x)}"` will insert the result from `Debug`. In most debugging scenarios, you need to use `to_repr`.

    - Use `@debug.to_string(value)` instead of `value.to_string()`, provided the string is only used for debugging.

2. **`moonbitlang/async` is now at version v0.19.0.** The main new features and API changes since the last monthly report (v0.17.0) are as follows:

    - Added the `moonbitlang/async/gzip` package, which can apply gzip decompression/compression transformations to any reader/writer

    - The `moonbitlang/async/tls` package added the following features:

        - The `get_peer_certificate` method allows users to obtain the server certificate in DER format on the client side

        - The `unique_channel_binding` and `server_endpoint_channel_binding` methods can be used to obtain the two types of TLS channel binding data defined in RFC 5929

        - The `verify` parameter of `@tls.Tls::client` has been deprecated, replaced by the `trust? : TrustedRoot` parameter. `TrustedRoot::SystemRoot` and `TrustedRoot::NoVerification` correspond to the original `verify=true` and `verify=false`. `TrustedRoot::CustomPemFile(filename)` is a new feature that allows using a custom PEM certificate file as a trusted root certificate, enabling TLS verification with private self-signed certificates

        - `@http.Client(..)` now also accepts the `trust` parameter, which is forwarded to `@tls.Tls::client(..)` during HTTPS communication

    - Added the `moonbitlang/async/raw_fd` package, which integrates arbitrary file descriptors into the `moonbitlang/async` event loop, making it convenient for users to operate special file descriptors not directly supported by `moonbitlang/async`

    - Added signal support. Now, `async fn main` programs will automatically cancel the entire program (via `moonbitlang/async`'s built-in cancellation mechanism) when receiving signals like Ctrl+C, facilitating process-level cleanup. By default, the following signals trigger global cancellation:

        - Linux/MacOS: SIGINT, SIGTERM, SIGHUP

        - Windows: CTRL_C_EVENT, CTRL_BREAK_EVENT, CTRL_CLOSE_EVENT

    - You can control which signals trigger global cancellation behavior via the `set_global_cancellation_signals` function in the `moonbitlang/async/signal` package.

    - Added UDP multicast support. See [https://github.com/moonbitlang/async/pull/354](https://github.com/moonbitlang/async/pull/354) for details

    - `@socket.Addr::parse` now correctly handles IPv6 zone suffixes

    - `moonbitlang/async/http` changed how cookies are handled. Receiving and sending `Set-Cookie` headers now needs to be done via the `@http.Response.cookies` field rather than directly through `headers`. This is because the `Set-Cookie` header may appear multiple times in the same response and doesn't follow some RFC rules, making it impossible to fit into a `Map`. `moonbitlang/async/http` performs basic parsing of `Set-Cookie` contents for easier user reading

    - When users don't explicitly provide `Accept-Encoding`, `@http.Client` now automatically requests gzip compression from the server and automatically decompresses when users read the response body. If users explicitly provide `Accept-Encoding`, the response body sent by the target server is read as-is

    - `Content-Length` can now be explicitly provided when sending HTTP requests/responses. In this case, users can still incrementally send data in batches, and `moonbitlang/async/http` will automatically verify whether the total data length sent by the user is correct, reporting an error if incorrect. This feature helps applications like file download servers provide download progress support to clients

    - APIs like `@fs.open` now use `create_mode? : CreateMode` to control whether to create a new file and whether to truncate existing files, and `permission? : Int` to control access permissions for newly created files (default `0o644`). The old `create` and `truncate` parameters are deprecated. The permission parameter of `@fs.mkdir` is now optional, defaulting to `0o755`

    - Added `@fs.rename`, which can be used to asynchronously perform file rename operations

    - Added `@fs.Directory::next`, which returns an `@fs.DirectoryEntry` struct containing the filename and additional information such as whether the file is a subdirectory

    - `@fs.File::as_dir` is no longer deprecated and can be used normally going forward
