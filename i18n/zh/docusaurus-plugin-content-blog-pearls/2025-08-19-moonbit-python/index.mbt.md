---
moonbit:
  deps:
    Kaida-Amethyst/matplotlib: 0.1.4
  backend: native
description: 'MoonBit与Python集成指南'
slug: moonbit-python
image: cover.png
---

# MoonBit与Python集成指南

## 引言

Python，以其简洁的语法和庞大的生态系统，已成为当今最受欢迎的编程语言之一。然而，围绕其性能瓶颈和动态类型系统在大型项目中的维护性问题的讨论也从未停止。为了解决这些挑战，开发者社区探索了多种优化路径。

MoonBit 官方推出的 `python.mbt` 工具为此提供了一个新的视角。它允许开发者在 MoonBit 环境中直接调用 Python 代码。这种结合旨在融合 MoonBit 的静态类型安全、高性能潜力与 Python 成熟的生态系统。通过 `python.mbt`，开发者可以在享受 Python 丰富库函数的同时，利用 MoonBit 的静态分析能力、现代化的构建与测试工具，为构建大规模、高性能的系统级软件提供可能。

本文旨在深入探讨 `python.mbt` 的工作原理，并提供一份实践指南。本文将解答一些常见问题，例如：`python.mbt` 如何工作？它是否会因为增加了一个中间层而比原生 Python 更慢？相较于 C++ 的 `pybind11` 或 Rust 的 `PyO3` 等现有工具，`python.mbt` 的优势何在？要回答这些问题，我们首先需要理解 Python 解释器的基本工作流程。

## Python 解释器的工作原理

Python 解释器执行代码主要经历三个阶段：

1. **解析阶段 (Parsing)** ：此阶段包含词法分析和语法分析。解释器将人类可读的 Python 源代码分解成一个个标记（Token），然后根据语法规则将这些标记组织成一个树形结构，即抽象语法树（AST）。

   例如，对于以下 Python 代码：

   ```python
   def add(x, y):
     return x + y

   a = add(1, 2)
   print(a)
   ```

   我们可以使用 Python 的 `ast` 模块来查看其生成的 AST 结构：

   ```plaintext
   Module(
       body=[
           FunctionDef(
               name='add',
               args=arguments(
                   args=[
                       arg(arg='x'),
                       arg(arg='y')]),
               body=[
                   Return(
                       value=BinOp(
                           left=Name(id='x', ctx=Load()),
                           op=Add(),
                           right=Name(id='y', ctx=Load())))]),
           Assign(
               targets=[
                   Name(id='a', ctx=Store())],
               value=Call(
                   func=Name(id='add', ctx=Load()),
                   args=[
                       Constant(value=1),
                       Constant(value=2)])),
           Expr(
               value=Call(
                   func=Name(id='print', ctx=Load()),
                   args=[
                       Name(id='a', ctx=Load())]))])
   ```

2. **编译阶段 (Compilation)** ：接下来，Python 解释器会将 AST 编译成更低级、更线性的中间表示，即字节码（Bytecode）。这是一种平台无关的指令集，专为 Python 虚拟机（PVM）设计。

   利用 Python 的 `dis` 模块，我们可以查看上述代码对应的字节码：

   ```plaintext
     2           LOAD_CONST               0 (<code object add>)
                 MAKE_FUNCTION
                 STORE_NAME               0 (add)

     5           LOAD_NAME                0 (add)
                 PUSH_NULL
                 LOAD_CONST               1 (1)
                 LOAD_CONST               2 (2)
                 CALL                     2
                 STORE_NAME               1 (a)

     6           LOAD_NAME                2 (print)
                 PUSH_NULL
                 LOAD_NAME                1 (a)
                 CALL                     1
                 POP_TOP
                 RETURN_CONST             3 (None)
   ```

3. **执行阶段 (Execution)** ：最后，Python 虚拟机（PVM）会逐条执行字节码指令。每条指令都对应 CPython 解释器底层的一个 C 函数调用。例如，`LOAD_NAME` 会查找变量，`BINARY_OP` 会执行二元运算。**正是这个逐条解释执行的过程，构成了 Python 性能开销的主要来源**。一次简单的 `1 + 2` 运算，背后需要经历整个解析、编译和虚拟机执行的复杂流程。

了解这个流程，有助于我们理解 Python 性能优化的基本思路，以及 `python.mbt` 的设计哲学。

## 优化 Python 性能的路径

目前，提升 Python 程序性能主要有两种主流方法：

1. **即时编译（JIT）** 。像 PyPy 这样的项目，通过分析正在运行的程序，将频繁执行的"热点"字节码编译成高度优化的本地机器码，从而绕过 PVM 的解释执行，大幅提升计算密集型任务的速度。然而，JIT 并非万能药，它无法解决 Python 动态类型语言的固有问题，例如在大型项目中难以进行有效的静态分析，这给软件维护带来了挑战。
2. **原生扩展**。开发者可以使用 C++（借助 `pybind11`）或 Rust（借助 `PyO3`）等语言直接调用Python功能，或者用这些语言来编写性能关键模块，然后从 Python 中调用。这种方法可以获得接近原生的性能，但它要求开发者同时精通 Python 和一门复杂的系统级语言，学习曲线陡峭，对大多数 Python 程序员来说门槛较高。

`python.mbt` 也是一种原生扩展。但相比较于C++和Rust等语言，它试图在性能、易用性和工程化能力之间找到一个新的平衡点，更强调在MoonBit语言中直接使用Python功能。

1. **高性能核心**：MoonBit 是一门静态类型的编译型语言，其代码可以被高效地编译成原生机器码。开发者可以将计算密集型逻辑用 MoonBit 实现，从根本上获得高性能。
2. **无缝的 Python 调用**：`python.mbt` 直接与 CPython 的 C-API 交互，调用 Python 模块和函数。这意味着调用开销被最小化，绕过了 Python 的解析和编译阶段，直达虚拟机执行层。
3. **更平缓的学习曲线**：相较于 C++ 和 Rust，MoonBit 的语法设计更加现代化和简洁，并拥有完善的函数式编程支持、文档系统、单元测试和静态分析工具，对习惯于 Python 的开发者更加友好。
4. **改善的工程化与 AI 协作**：MoonBit 的强类型系统和清晰的接口定义，使得代码意图更加明确，更易于被静态分析工具和 AI 辅助编程工具理解。这有助于在大型项目中维护代码质量，并提升与 AI 协作编码的效率和准确性。

## 在 MoonBit 中使用已封装的 Python 库

为了方便开发者使用，MoonBit 官方会在构建系统和IDE成熟后对主流 Python 库进行封装。封装完成后，用户可以像导入普通 MoonBit 包一样，在项目中使用这些 Python 库。下面以 `matplotlib` 绘图库为例。

首先，在你的项目根目录的 `moon.pkg.json` 或终端中添加 `matplotlib` 依赖：

```bash
moon update
moon add Kaida-Amethyst/matplotlib
```

然后，在要使用该库的子包的 `moon.pkg.json` 中声明导入。这里，我们遵循 Python 的惯例，为其设置一个别名 `plt`：

```json
{
  "import": [
    {
      "path": "Kaida-Amethyst/matplotlib",
      "alias": "plt"
    }
  ]
}
```

完成配置后，便可以在 MoonBit 代码中调用 `matplotlib` 进行绘图：

```moonbit
let sin : (Double) -> Double = @math.sin

fn main {
  let x = Array::makei(100, fn(i) { i.to_double() * 0.1 })
  let y = x.map(sin)

  // 为保证类型安全，封装后的 subplots 接口总是返回一个固定类型的元组。
  // 这避免了 Python 中根据参数返回不同类型对象的动态行为。
  let (_, axes) = plt::subplots(1, 1)

  // 使用 .. 级联调用语法
  axes[0][0]
  ..plot(x, y, color = Green, linestyle = Dashed, linewidth = 2)
  ..set_title("Sine of x")
  ..set_xlabel("x")
  ..set_ylabel("sin(x)")

  @plt.show()
}
```

目前，在 macOS 和 Linux 环境下，MoonBit 的构建系统可以自动处理依赖。在 Windows 上，用户可能需要手动安装 C 编译器并配置 Python 环境。未来的 MoonBit IDE 将致力于简化这一过程。

![](https://libraryimgs-1309485105.cos.ap-guangzhou.myqcloud.com/matplotlib.mbt.example.png)

## 在 MoonBit 中使用未封装的 Python 模块

Python 生态浩如烟海，即使现在有了AI技术，完全依赖官方封装也并不现实。幸运的是，我们可以利用 `python.mbt` 的核心功能直接与任何 Python 模块交互。下面，我们以 Python 标准库中，一个简单的的 `time` 模块为例，演示这一过程。

### 引入 python.mbt

首先，确保你的 MoonBit 工具链是最新版本，然后添加 `python.mbt` 依赖：

```bash
moon update
moon add Kaida-Amethyst/python
```

接着，在你的包的 `moon.pkg.json` 中导入它：

```json
{
  "import": ["Kaida-Amethyst/python"]
}
```

`python.mbt` 会自动处理 Python 解释器的初始化（`Py_Initialize`）和关闭，开发者无需手动管理。

### 导入 Python 模块

使用 `@python.pyimport` 函数来导入模块。为了避免重复导入造成的性能损耗，建议使用闭包技巧来缓存导入的模块对象：

```moonbit
// 定义一个结构体来持有 Python 模块对象，增强类型安全
pub struct TimeModule {
  time_mod: PyModule
}

// 定义一个函数，它返回一个闭包，该闭包用于获取 TimeModule 实例
fn import_time_mod() -> () -> TimeModule {
  // 仅在首次调用时执行导入操作
  guard @python.pyimport("time") is Some(time_mod) else {
    println("Failed to load Python module: time")
    panic("ModuleLoadError")
  }
  let time_mod = TimeModule::{ time_mod }
  // 返回的闭包会捕获 time_mod 变量
  fn () { time_mod }
}

// 创建一个全局的 time_mod "getter" 函数
let time_mod: () -> TimeModule = import_time_mod()
```

在后续代码中，我们应始终通过调用 `time_mod()` 来获取模块，而不是 `import_time_mod`。

### MoonBit 与 Python 对象的相互转换

要调用 Python 函数，我们需要在 MoonBit 对象和 Python 对象（`PyObject`）之间进行转换。

1. **整数**: 使用 `PyInteger::from` 从 `Int64` 创建 `PyInteger`，使用 `to_int64()` 反向转换。

   ```moonbit
   test "py_integer_conversion" {
     let n: Int64 = 42
     let py_int = PyInteger::from(n)
     inspect(py_int, content="42")
     assert_eq(py_int.to_int64(), 42L)
   }
   ```

2. **浮点数**: 使用 `PyFloat::from` 和 `to_double`。

   ```moonbit
   test "py_float_conversion" {
     let n: Double = 3.5
     let py_float = PyFloat::from(n)
     inspect(py_float, content="3.5")
     assert_eq(py_float.to_double(), 3.5)
   }
   ```

3. **字符串**: 使用 `PyString::from` 和 `to_string`。

   ```moonbit
   test "py_string_conversion" {
     let py_str = PyString::from("hello")
     inspect(py_str, content="'hello'")
     assert_eq(py_str.to_string(), "hello")
   }
   ```

4. **列表 (List)** : 你可以创建一个空 `PyList` 然后 `append` 元素，或者直接从一个 `Array[&IsPyObject]` 创建。

   ```moonbit
   test "py_list_from_array" {
     let one = PyInteger::from(1)
     let two = PyFloat::from(2.0)
     let three = PyString::from("three")
     let arr: Array[&IsPyObject] = [one, two, three]

     let list = PyList::from(arr)
     inspect(list, content="[1, 2.0, 'three']")
   }
   ```

5. **元组 (Tuple)** : `PyTuple` 需要先指定大小，然后通过 `set` 方法逐一填充元素。

   ```moonbit
   test "py_tuple_creation" {
     let tuple = PyTuple::new(3)
     tuple
     ..set(0, PyInteger::from(1))
     ..set(1, PyFloat::from(2.0))
     ..set(2, PyString::from("three"))

     inspect(tuple, content="(1, 2.0, 'three')")
   }
   ```

6. **字典 (Dict)** : `PyDict` 主要支持字符串作为键。使用 `new` 创建字典，`set` 添加键值对。对于非字符串键，需要使用 `set_by_obj`。

   ```moonbit
   test "py_dict_creation" {
     let dict = PyDict::new()
     dict
     ..set("one", PyInteger::from(1))
     ..set("two", PyFloat::from(2.0))

     inspect(dict, content="{'one': 1, 'two': 2.0}")
   }
   ```

从 Python 复合类型中获取元素时，`python.mbt` 会进行运行时类型检查，并返回一个 `Optional[PyObjectEnum]`，以确保类型安全。

```moonbit
test "py_list_get" {
  let list = PyList::new()
  list.append(PyInteger::from(1))
  list.append(PyString::from("hello"))

  inspect(list.get(0).unwrap(), content="PyInteger(1)")
  inspect(list.get(1).unwrap(), content="PyString('hello')")
  inspect(list.get(2), content="None") // 索引越界返回 None
}
```

### 调用模块中的函数

调用函数分为两步：首先用 `get_attr` 获取函数对象，然后用 `invoke` 执行调用。`invoke` 的返回值是一个需要进行模式匹配和类型转换的 `PyObject`。

下面是 `time.sleep` 和 `time.time` 的 MoonBit 封装：

```moonbit
// 封装 time.sleep
pub fn sleep(seconds: Double) -> Unit {
  let lib = time_mod()
  guard lib.time_mod.get_attr("sleep") is Some(PyCallable(f)) else {
    println("get function `sleep` failed!")
    panic()
  }
  let args = PyTuple::new(1)
  args.set(0, PyFloat::from(seconds))
  match (try? f.invoke(args)) {
    Ok(_) => Ok(())
    Err(e) => {
      println("invoke `sleep` failed!")
      panic()
    }
  }
}

// 封装 time.time
pub fn time() -> Double {
  let lib = time_mod()
  guard lib.time_mod.get_attr("time") is Some(PyCallable(f)) else {
    println("get function `time` failed!")
    panic()
  }
  match (try? f.invoke()) {
    Ok(Some(PyFloat(t))) => t.to_double()
    _ => {
      println("invoke `time` failed!")
      panic()
    }
  }
}
```

完成封装后，我们就可以在 MoonBit 中以类型安全的方式使用它们了：

```moonbit
test "sleep" {
  let start = time().unwrap()
  sleep(1)
  let end = time().unwrap()

  println("start = \{start}")
  println("end = \{end}")
}
```

## 实践建议

1. **明确边界**：将 `python.mbt` 视为连接 MoonBit 和 Python 生态的"胶水层"。将核心计算和业务逻辑保留在 MoonBit 中以利用其性能和类型系统优势，仅在必要情况下，需要调用 Python 独有库时才使用 `python.mbt`。
2. **用 ADT 替代字符串魔法**：许多 Python 函数接受特定的字符串作为参数来控制行为。在 MoonBit 封装中，应将这些"魔法字符串"转换为**代数数据类型（ADT）** ，即枚举。这利用了 MoonBit 的类型系统，将运行时的值检查提前到编译时，极大地增强了代码的健壮性。
3. **完善的错误处理**：本文中的示例为了简洁使用了 `panic` 或返回简单字符串。在生产代码中，应定义专门的错误类型，并通过 `Result` 类型进行传递和处理，提供清晰的错误上下文。
4. **映射关键字参数**：Python 函数广泛使用关键字参数（kwargs），如 `plot(color='blue', linewidth=2)`。这可以优雅地映射到 MoonBit 的**标签参数（Labeled Arguments）** 。在封装时，应优先使用标签参数以提供相似的开发体验。

   例如，一个接受 `kwargs` 的 Python 函数：

   ```python
   # graphics.py
   def draw_line(points, color="black", width=1):
       # ... drawing logic ...
       print(f"Drawing line with color {color} and width {width}")
   ```

   其 MoonBit 封装可以设计成：

   ```moonbit no check
   fn draw_line(points: Array[Point], color~: Color = Black, width: Int = 1) -> Unit {
     let points : PyList = ... // convert Array[Point] to PyList

     // 构造args
     let args = PyTuple::new(1)
     args .. set(0, points)

     // 构造kwargs
     let kwargs = PyDict::new()
     kwargs
     ..set("color", PyString::from(color))
     ...set("width", PyInteger::from(width))
     match (try? f.invoke(args~, kwargs~)) {
       Ok(_) => ()
       _ => {
         // 进行错误处理
       }
     }
   }
   ```

5. **警惕动态性**：始终牢记 Python 是动态类型的。从 Python 获取的任何数据都应被视为"不可信"的，必须进行严格的类型检查和校验，尽量避免使用 `unwrap`，而是通过模式匹配来安全地处理所有可能的情况。

## 结语

本文梳理了 `python.mbt` 的工作原理，并展示了如何利用它在 MoonBit 中调用 Python 代码，无论是通过预封装的库还是直接与 Python 模块交互。`python.mbt` 不仅仅是一个工具，它代表了一种融合思想：将 MoonBit 的静态分析、高性能和工程化优势与 Python 庞大而成熟的生态系统相结合。我们希望这篇文章能为 MoonBit 和 Python 社区的开发者们在构建未来软件时，提供一个新的、更强大的选择。
