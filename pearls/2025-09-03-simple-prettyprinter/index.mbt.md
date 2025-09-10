---
description: 'Prettyprinter: Declarative Structured Data Formatting with Function Composition'
slug: simple-prettyprinter
image: cover.png
---

# Prettyprinter: Declarative Structured Data Formatting with Function Composition

When working with structured data, printing it in a clear and adaptable format is a common challenge. This comes up often in debugging, logging, and code generation. For instance, an array literal `[a,b,c]` should ideally print on one line if the screen is wide enough, but gracefully wrap and indent when space is limited.

Traditional solutions often rely on manually concatenating strings while tracking indentation levels. This approach is not only tedious, but also error-prone.

A more elegant solution is to use function composition. With this approach, we build a prettyprinter: a system where users combine primitive formatting functions into a `Doc` structure that describes the intended layout. Given a maximum width, the prettyprinter automatically chooses the most readable formatting.

This makes the printing process declarative—you specify what the layout should look like under different conditions, and the system figures out how to render it.

# SimpleDoc Primitives

We begin with a minimal representation called `SimpleDoc`. It consists of just four primitives:

```moonbit
enum SimpleDoc {
  Empty
  Line
  Text(String)
  Cat(SimpleDoc, SimpleDoc)
}
```

* `Empty`: represents an empty string
* `Line`: represents a newline
* `Text(String)`: plain text without line breaks
* `Cat(SimpleDoc, SimpleDoc)`: concatenates two `SimpleDocs`s

Using these primitives, we can implement a simple rendering function. It flattens a `SimpleDoc` into a string using a stack-based traversal:

```moonbit
fn SimpleDoc::render(doc : SimpleDoc) -> String {
  let buf = StringBuilder::new()
  let stack = [doc]
  while stack.pop() is Some(doc) {
    match doc {
      Empty => ()
      Line => {
        buf..write_string("\n")
      }
      Text(text) => {
        buf.write_string(text)
      }
      Cat(left, right) =>
        stack..push(right)..push(left)
    }
  }
  buf.to_string()
}
```

Here’s a quick test: we can see that the expressiveness of `SimpleDoc` is equivalent to `String`: `Empty` corresponds to `""`, `Line` corresponds to `"\n"`, `Text("a")` corresponds to `"a"`, and `Cat(Text("a"), Text("b"))` corresponds to `"a" + "b"`.

```moonbit
test "simple doc" {
  let doc : SimpleDoc = Cat(Text("hello"), Cat(Line, Text("world")))
  inspect(
    doc.render(),
    content=(
      #|hello
      #|world
    ),
  )
}
```

At this stage, the `SimpleDoc` doesn’t yet handle indentation or layout choices—but we’re about to fix that.

# ExtendDoc: Nest, Choice, Group

To handle real-world formatting, we extend `SimpleDoc` with three new primitives: 

```moonbit
enum ExtendDoc {
  Empty
  Line
  Text(String)
  Cat(ExtendDoc, ExtendDoc)
  Nest(Int, ExtendDoc)
  Choice(ExtendDoc, ExtendDoc)
  Group(ExtendDoc)
}
```

* **Nest**
  `Nest(Int, ExtendDoc)` indents the doc by n spaces after each line break. Nested levels accumulate.

* **Choice**
  `Choice(ExtendDoc, ExtendDoc)` stores two alternative layouts. Usually, the first parameter is the more compact layout without line breaks, and the second is the layout with `Line`s. The renderer uses the first layout in compact mode and the second otherwise.

* **Group**
  `Group(ExtendDoc)` groups an `ExtendDoc` and decides between compact or non-compact layout based on the available width. If the remaining space is sufficient, it prints compactly; otherwise, it falls back to the layout with line breaks.

## Measuring Space

To know whether compact layout fits, we need a way to estimate how many characters a document would require:

```moonbit
let max_space = 9999

fn ExtendDoc::space(self : Self) -> Int {
  match self {
    Empty => 0
    Line => max_space
    Text(str) => str.length()
    Cat(a, b) => a.space() + b.space()
    Nest(_, a) | Choice(a, _) | Group(a) => a.space()
  }
}
```

Here, `Line` is treated as requiring “infinite” space. This guarantees that if a `Group` contains a line break, it won’t attempt to print compactly.

## Rendering ExtendDoc

We extend `SimpleDoc::render` to implement `ExtendDoc::render`. Since after printing a substructure we need to return to the original indentation level, the stack must also store two states for each pending `ExtendDoc`: indentation and whether compact mode is active. We also maintain a `column` variable to track the number of characters already used on the current line, in order to calculate remaining space. Finally, the function adds a `width` parameter to specify the maximum line width.

```moonbit
fn ExtendDoc::render(doc : ExtendDoc, width~ : Int = 80) -> String {
  let buf = StringBuilder::new()
  let stack = [(0, false, doc)] // default: no indentation, non-compact mode
  let mut column = 0
  while stack.pop() is Some((indent, fit, doc)) {
    match doc {
      Empty => ()
      Line => {
        buf..write_string("\n")
        for _ in 0..<indent {
          buf.write_string(" ")
        }
        column = indent
      }
      Text(text) => {
        buf.write_string(text)
        column += text.length()
      }
      Cat(left, right) =>
        stack..push((indent, fit, right))..push((indent, fit, left))
      Nest(n, doc) => stack..push((indent + n, fit, doc))
      Choice(a, b) =>
        stack.push(if fit { (indent, fit, a) } else { (indent, fit, b) })
      Group(doc) => {
        let fit = fit || column + doc.space() <= width
        stack.push((indent, fit, doc))
      }
    }
  }
  buf.to_string()
}
```

Let’s use `ExtendDoc` to describe a `(expr)` and print it under different width:

```moonbit
let softline : ExtendDoc = Choice(Empty, Line)

impl Add for ExtendDoc with op_add(a, b) {
  Cat(a, b)
}

test "tuple" {
  let tuple : ExtendDoc = Group(
    Text("(") + Nest(2, softline + Text("expr")) + softline + Text(")"),
  )
  inspect(tuple.render(width=40), content="(expr)")
  inspect(
    tuple.render(width=5),
    content=(
      #|(
      #|  expr
      #|)
    ),
  )
}
```

Here, `softline` is defined as a choice between `Empty` and `Line`. Since rendering starts in non-compact mode, we wrap the whole expression with `Group`. When the width is sufficient, the entire expression prints on one line; otherwise, it automatically wraps with indentation. To improve readability, we overloaded the `+` operator for `ExtendDoc`.

# Composition Functions

In practice, users rely more on higher-level combinators built from the `ExtendDoc` primitives—like the `softline` above. Let’s introduce some useful functions for structured printing.


## softline & softbreak

```moonbit
let softbreak : ExtendDoc = Choice(Text(" "), Line)
```

Similar to `softline`, except that in compact mode it inserts a space. Note that within the same `Group`, all `Choice`s follow the same compact or non-compact decision.

```moonbit
let abc : ExtendDoc = Text("abc")
let def : ExtendDoc = Text("def")
let ghi : ExtendDoc = Text("ghi")

test "softbreak" {
  let doc : ExtendDoc = Group(abc + softbreak + def + softbreak + ghi)
  inspect(doc.render(width=20), content="abc def ghi")
  inspect(
    doc.render(width=10),
    content=(
      #|abc
      #|def
      #|ghi
    ),
  )
}
```

## autoline & autobreak

```moonbit
let autoline : ExtendDoc = Group(softline)
let autobreak : ExtendDoc = Group(softbreak)
```

`autoline` and `autobreak` make sure the `ExtendDoc`s fit as much as possible on one line, like text editors do.

```moonbit
test {
  let doc : ExtendDoc = Group(
    abc + autobreak + def + autobreak + ghi,
  )
  inspect(doc.render(width=10), content="abc def ghi")
  inspect(
    doc.render(width=5),
    content=(
      #|abc def
      #|ghi
    ),
  )
  inspect(
    doc.render(width=3),
    content=(
      #|abc
      #|def
      #|ghi
    ),
  )
}
```

## sepby

```moonbit
fn sepby(xs : Array[ExtendDoc], sep : ExtendDoc) -> ExtendDoc {
  match xs {
    [] => Empty
    [x, .. xs] => xs.fold(init=x, (a, b) => a + sep + b)
  }
}
```

`sepby` inserts a separator `sep` between `ExtendDoc`s.

```moonbit
let comma : ExtendDoc = Text(",")
test {
  let layout = Group(sepby([abc, def, ghi], comma + softbreak))
  inspect(layout.render(width=40), content="abc, def, ghi")
  inspect(
    layout.render(width=10),
    content=(
      #|abc,
      #|def,
      #|ghi
    ),
  )
}
```

## surround

```moonbit
fn surround(m : ExtendDoc, l : ExtendDoc, r : ExtendDoc) -> ExtendDoc {
  l + m + r
}
```

`surround` wraps an `ExtendDoc` with left and right delimiters.

```moonbit
test {
  inspect(surround(abc, Text("("), Text(")")).render(), content="(abc)")
}
```

# Printing JSON

Using the functions above, we can implement a JSON prettyprinter. This function recursively processes each JSON element and generates the appropriate layout.

```moonbit
fn pretty(x : Json) -> ExtendDoc {
  fn comma_list(xs, l, r) {
    (Nest(2, softline + sepby(xs, comma + softbreak)) + softline)
    |> surround(l, r)
    |> Group
  }

  match x {
    Array(elems) => {
      let elems = elems.iter().map(pretty).collect()
      comma_list(elems, Text("["), Text("]"))
    }
    Object(pairs) => {
      let pairs = pairs
        .iter()
        .map(p => Group(Text(p.0.escape()) + Text(": ") + pretty(p.1)))
        .collect()
      comma_list(pairs, Text("{"), Text("}"))
    }
    String(s) => Text(s.escape())
    Number(i) => Text(i.to_string())
    False => Text("false")
    True => Text("true")
    Null => Text("null")
  }
}
```

When rendered, the JSON automatically adapts to different widths:

```moonbit
test {
  let json : Json = {
    "key1": "string",
    "key2": [12345, 67890],
    "key3": [
      { "field1": 1, "field2": 2 },
      { "field1": 1, "field2": 2 },
      { "field1": [1, 2], "field2": 2 },
    ],
  }
  inspect(
    pretty(json).render(width=80),
    content=(
      #|{
      #|  "key1": "string",
      #|  "key2": [12345, 67890],
      #|  "key3": [
      #|    {"field1": 1, "field2": 2},
      #|    {"field1": 1, "field2": 2},
      #|    {"field1": [1, 2], "field2": 2}
      #|  ]
      #|}
    ),
  )
  inspect(
    pretty(json).render(width=30),
    content=(
      #|{
      #|  "key1": "string",
      #|  "key2": [12345, 67890],
      #|  "key3": [
      #|    {"field1": 1, "field2": 2},
      #|    {"field1": 1, "field2": 2},
      #|    {
      #|      "field1": [1, 2],
      #|      "field2": 2
      #|    }
      #|  ]
      #|}
    ),
  )
  inspect(
    pretty(json).render(width=20),
    content=(
      #|{
      #|  "key1": "string",
      #|  "key2": [
      #|    12345,
      #|    67890
      #|  ],
      #|  "key3": [
      #|    {
      #|      "field1": 1,
      #|      "field2": 2
      #|    },
      #|    {
      #|      "field1": 1,
      #|      "field2": 2
      #|    },
      #|    {
      #|      "field1": [
      #|        1,
      #|        2
      #|      ],
      #|      "field2": 2
      #|    }
      #|  ]
      #|}
    ),
  )
}
```


# Conclusion

By combining a small set of primitives with function composition, we can build a flexible, declarative prettyprinter that adapts structured data layouts to the available screen width.

This approach scales well: you describe layout intentions with combinators like `sepby`, `surround`, or `autobreak`, and the rendering engine takes care of indentation, line breaks, and fitting.

The current implementation can be further optimized:

- Memoizing `space` calculations to improve performance.
- Adding a `ribbon` parameter to balance whitespace vs. content density
- Supporting advanced layouts like hanging indents or mandatory line breaks

For a deeper dive, see Philip Wadler’s classic paper [*A prettier printer* – Philip Wadler](https://homepages.inf.ed.ac.uk/wadler/papers/prettier/prettier.pdf), as well as prettyprinter libraries in Haskell, OCaml, and other languages.

