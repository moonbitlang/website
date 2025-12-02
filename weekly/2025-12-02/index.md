# 20251202 MoonBit Monthly Update Vol.06
## Version 0.6.33
## Language Update
- Improved functionality for `ReadOnlyArray`.

  `ReadOnlyArray` was introduced in the previous version, primarily used for declaring lookup tables, and the compiler performs more performance optimizations for `ReadOnlyArray`. In this version, the feature support for `ReadOnlyArray` has been improved to provide a user experience basically consistent with other array types, such as pattern matching, slicing, and spread operations.
  ```moonbit
  fn main {
    let xs: ReadOnlyArray[Int] = [1,2,3]
    let _ = xs[1:]
    match xs {
      [1, .. rest] => ...
      ...
    }
    let _ = [..xs, 1]
  }
  ```

- bitstring pattern supports signed extraction, allowing the extracted bits to be interpreted as signed integers, for example:
    ```moonbit
  fn main {
    let xs : FixedArray[Byte] = [0x80, 0, 0, 0]
    match xs {
      [i8be(i), ..] => println(i) // prints -128 because 0x80 is treated as signed 8-bit int
      _ => println("error")
    }
  }
  ```
- Cascade function call improvements

    Previously, in cascade-style function calls like `x..f()..g()`, the return type of `f` was required to be `Unit`. This restriction has now been removed. When `f` returns a value of a type other than `Unit`, an `invalid_cascade` warning will be triggered, and at runtime this return value will be implicitly discarded:
  ```moonbit
  struct Pos {}
  fn Pos::f(_ : Self) -> Int  { 100 }
  fn Pos::g(_ : Self) -> Unit { ()  }
  fn main {
    let self = Pos::{}
    self
    ..f() // warning, discard the returned value 100
    ..g()
  }
  ```

  If you wish to prohibit such implicit discarding in your project, you can treat this warning as an error by configuring `"warn-list": "@invalid_cascade"`.

- Syntax parsing improvements
  - Improved error recovery when `::` is omitted in `StructName::{ field1: value }`
  - Improved error recovery when range syntax is incorrectly written in `for x in a..=b {}` and `match e1 { a..=b => e2 }`
- Improvements to `.mbt.md` code block support
We have decided to make markdown code blocks that participate in compilation more explicit. The specific changes are as follows:
  - Code blocks marked only as `mbt` or `moonbit` will no longer be compiled. These code blocks need to be explicitly marked as `check`, i.e., `mbt check` or moonbit check, to be compiled as before.

  - Added `mbt test` and `mbt test(async)` code blocks. In addition to participating in compilation, these code blocks will also wrap the code in a test or `async test` block. When using these two types of code blocks in markdown, users no longer need to manually write `test {}` or `async test`.

    ````markdown
        # A Markdown Example

        Highlighting only：

        ```mbt
        fn f() -> Unit
        ```

        Highlighting and checking：

        ```mbt check
        fn f() -> Unit {...}
        ```

        Highlighting, checking and treated as a test block：

        ```mbt test
        inspect(100)
        inspect(true)
        ```
    ````
  The markdown in docstrings has also undergone the same changes, although `mbt check` is not currently supported but will be supported in the future.

- `#label_migration` attribute

    The `#label_migration` attribute supports declaring aliases for parameter labels, with two main uses: first, it allows giving the same parameter two different labels; second, when an additional msg is provided, it can be used to deprecate a certain parameter label:

  ```moonbit
  #label_migration(x, alias=xx)
  #label_migration(y, alias=yy, msg="deprecate yy label")
  fn f(x~ : Int, y? : Int = 42) -> Unit { ... }

  ///|
  fn main {
    f(x=1, y=2)   // ok
    f(xx=1, yy=2) // warning: deprecate yy label
    f(x=1)        // ok
  }
  ```
- `#deprecated` default behavior improvement

    The default behavior of `deprecated` has been changed to `skip_current_package=false`, meaning warnings will also be reported for usage within the current package. If unexpected warnings appear in recursive definitions or tests, you can explicitly disable warnings for the current package using `#deprecated(skip_current_package=true)`, or use the newly added `#warnings` attribute to temporarily disable warnings.
- Warnings and alerts improvements
  - Added mnemonics for warnings

    Now you can configure warnings by their names instead of numbers: `"warn-list": "-unused_value-partial_match"`
  - `#warnings` attribute support

    Now supports locally enabling/disabling warnings through the `#warnings` attribute. The parameter inside the attribute is the same string format as the `warn-list` configuration. The string contains multiple warning names, each preceded by a symbol indicating the configuration for that warning: `-name` means disable the warning; `+name` means enable the warning; `@name` means if the warning is already enabled, escalate it to an error.

    For example, the following example disables the `unused_value` warning for the entire function `f` and escalates the default-enabled `deprecated` warning to an error. Now it won't prompt that the variable is unused, but if `f` uses a deprecated API, compilation will fail:
    ```moonbit
    #warnings("-unused_value@deprecated")
    fn f() -> Unit {
      let x = 10
    }
    ```

    Currently, this attribute only supports configuring certain specific warnings.

  - Merge alerts and warnings

    Deprecate alerts-related configurations. Now alerts have become a subset of warnings. When using -a to disable all warnings, all alerts will also be disabled. Specifically, in warn-list, you can use alert to refer to all alerts, and alert_\<category\> to refer to a specific category of alerts:
    ```moonbit
    #warnings("-alert")
    fn f() -> Unit { ... } //Disable all alert warnings

    #warnings("@alert_experimental")
    fn g() -> Unit { ... } //Related to APIs marked with #internal(experimental, "...")
    ```

  - `test_unqualified_package` warning

    Added the `test_unqualified_package` warning, which is disabled by default. When enabled, it requires blackbox tests to reference the tested package's API using the `@pkg.name` format, otherwise this warning will be triggered.

- Lexmatch syntax update

  The experimental `lexmatch` expression now supports the `first` (default) matching strategy. Under this matching strategy, `search` mode and non-greedy quantifiers are supported. For specific details, please refer to the [proposal](https://github.com/moonbitlang/moonbit-evolution/pull/15).
  ```moonbit
  // Find the first block comment and print its content
  lexmatch s { //  `with first` can be omitted
    (_, "/\*" (".*?" as content) "\*/", _) => println(content)
    _ => ()
  }
  ```
- Type inference improvements

  Fixed the issue where type information in `X` could not propagate to expressions when the expected type is `ArrayView[X]`, and the issue where type parameters could not propagate to expressions when the expected type is a newtype with parameters.

- Added #module attribute for importing third-party JS modules
  For example, the following code imports the third-party JS module "path" and uses "dirname" from that module

```mbt
#module("path")
extern "js" fn dirname(p : String) -> String = "dirname"
```

The code above will result in the following generated JS code (simplified, the actual code has name mangling):

```js
import { dirname } from "path";
```


## Toolchain Update
- IDE completion improvements

    The IDE now displays deprecated APIs with strikethrough formatting:
![alt text](image-2.png)
- Build system improvements

  - Enhanced the readability of expect/snapshot test diffs. Now, these areas use the unified diff format to display the differences between expected and actual values, making them readable even in scenarios where colors are not output, such as in CI and files, while still showing colored and highlighted comparison results when color display is available.
![alt text](image-3.png)
- New Build system backend

    We have basically completed a complete rewrite of the build system backend, which can be enabled for trial use through the `NEW_MOON=1` environment variable.

    The new backend is less prone to errors due to various edge cases during the build process, offering stronger stability, while also providing performance improvements compared to the current implementation. The new backend now supports the vast majority of existing features and behaves exactly the same as the current implementation, but may lack some optimizations in certain situations (such as running tests in parallel).

    If you encounter any issues when running the new backend, including performance issues and behavioral inconsistencies, please report them at https://github.com/moonbitlang/moon/issues.

- File path-based filtering for `moon {build,check,info}` [moonbuild#1168](https://github.com/moonbitlang/moon/pull/1168).

    When running `moon build`, `moon check`, or `moon info`, you can pass in the folder path where the package to be processed is located or a file path within it, and only the corresponding command for that package will be executed. This usage is similar to `-p <package name>`, but doesn't require entering the complete package name. This feature cannot be used simultaneously with `-p`. For example:

        ```bash
        # Build only the package at path/to/package
        moon build path/to/package

        # Check only the file at path/to
        moon check path/to/file.mbt
        ```

- `moon doc` symbol lookup
We have created a symbol search command-line tool similar to `go doc`, making it convenient for AI agents or developers to quickly search for available APIs. Currently supports the following features:
  - Query available packages in a module
  - Query all available items (values, types, traits) in a package
  - Query members of a type (method, enum variant, struct field, trait method)
  - Follow aliases to their final definition when querying
  - Query built-in types
  - Support glob patterns

  Simply run `moon doc <symbol name or package name>` to query the documentation for the corresponding symbol or package.

- `moon fmt` improvements
  - Support formatting code blocks marked as `moonbit` or `moonbit test` in documentation comments
  - `moon.pkg.json` supports configuring ignore lists
  ```json
  { // in moon.pkg.json
    "formatter": {
      "ignore": [
        "source1.mbt",
        "source2.mbt"
      ]
    }
  }
  ```
- `async test` now supports limiting the maximum number of concurrently running tests, with a default value of 10, which can be modified through `"max-concurrent-tests": <number>` in `moon.pkg.json`
## Standard Library and Experimental Library Update
-  Deprecate `Container::of` function

    Now `ArrayView` is the unified immutable slice that can be created from `Array`, `FixedArray`, and `ReadonlyArray`. Therefore, initialization functions like `of` and `from_array` are unified as `Type::from_array`, with the parameter changed from accepting `Array` to `ArrayView`. It is now recommended to use `Type::from_array` to create containers from array literals.
- Added `MutArrayView` as the unified mutable slice

    `ArrayView` changed from a mutable type to an immutable type in the previous version, but sometimes it's necessary to modify elements of the original array through a slice, so `MutArrayView` was introduced as a complement.

    `MutArrayView` can be created from Array and FixedArray.
- Renamed `@test.T` to `@test.Test` and `@priority_queue.T` to `@priorityqueue.PriorityQueue`
- String indexing improvements

    `string[x]` will now return `UInt16`. Please migrate using `code_unit_at`
- moonbitlang/x/path experimental library improvements

    Supports dynamic switching between Windows path and POSIX path processing, with Python `os.path` style API design.
- moonbitlang/async updates
  - moonbitlang/async experimentally supports the js backend. Currently covered features include:
    - All features unrelated to IO, including `TaskGroup`, control flow constructs like `@async.with_timeout`, async queues, etc.

    - Provides a package for JS interaction called `moonbitlang/async/js_async`, supporting bidirectional conversion between MoonBit async functions and JavaScript Promises, and supporting automatic cancellation handling based on AbortSignal

  - Added WebSocket support, which can be imported through the `moonbitlang/async/websocket` package

  - `moonbitlang/async/aqueue` now supports fixed-length async queues. When the queue is full, it supports three different behaviors: blocking the writer/overwriting the oldest element/discarding the newest element, which can be controlled by parameters when creating the queue

  - The HTTP client and HTTP request API in `moonbitlang/async/http` now support specifying HTTP CONNECT proxies. It can support HTTPS proxies with full-process encryption and proxies that require authentication

  - Improved the HTTP server API, now user callback functions can process one request at a time without manually managing connections