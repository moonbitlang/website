# 20261105 MoonBit v0.10.19 Release

moonc version: `v0.10.19`

## Language Updates

- **Derive syntax migration.** Trait derivation moves from `derive(...)` after a type definition to an attribute above it. Run `moon fmt` to convert existing code. Attribute syntax no longer supports `#foo(qual.id)` and now supports `#foo(@pkg.id)` and `#foo([elem1, elem2, elem3])`.

  ```moonbit
  #derive(Debug, Eq, Hash)
  pub(all) struct Point {
    x : Int32
    y : Int32
  }
  ```

- **Int/UInt renamed to Int32/UInt32.**`Int32` and `UInt32` represent 32-bit signed and unsigned integers. Explicit widths make code easier to read when several widths appear together, such as in binary protocols or FFI signatures. `Int` and `UInt` remain available as aliases, and both spellings can coexist in a project. The formatter can migrate the old spellings to the explicit-width names.
- **Floating-point semantics.** Arithmetic and comparison operators (`==`, `!=`, `<=`, `<`, `>=`, `>`) continue to follow IEEE semantics. `-0.0 == 0.0`, and `NaN` is unequal to every value, including itself. The main change concerns `compare` when NaN is involved. Its results for NaN are currently unspecified. This mainly affects sorting and binary search, and NaN should not be used as a key in structures such as hash tables. Use the new `Float::total_compare` or `Double::total_compare` if you need defined comparison behavior for NaN. Both use the following order.

  - `NaN`
  - `-Infinity`
  - Negative numbers
  - `-0.0` and `0.0`, which compare equal
  - Positive numbers
  - `+Infinity`

- **Changes to extenum declarations.** The old form combines the type declaration and its constructors in one definition.

  ```moonbit
  extenum E {
    A
  }
  ```

  ```moonbit
  pub extenum E

  extenum E += {
    A
  }
  ```

- **New byte regex literals, `reb"..."`.** Use `reb"..."` with `=~` and `lexmatch` to match `Bytes` and `BytesView`, much as `re"..."` matches `String` and `StringView`. A byte regex matches bytes without encoding or decoding, so it can match arbitrary byte sequences. Its syntax is largely the same as that of `re"..."`. Capture types are determined statically by the regex. A capture that matches exactly one byte has type `Byte`, as in `reb"." as b`. Other captures have type `BytesView`, as do `before` and `after`. In ordinary expressions, a `reb"..."` literal has type `BytesRegex`. Like `Regex`, it can be assigned to a constant, combined with `+` and `|`, and referenced in patterns.

  ```moonbit
  fn parse_request(line : Bytes) -> Unit {
    if line =~ (reb"^(GET|POST|PUT) " + (reb"[^ ]+" as path), after=rest) {
      ...
    }
  }
  fn content_length(header : BytesView) -> BytesView? {
    lexmatch header {
      (reb"^(?i:content-length): " + (reb"[0-9]+" as n), after=_) => Some(n)
      _ => None
    }
  }
  ```

  - Only ASCII characters may appear directly in a literal. Use `\xHH` for non-ASCII bytes, including in character classes and ranges. Examples include `reb"\xef\xbb\xbf"` and `reb"[\x80-\xff]+"`. Neither `\u{...}` nor direct non-ASCII characters are supported. For example, write `reb"\xc3\xa9"` for `reb"é"`.
  - `.` and `[^...]` match any single byte, including 0x80–0xFF. Therefore, `.` matches only the first byte of a multibyte UTF-8 sequence.
  - `(?i:...)`, `\b`, and `[[:word:]]` use ASCII semantics. Bytes above 0x7F are neither case-folded nor treated as word bytes.

  ```moonbit
  const HIGH : BytesRegex = reb"[\x80-\xff]"
  const HIGH_THEN_A : BytesRegex = HIGH + reb"a"
  ```

`lexscan` currently does not support byte regexes.

- **Upcoming breaking change.** In the next release, we will change the runtime layout of `Array` on the JavaScript backend to align with the other backends. `Array` will no longer compile to a native JavaScript Array.
- **Top-level `declare let`.** Declarations previously focused on interfaces such as functions and types. You can now declare a top-level value's name, type, and visibility with `declare let`, then provide a matching definition in the same package. This lets you review the package's public interface before deciding which file holds the value or how it is initialized.

  ```moonbit
  ///|
  declare pub let default_limit : Int32

  ///|
  pub let default_limit : Int32 = 100
  ```

## Toolchain Updates

- **Build static libraries with the Native backend.** The following MoonBit program uses `#export_name` to specify an exported symbol. Set `pkgtype(kind: "foreign_library")` in `moon.pkg`, then run `moon build --target native` to produce an archive a host program can link. The output is an `.a` file, or a `.lib` file on Windows.

  ```moonbit
  let offset : Int32 = 2

  #export_name("add")
  pub fn add(a : Int32, b : Int32) -> Int32 {
    a + b + offset
  }
  ```

  ```text
  $ moon build --target native                                                ~/playground/moonbit-playground/demo
  Finished. moon: ran 28 tasks, now up to date
  Artifacts:
    username/foreign/lib  native  path/to/_build/native/debug/build/lib/lib.a
  ```

On the host side, call `moonbit_init()` to initialize the MoonBit runtime.

```c
#include "moonbit.h"
#include <stdio.h>

extern int32_t add(int32_t a, int32_t b);

int main(void) {
  moonbit_init();
  printf("add(40, 2) = %d\n", add(40, 2));
  return 0;
}
```

Then compile the host program together with the static library generated by MoonBit and run it.

```text
$ cc -I ~/.moon/include host.c path/to/_build/native/debug/build/lib/lib.a -lm -o host
$ ./host
add(40, 2) = 44
```

- **Migrate configuration in `.mbtx` script mode.** A script can place configuration between `---` delimiters at the top of the file to keep dependencies and runtime permissions together. The header uses the configuration syntax of `moon.pkg` and `moon.mod`. A script that needs a host environment variable can declare the requested permission here. The `import` syntax continues to support aliases and import-all. An import can combine `*` with a package alias. In the example below, both `Queue` and `@q.Queue` refer to the same definition. With `*` alone, the default package alias remains available.

  ```moonbit
  ---
  import {
    "moonbitlang/core/queue" @q *,
    "moonbitlang/x/bcrypt",
  }
  ---

  fn main {
    println(Queue([1, 2]).length())
    println(@q.Queue([3, 4, 5]).length())
  }
  ```

- **Generate `.mbti` files automatically with `moon check`.** After a successful check, `moon check` updates `pkg.generated.mbti` for the checked local packages whose preferred backend is included in the check. The file summarizes public types, functions, and traits, making API changes visible alongside source changes in code review. Run `moon check --no-mbti` to perform type checking without updating these files.
- **Documentation test improvements.**`moon test` already supported extracting and testing code blocks inside `///` doc comments. We have improved extraction and parsing performance to make the coding-and-testing loop more efficient for agents using MoonBit. Test blocks no longer inherit the function's `#cfg` attribute. If a function supports only certain backends, add the appropriate `#cfg` marker to the test block itself.

  ````moonbit
  ///
  /// ```mbt check
  /// test {
  ///   assert_eq(greeting("alice"), "hi, alice")
  /// }
  /// ```
  fn greeting(name : String) -> String {...}
  ````

- **Run test executables in parallel by default.** Moon schedules test executables in parallel based on the available CPU count, reducing waiting time in projects with multiple test packages. Use `moon test -j 4` to limit concurrency. For tests that share ports or external resources, use `moon test --no-parallelize` to run test executables sequentially while keeping the build parallel. This option does not affect concurrency among async tests within a single package.
- **LSP support for `.mbtx`.** MoonBit language services can now handle `.mbtx` scripts, bringing editor support to standalone tools and automation scripts.
- **Debug the new Native backend in VS Code.** With the CodeLLDB extension installed and `preferred-target` in `moon.mod` set to `native`, click the Debug button above `main` or a test to start debugging. Debugging is now available for the new Native backend in addition to the LLVM and JavaScript backends.
- **Experimental `moon testcli` command.** This command tests MoonBit command-line applications and `.mbtx` scripts and can replace the previous `cram` subcommand.
- **Major-version module paths.** A module can use a path such as `owner/library/v{n}` to identify a new major version. When publishing breaking changes, consumers can distinguish major versions through their paths. The default alias of the module's root package remains `@library`. Use explicit aliases when importing two major versions in the same code. Before MoonBit 1.0, publishing packages at version 1.0 or later is temporarily unsupported.
- **Conditional imports.** A package might use system libraries on Native and browser APIs on JavaScript. Use `#cfg` to choose dependencies for each backend while keeping the same alias. If both implementation packages below provide `label()`, call sites can use `@platform.label()` on either backend. The same mechanism applies to black-box and white-box test imports.

  ```moonbit
  #cfg(target = "native")
  import { "example/conditional/native_impl" @platform }

  #cfg(target = "js")
  import { "example/conditional/js_impl" @platform }
  ```

- **Experimental package declarations.** Declare a package experimental with `experimental = true`. Direct consumers receive a warning, which they can suppress with `allow-experimental-packages = true`.
- **Removal of legacy toolchain behavior.**

  - JSON manifests are no longer accepted. The `moon fmt` migration entry point remains available.
  - `moon install` is no longer used to synchronize dependencies.
  - `moonx` only supports running Wasm programs.
  - Support for `bin-deps` has been removed. Use `moonx` instead. `moon add --bin` has also been removed.
  - Automatic generation from `mbl` and `mby` files is no longer supported. Use `moonx` with the corresponding libraries instead.
  - Versions specified in dependency declarations must actually exist.
  - Using a core package without an explicit import now produces an error instead of a warning.

## Standard Library and Runtime Updates

- **New `moonbitlang/core/async` package.** It includes all the functionality of `moonbitlang/async`, with corresponding packages such as `moonbitlang/core/async/http` for `moonbitlang/async/http`. In the future, `moonbitlang/core/async` will become the default asynchronous runtime, and `moonbitlang/async` will be gradually deprecated. For now, `moonbitlang/core/async` is experimental and its APIs are still evolving. To use it, add `"allow-experimental-packages": true` to the `options` section of `moon.pkg`.Its APIs include substantial improvements over `moonbitlang/async`. Once they stabilize, we will provide a detailed migration guide. `moonbitlang/core/async` and `moonbitlang/async@0.22.7+` can coexist in one program, allowing applications to migrate incrementally.
- **Path utilities join the standard library.** Import `moonbitlang/core/path` for basic file-path operations. As shown in the `.mbtx` script below, the package can extract a path's extension, filename, and parent directory. It also supports joining path components with `/`.

  ```moonbit
  ---
  import {
    "moonbitlang/core/path",
  }
  ---

  fn main raise {
    let file1 = @path.Path("path/to/base/file1.mbt")
    assert_eq(file1.extname(), ".mbt")
    assert_eq(file1.basename(), "file1.mbt")
    let base = file1.dirname()
    let target = base / "fixture" / "file2.txt"
    assert_eq(target, "path/to/base/fixture/file2.txt")
  }

  ```

- **Compression and ZIP archives.**`core/compress` adds raw DEFLATE, gzip, and zlib codecs, while `core/archive/zip` adds ZIP and ZIP64 support. Choose the corresponding standard-library package to process gzip data, create ZIP files, or read archive entries. The archive API also exposes entry metadata, so you can inspect the contents before deciding which entries to read.
- Support for using `moonbitlang/core/abort` as a virtual package has been removed.
- The `Json` type and `ToJson` trait have moved to `moonbitlang/core/json`. Some built-in types no longer support calls in the form `a.to_json()`. Use `ToJson::to_json(a)` or `Json(a)` instead.
- `moonbitlang/x/time` improves support for reading TZif (Time Zone Information) files and adds access to the system's current time zone, currently on the Native and JavaScript backends.

## Ecosystem and Developer Tool Updates

- **mooncakes.io improvements.**

  - Added registration, sign-in, and password recovery, and added dependents to documentation pages. Skill uploads are now separate from module uploads.
  - Improved search results so modules matching by name consistently appear first.

- **SeekMoon.**

  - Added a Conversations page, allowing SeekMoon to be used without attaching a workspace.
  - Added cloud agents. Sign in, then create a conversation on the Conversations page to use them.
  - Added image support. Paste images directly into the input box, or let the agent read images through a tool.
  - Added scheduled tasks, which can be created from the sidebar.
  - Integrated Word, Excel, and PDF previews. SeekMoon can now generate PDFs with Typst and preview them.
  - Added built-in `/ultrareview` and `/simplify` workflows, which launch multiple subagents concurrently for code review and codebase simplification.
  - Added local pull request review. Open the GitHub page from the sidebar to browse a repository's pull requests and view GitHub review comments at the corresponding file locations.

- Two new command-line tools are available through `moonx cli/typst` and `moonx cli/rg`.
