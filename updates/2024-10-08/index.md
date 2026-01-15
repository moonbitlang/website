# 2024-10-08

## IDE Update

- **AI Codelens** now supports `/generate` and `/fix` commands.

The `/generate` command provides a generic interface for generating code.

![generate.gif](generate.gif)

The `/fix` command reads the current function's error information and suggests fixes.

![fix.gif](fix.gif)

## Language Updates

- Adjusted the precedence of infix expressions and `if`, `match`, `loop`, `while`, `for`, `try` control flow expressions. These control flow expressions can no longer directly appear in positions requiring infix expressions and now require an additional layer of parentheses when nested.

For example, the syntax for `if` and `match` is:

```text
if <infix-expr> { <expression> } [else { <expression> }]
match <infix-expr> { <match-cases> }
```

Since `if`, `match`, `loop`, `while`, `for`, `try` are no longer considered infix expressions, code like `if if expr {} {}` is now invalid:

```moonbit
// invalid
if if cond {a} else {b} {v} else {d}
match match expr { ... } { ... }
let a = expr1 + expr2 + if a {b} else {c} + expr3
// valid
if (if cond {a} else {b}) {v} else {d}
match (match expr { ... }) { ... }
let a = expr1 + expr2 + (if a {b} else {c}) + expr3
```

- **JavaScript backend**
  - Arrays now compile to native JS arrays, making interaction with JS more convenient.

- **Standard Library API**
  - Added `concat` and `from_array` functions to the `String` package, deprecating `Array::join`.
  - Added `rev_concat()` to the `immut/list` package.
  - `Buffer` type now includes `length` and `is_empty` functions.
  - Improved the `to_json` function for the `Option` type.

- **Experimental Library API**
  - `x/fs` package now supports the Wasm, Wasm-gc, and JS backends, including the following APIs:
    - `write_string_to_file`, `write_bytes_to_file`
    - `read_file_to_string`, `read_file_to_bytes`
    - `path_exists`
    - `read_dir`
    - `create_dir`
    - `is_dir`, `is_file`
    - `remove_dir`, `remove_file`

## Build System Updates

- `moon test -p` now supports fuzzy matching. For example, `moon test -p moonbitlang/core/builtin` can be shortened to `moon test -p mcb` or `moon test -p builtin`.

- In `moon.pkg.json`, if the `source` field is an empty string `""`, it is equivalent to `"."`, representing the current directory.

## Moondoc Update

- The documentation generator now supports package-level `README` files. Any `README.md` in the same directory as `moon.pkg.json` will be displayed on the package’s documentation page.
