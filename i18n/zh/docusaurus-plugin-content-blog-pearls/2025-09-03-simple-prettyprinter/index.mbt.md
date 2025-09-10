---
description: 'prettyprinter：使用函数组合解决结构化数据打印问题'
slug: simple-prettyprinter
image: cover.png
---

# prettyprinter：使用函数组合解决结构化数据打印问题

结构化数据的打印是编程中常见的问题，尤其是在调试和日志记录时。如何展示复杂的数据结构，并能够根据屏幕宽度调整排版？例如，对于一个数组字面量 `[a,b,c]` , 我们希望在屏幕宽度足够时打印为一行，而在屏幕宽度不足时自动换行并缩进。
传统的解决方案往往依赖于手动处理字符串拼接和维护缩进状态，这样的方式不仅繁琐，而且容易出错。

本篇文章将介绍一种基于函数组合的实用方案——prettyprinter的实现。Prettyprinter 向用户提供了一系列函数，
这些函数能够组合成一个描述了打印方式的Doc原语。然后，根据宽度配置和Doc原语生成最终的字符串。函数组合的思路使得用户能够复用已有的代码，声明式地实现数据结构的打印。

# SimpleDoc 原语

我们先定义一个SimpleDoc表示4个最简单的原语，来处理最基本的字符串拼接和换行。

```moonbit 
enum SimpleDoc {
  Empty
  Line
  Text(String)
  Cat(SimpleDoc, SimpleDoc)
}

```

- `Empty`: 表示空字符串 
- `Line`：表示换行 
- `Text(String)`: 表示一个不包含换行的文本片段
- `Cat(SimpleDoc, SimpleDoc)`: 按顺序组合两个 SimpleDoc

按照上面每个原语的定义，我们可以实现一个简单的渲染函数：这个函数使用一个栈来保存待处理的SimpleDoc，逐个将它们转换为字符串。

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

编写测试，可以看到SimpleDoc的表达能力和 `String` 相当: `Empty` 相当于 `""` ， `Line` 相当于 `"\n"` , `Text("a")` 相当于 `"a"` ， `Cat(Text("a"), Text("b"))` 相当于 `"a" + "b"` 。

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

目前它还和String一样无法方便地处理缩进和排版切换。不过，只要再添加三个原语就可以解决这些问题。

# ExtendDoc：Nest, Choice, Group

接下来我们在SimpleDoc的基础上，添加三个新的原语Nest、Choice、Group来处理更复杂的打印需求。

```moonbit
enum ExtendDoc {
  Empty
  Line
  Text(String)
  Cat(ExtendDoc, ExtendDoc)
  Nest(Int,ExtendDoc)
  Choice(ExtendDoc, ExtendDoc)
  Group(ExtendDoc)
}
```

* Nest
`Nest(Int, ExtendDoc)` 用于处理缩进。第一个参数表示缩进的空格数，第二个参数表示内部的 `ExtendDoc` 。当内部的 `ExtendDoc` 包含 `Line` 时，render函数将在打印换行的同时追加相应数量的空格。 `Nest` 嵌套使用时缩进会累加。

* Choice
`Choice(ExtendDoc, ExtendDoc)` 保存了两种打印方式。通常第一个参数表示不包含换行更紧凑的布局，第二个参数则是包含 `Line` 的布局。当render在紧凑模式时，使用第一个布局，否则使用第二个。

* Group
`Group(ExtendDoc)` 将ExtendDoc分组，并根据 `ExtendDoc` 的长度和剩余的空间切换打印 `ExtendDoc` 时的模式。如果剩余空间足够，则在紧凑模式下打印，否则使用包含换行的布局。

## 计算所需空间

Group的实现需要计算 `ExtendDoc` 的空间需求，以便决定是否使用紧凑模式。我们可以为 `ExtendDoc` 添加一个 `space()` 方法来计算每个布局片段所需的空间。

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

对于 `Line` , 我们假设它总是需要占用无限大的空间。这样如果 `Group` 内包含 `Line`，能够保证render处理内部的 `ExtendDoc` 时不会进入紧凑模式。

## 实现 ExtendDoc::render

我们在`SimpleDoc::render`的基础上实现 `ExtendDoc::render` 。 render在打印完一个子结构后，继续打印后续的结构需要退回到原先的缩进层级，因此需要在`stack`中额外保存每个待打印的`ExtendDoc`的两个状态：缩进和是否在紧凑模式。我们还需要维护了一个在render过程中更新的 `column` 变量，表示当前行的已经使用的字符数，以计算当前行所剩的空间。另外，函数增加了额外的`width`参数，表示每行的最大宽度限制。

```moonbit
fn ExtendDoc::render(doc : ExtendDoc, width~ : Int = 80) -> String {
  let buf = StringBuilder::new()
  let stack = [(0, false, doc)] // 默认不缩进，非紧凑模式
  let mut column = 0
  while stack.pop() is Some((indent, fit, doc)) {
    match doc {
      Empty => ()
      Line => {
        buf..write_string("\n")
        // 在换行后打印需要的缩进
        for _ in 0..<indent {
          buf.write_string(" ")
        }
        // 重置当前行的字符数
        column = indent
      }
      Text(text) => {
        buf.write_string(text)
        // 更新当前行的字符数
        column += text.length()
      }
      Cat(left, right) =>
        stack..push((indent, fit, right))..push((indent, fit, left))
      Nest(n, doc) => stack..push((indent + n, fit, doc)) // 增加缩进
      Choice(a, b) =>
        stack.push(if fit { (indent, fit, a) } else { (indent, fit, b) })
      Group(doc) => {
        // 如果已经在紧凑模式下，直接使用紧凑布局。如果不在紧凑模式下，但是要打印的内容可以放入当前行，则进入紧凑模式。
        let fit = fit || column + doc.space() <= width
        stack.push((indent, fit, doc))
      }
    }
  }
  buf.to_string()
}
```

下面我们尝试用 `ExtendDoc` 描述一个 `(expr)` ，并在不同的宽度配置下打印它：

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

我们先通过组合`Empty`和`Line`的方式定义了一个在紧凑模式下不换行的 `softline` 。render默认以非紧凑模式开始打印，所以我们需要用 `Group` 将整个表达式包裹起来。这样在宽度足够时，整个表达式会打印为一行，而在宽度不足时会自动换行并缩进。为了减少嵌套的括号，改善可读性，这里给 `ExtendDoc` 重载了 `+` 运算符。

# 组合函数

在prettyprinter的实践中，用户更多地会使用在 `ExtendDoc` 原语基础之上组合出的函数——例如之前使用过的 `softline` 。下面将介绍一些实用的函数，帮助我们解决结构化打印的问题。

## softline & softbreak

```moonbit
let softbreak : ExtendDoc = Choice(Text(" "), Line)
```

和 `softline` 类似，不同的是在紧凑模式下它会加入额外的空格。注意在同一层 `Group` 中，每个 `Choice` 都会一致选择紧凑或非紧凑模式。


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

`autoline` 和 `autobreak` 实现一种类似于文字编辑器的排版：尽可能多地将内容放进一行内，溢出则换行。


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

`sepby`会在`ExtendDoc`之间插入分隔符`sep`。

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

`surround` 用于在 `ExtendDoc` 的两侧添加括号或其他分隔符。

```moonbit
test {
  inspect(surround(abc, Text("("), Text(")")).render(), content="(abc)")
}
```

# 打印Json

利用上面定义的函数，我们可以实现一个打印Json的函数。这个函数将递归地处理Json的每个元素，生成相应的布局。

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

可以看到在不同的打印宽度下，Json的排版会自动调整。

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

# 总结

本文介绍了如何简单实现一个prettyprinter，使用函数组合的方式来处理结构化数据的打印。通过定义一系列原语和组合函数，我们可以灵活地控制打印格式，并根据屏幕宽度自动调整布局。

当前的实现还可以进一步优化，例如通过记忆化space的计算来提高性能。`ExtendDoc::render`函数可以增加一个`ribbon`参数，分别统计当前行的空格和其他文本字数，并且在`Group`的紧凑模式判断中增加额外的条件，来控制每行的信息密度。另外，还可以增加更多的原语来实现悬挂缩进、最小换行数量等功能。对于更多的设计和实现细节感兴趣的读者，可以参考[A prettier printer - Philip Wadler](https://homepages.inf.ed.ac.uk/wadler/papers/prettier/prettier.pdf)以及Haskell、OCaml等语言的prettyprinter实现。
