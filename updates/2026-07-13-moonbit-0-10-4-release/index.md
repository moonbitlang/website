# 20260713 MoonBit v0.10.4 Release

**moonc version:** `v0.10.4`

## Language Updates

1. **Added the `extend` syntax; the implicit behavior of turning `impl`s into methods is deprecated.**

   Previously, for every `impl Trait for Type` declaration, if `Type` was defined in the current package, the compiler would automatically attach all methods of `Trait` to `Type` as its methods, so that users could conveniently call the methods in the `impl` directly. However, this behavior had several problems:
   - It breaks refactoring safety: after an upstream package adds a new method with a default implementation to `Trait`, downstream code may fail to type check due to dot-syntax ambiguity
   - It is implicit and uncontrollable: if you only want to expose the `impl Trait for Type` relationship without exposing certain `impl`s as methods, there is no way to do so under the old semantics

   Therefore, we plan to deprecate this automatic method-attaching behavior. As a replacement, we provide a new syntax, `extend Type with Trait::{f, g}`, which manually attaches the methods `f` and `g` of `impl Trait for Type` to `Type` as methods. Adding `pub` in front of `extend` attaches `f` and `g` as public methods. Here are some semantic details of the `extend` syntax worth noting:
   - If `f` and `g` have no explicit implementation and use the default implementation instead, `Self` is specialized to `Type` when they are attached as methods
   - Even if `Type` is private, you can still add a private `extend` declaration for it. In that case, `f` and `g` are attached as local methods and can be called with dot syntax within the current package
   - `extend` is a new keyword, so it is currently implemented as a soft keyword: you can still use `extend` as a variable name, but the compiler will emit a warning wherever it is used as one. Later, `extend` will become a reserved word and eventually a real keyword, at which point it can no longer be used as a variable name

   Compared with the old semantics, the `extend` syntax gives explicit control over which methods are attached, so it avoids the refactoring-safety and controllability issues of the old semantics.

   For library authors, the expected migration path is to add a corresponding `extend` declaration for every `impl` that triggered the previous implicit attaching behavior. If you do not want users to call certain `impl`s in method form, you can put markers such as `#deprecated` on the `extend` declaration to help downstream users migrate. We provide a new warning, `implicit_impl_as_method (79)`, to help library authors migrate: it reports every location that triggers the old implicit attaching behavior. This warning is currently off by default and can be enabled manually; it will be enabled by default in the next release.

   Besides regular `impl`s, the semantics of calling methods on the trait object type `&Trait` and on type parameters have also been adjusted to match the semantic change of `impl`:
   - Previously, methods of `Trait`'s super traits could be called with dot syntax on the `&Trait` type. This behavior is now deprecated; in the future, only methods of `&Trait` itself can be called directly in method form. Using this call style produces a warning as of this release. Users need to migrate to the `Trait::f(..)` call form, or manually add an `extend` declaration for the `&Trait` type
   - For type parameters with a single constraint, such as `X : Hash`, methods of `Hash` itself can still be called with dot syntax, but methods from super traits will no longer be callable with dot syntax in the future, and such call sites currently receive a warning. Users should migrate the warned locations to the `Trait::f(..)` call form
   - For type parameters with multiple constraints, such as `X : Eq + Hash`, since different constraints may contain methods with the same name, it will no longer be possible to call methods from any of the constraints with dot syntax in the future, and such call sites currently receive a warning. Users likewise need to migrate to the `Trait::f(..)` call form

2. **Or-patterns now support default values via `with`.**

   Or-patterns require all branches to bind exactly the same variables. As a result, when several cases share the same handling logic, you had to duplicate code or extract a local function:

   ```moonbit
   fn f(x : Int) {
     ... // handle x
   }

   match s {
     Some(x) => f(x)
     None => f(0)
   }
   ```

   Now you can use `with` to provide default values for branches that do not bind a variable, merging the duplicated handling logic:

   ```moonbit
   match s {
     Some(x) | None with x = 0 => ... // handle x
   }
   ```

   Multiple variables require parentheses:

   ```moonbit
   match t {
     A(a, b) | B with (a = 0, b = 0) => ...
   }
   ```

3. **Added an explicit `Iter` literal syntax `[| .. |]`.**

   ```moonbit
   // Explicitly construct an Iter
   let xs : Iter[Int] = [| 1, 2, 3 |]
   // Spread, list comprehension, and other forms can be used inside
   let ys = [| ..xs, 4, 5 |]
   ```

   The evaluation order of `Iter` literals is as follows:
   - For plain literals `[| x, y, z |]`, the elements `x`, `y`, `z` are evaluated when the literal is constructed, just like regular array literals
   - For a spread `..xs`, `xs` itself is evaluated on the spot when the literal is constructed, but the computation inside the iterator obtained by evaluating `xs` only happens when the outer iterator `[| .. |]` reaches the corresponding elements
   - In the comprehension form `[| for .. |]`, all computation inside `[| .. |]` is lazy: it only happens when the outer iterator reaches the corresponding elements

   Previously, when the expected type was `Iter[_]`, a spread literal `[ x, ..xs, y ]` would automatically construct an `Iter` via type-based overloading. This behavior is now deprecated: code relying on it receives a compiler warning suggesting `[| .. |]` instead. The motivation for this change is that we do not want the evaluation order of a program to change implicitly depending on types.

4. **Array spreads now support conditional spreading `..if cond { expr }`.**

   ```moonbit
   let xs = [1, 2, ..if cond { extra }, 3]
   // When cond is true, equivalent to [1, 2, ..extra, 3]
   // When cond is false, equivalent to [1, 2, 3]
   ```

5. **Added Bytes string interpolation `b"...\{x}"`.**

   The semantics of Bytes string interpolation is to convert the result of the string interpolation into UTF-8 encoded `Bytes`:

   ```moonbit
   let x = 42
   let b : Bytes = b"value=\{x}" // Equivalent to @utf8.encode("value=\{x}")

   // Template write syntax also supports Bytes
   buf <+ b"value=\{x}"
   ```

6. **Custom constructors can now be defined for any type.**

   Previously, only `struct` types could have custom constructors. Now, all types can define custom constructors using the `fn Type::Type(..)` syntax, and the standard library has used this to unify the construction APIs of its container types (see the standard library updates). Note that a custom constructor cannot share a name with an existing constructor of the type. For example, `struct Tuple(..)` cannot have a custom constructor, because it would conflict with the built-in `Tuple(..)` constructor.

7. **Empty `{}` literals now trigger an ambiguity warning.**

   An empty `{}` could be either an empty map or an empty JSON object. The compiler now emits an ambiguity warning for this form, along with suggested alternatives:

   ```moonbit
   let json : Json = { "object": {} }
                             //  ^^---- prefer `Json::empty_object()`
   let dict : Map = {}
                 // ^^--- prefer `Map([])`
   let result = { stmt1(); {} }
                        // ^^--- prefer the todo syntax `...` or remove the empty block
   let record = {}
             // ^^--- prefer `Record::{}`
   ```

8. **The experimental lexmatch expression has been upgraded to the lexscan expression.**

   ```moonbit
   fn find_eol(s : StringView) -> Int? {
     lexscan s {
       (re"\r?\n", before=line, after=_) => Some(line.length())
       _ => None
     }
   }

   enum Token {
     IDENT(String)
     NUMBER(String)
   }

   fn tokenize(s : String) -> Array[Token] {
     let tokens = []
     for curr = s {
       lexscan s with longest {
         (re"^[ \t\r\n]+", after=rest) => continue rest
         (re"^[A-Za-z][A-Za-z0-9_]*" as t, after=rest) => {
           tokens.push(IDENT(t.to_owned()))
           continue rest
         }
         (re"^[0-9]+" as t, after=rest) => {
           tokens.push(NUMBER(t.to_owned()))
           continue rest
         }
         _ => break
       }
     }
     tokens
   }
   ```

   The case patterns of lexscan expressions are largely the same as the right-hand side of regex match expressions, but lexscan expressions additionally support the longest-match strategy.

   The original lexmatch expression has been deprecated, and the compiler provides migration hints. The new lexscan expression does not support `Bytes`/`BytesView` or guards; such cases need to be rewritten manually.

   _(Streaming mode support for lexscan expressions is coming soon — stay tuned)_

9. **Support for the old moon.pkg.json / moon.mod.json will be removed soon.**

   We plan to remove build system and compiler support for moon.pkg.json / moon.mod.json in the next release, and recommend migrating to moon.pkg / moon.mod. The migration from the old format in moon fmt will be kept.

10. **The `@` switch in warnings configuration will be deprecated.**

    We plan to simplify the syntax of the warnings configuration string and remove the `@` switch. We recommend using moon's `--deny-warn` in CI instead.

## Toolchain Updates

1. Expanded platform support for the new MoonBit native backend. When it was released last month, the new backend only supported macOS on Apple Silicon. This month we added:
   - x86-64 Linux (gnu) support
   - x86_64-pc-windows-msvc support, now available in nightly. Windows users need to install the MSVC Build Tools manually.
   - The build strategy has been adjusted: debug builds use the new native backend (faster compilation), while release builds use the C backend and invoke the system C compiler with -O2 optimization (faster execution)

2. The new MoonBit native backend is now enabled by default for debug builds on macOS Apple Silicon. Setting the environment variable `MOONBIT_NEW_NATIVE=0` disables the new native backend, so that both debug and release builds use the C backend. On other platforms, the default remains the C backend, and debug builds use the new native backend only when `MOONBIT_NEW_NATIVE=1` is set.

3. Windows development experience improvements
   - Native backend builds no longer require launching the terminal from an MSVC environment; moon automatically locates cl.exe / clang-cl.exe

4. moon.pkg adds a new `pkgtype` declaration, along with a new `#export_name` attribute

   ```moonbit
   // moon.pkg
   pkgtype(kind: "executable")      // replaces the previous options("is-main": true)
   pkgtype(kind: "foreign_library") // replaces the previous options(link: true)
   pkgtype(kind: "library")         // the default
   ```

   `#export_name` specifies the name of a function in the generated code, for example:

   ```moonbit
   #export_name("attr_add")
   pub fn add_by_attr(n : Int) -> Int {
     n + 42
   }
   ```

   In the generated Wasm/JS/C artifacts, the function is exported under the specified symbol. `#export_name` can only be used in foreign library packages, and only functions in the foreign library itself are exported; symbols from its upstream dependencies are not. Compiling to static/dynamic libraries on the native backend is still being polished, so this feature is currently mainly applicable to the Wasm/JS backends.

5. Stabilized configuration options such as `source` and `formatter` have been promoted to the top level of moon.mod / moon.pkg:

   ```moonbit
   // moon.pkg
   formatter(ignore: ["file1", "file2"])

   // moon.mod
   source = "src"
   ```

6. Fixed a number of LSP crashes and intermittent failures.

7. moon behavior fixes and improvements
   - The working directories of prebuild and test are now unified to the module root, and prebuild paths are now relative
   - File watching on macOS has switched to FSEvents, fixing crashes in `moon check --watch`
   - `moon run` now correctly propagates the exit code of the program being run
   - `moon bench` supports path filtering
   - The workspace-level preferred-target has been deprecated; `moon run` now respects the module's own preferred-target

8. The skills.mooncakes.io marketplace

   Page links can now be recognized and installed directly by the `npx skills` tool, for example `npx skills@latest add https://mooncakes.io/skills/Milky2018/pptz@0.2.4`

9. Parser error recovery improvements

   Improved the parser's error recovery when handling statements.

## Standard Library Updates

1. `moonbitlang/async` is now at version 0.20.2. The main updates since the previous monthly report (0.19.2) are:
   - Added experimental Wasm1 backend support; API signatures and behavior are identical to the native backend. `.wasm` files built from projects using `moonbitlang/async` currently must be run with the latest `moonrun`, and are not yet compatible with other Wasm runtimes

     `.wasm` binaries built from programs using `moonbitlang/async` are cross-platform: the same `.wasm` program can run on any hardware architecture and operating system where `moonrun` is available, without rebuilding

     The Wasm1 support in `moonbitlang/async` is currently experimental. In the **future**, we will guarantee backward compatibility of `.wasm` binaries: `.wasm` files built with older versions of `moonbitlang/async` will still run on the latest `moonrun`

     The Wasm1 backend of `moonbitlang/async` does not yet support the following features:
     - `@websocket`
     - `@fs.Watcher` and `@fs.realpath`

     Support for all of them will be added soon

   - `@fs.Watcher` gained a new `.wait()` method, which returns a series of events describing the changes that actually happened in the file system. The `@fs.Watcher(..)` constructor also gained new options controlling how events are reported; see the API documentation for details. The file system watching provided by `@fs.Watcher` remains fully cross-platform: the same file system operations produce the same event sequence on all supported operating systems

   - Adjusted the read/write semantics of `@fs.File` so that it no longer relies on the file pointer maintained by the operating system, whose semantics are inconsistent across platforms and buggy on some of them. The new semantics of `@fs.File` are:
     - Sequential reads and writes via `@io.Reader`/`@io.Writer` are now two completely independent streams that do not interfere with each other. Random-access reads and writes via `read_at` and `write_at` are completely independent from sequential reads/writes, and can be performed in parallel across multiple tasks (as long as the written ranges do not overlap)
     - For files opened in append mode (passing `append=true` to `@fs.open`), the semantics of sequential reads via `@io.Reader` are unaffected and still start from the beginning of the file. Sequential writes via `@io.Writer` always append to the end of the file. Random reads via `read_at` are likewise unaffected by append mode, but for files opened in append mode, random writes via `write_at` now throw an error immediately, because the relevant system call on Linux is buggy and the correct semantics cannot be implemented

     This change is incompatible with the previous behavior, but most programs should not be affected

   - If a program references standard input/output such as `@stdio.stdin` and `@stdio.stdout`, and `moonbitlang/async` fails while initializing them internally (for example, on Windows, standard input/output may not exist), the program used to crash immediately during initialization. In the latest version, the program no longer crashes in this situation; instead, an error is thrown on the first use of the corresponding standard input/output pipe. As a result, `@stdio.{Input,Output}::fd` can now throw an error, which is an incompatible change

   - The `sync` option of `@fs.open` now also takes effect on Windows: both `sync=Data` and `sync=Full` map to the Windows `FILE_FLAG_WRITE_THROUGH` flag, guaranteeing that when a file write operation returns, the content has been synced to the actual file system rather than sitting only in a cache

   - When the target of a symbolic link created by `@fs.symlink` is an existing directory, on Windows it now first tries to create an NTFS junction instead of a symbolic link, because creating symbolic links on Windows requires administrator privileges. This behavior can be explicitly turned off with `force_symlink=true` (the default is `false`)

   - Lots of bug fixes and some performance optimizations

2. `moonbitlang/core`
   - Added an experimental v128 SIMD package and used SIMD to optimize several hot paths: Bytes search and comparison, UTF-16 decoding, and more. In addition, StringBuilder writes, common Array/FixedArray operations, BigInt, strconv, JSON parsing, and others also received substantial performance optimizations
   - The immutable containers (HashMap / HashSet / SortedMap / SortedSet, etc.) gained constructors named after their types, and `from_array` has been deprecated, keeping the style consistent with language-level custom constructors
   - argparse: parse errors now come with subcommand spelling suggestions, and default subcommand dispatch is supported
   - Added `Json::empty_object()`; String gained convenience APIs such as `all` / `any` / `contains_code_unit`; Int16 / UInt16 gained `lnot`
   - The view operators no longer support negative indices
   - Cleaned up deprecated APIs: removed `#alias(T)` on collection types, `IterResult`, and others
   - Fixed an issue where the APIs in `@env` for environment variables, command-line arguments, the current directory, etc. did not handle Unicode strings correctly on Windows
