---
description: 'MoonBit C-FFI 开发指南'
slug: moonbit-cffi
image: cover.png
---

# MoonBit C-FFI 开发指南

![](./cover.png)

---

## 引言

MoonBit 是一门现代化函数式编程语言，它有着严谨的类型系统，高可读性的语法，以及专为AI设计的工具链等。然而，重复造轮子并不可取。无数经过时间检验、性能卓越的库是用C语言（或兼容C ABI的语言，如C++、Rust）编写的。从底层硬件操作到复杂的科学计算，再到图形渲染，C的生态系统是一座蕴藏着无尽宝藏的富矿。

那么，我们能否让现代的MoonBit与这些经典的C库协同工作，让新世界的开拓者也能使用旧时代的强大工具呢？答案是肯定的。通过C语言外部函数接口（C Foreign Function Interface, C-FFI），MoonBit拥有调用C函数的能力，将新旧两个世界连接起来。

这篇文章将作为你的向导，带你一步步探索MoonBit C-FFI的奥秘。我们将通过一个具体的例子——为一个C语言编写的数学库 `mymath`​ 创建MoonBit绑定——来学习如何处理不同类型的数据、指针、结构体乃至函数指针。

## 预先准备

要连接到任何一个C库，我们需要知道这个C库的头文件的函数，如何找到头文件，如何找到库文件。对于我们这篇文章的任务来说。C语言数学库的头文件就是 `mymath.h`​。它定义了我们希望在MoonBit中调用的各种函数和类型。我们这里假设我们的`mymath`​是安装到系统上的，编译时使用`-I/usr/inluclude`​来找到头文件，使用`-L/usr/lib -lmymath`​来链接库，下面是我们的`mymath.h`​的部分内容。

```c
// mymath.h

// --- 基础函数 ---
void print_version();
int version_major();
int is_normal(double input);

// --- 浮点数计算 ---
float sinf(float input);
float cosf(float input);
float tanf(float input);
double sin(double input);
double cos(double input);
double tan(double input);

// --- 字符串与指针 ---
int parse_int(char* str);
char* version();
int tan_with_errcode(double input, double* output);

// --- 数组操作 ---
int sin_array(int input_len, double* inputs, double* outputs);
int cos_array(int input_len, double* inputs, double* outputs);
int tan_array(int input_len, double* inputs, double* outputs);

// --- 结构体与复杂类型 ---
typedef struct {
  double real;
  double img;
} Complex;

Complex* new_complex(double r, double i);
void multiply(Complex* a, Complex* b, Complex** result);
void init_n_complexes(int n, Complex** complex_array);

// --- 函数指针 ---
void for_each_complex(int n, Complex** arr, void (*call_back)(Complex*));
```

## 基础准备 (The Groundwork)

在编写任何 FFI 代码之前，我们需要先搭建好 MoonBit 与 C 代码之间的桥梁。

### 编译到 Native

首先，MoonBit 代码需要被编译成原生机器码。这可以通过以下命令完成：

```bash
moon build --target native
```

这个命令会将你的 MoonBit 项目编译成 C 代码，并使用系统上的 C 编译器（如 GCC 或 Clang）将其编译为最终的可执行文件。编译后的 C 文件位于 `target/native/release/build/`​ 目录下，按包名存放在相应的子目录中。例如，`main/main.mbt`​ 会被编译到 `target/native/release/build/main/main.c`​。

### 配置链接

仅仅编译是不够的，我们还需要告诉 MoonBit 编译器如何找到并链接到我们的 `mymath`​ 库。这需要在项目的 `moon.pkg.json`​ 文件中进行配置。

```json
{
  "supported-targets": ["native"],
  "link": {
    "native": {
      "cc": "clang",
      "cc-flags": "-I/usr/include",
      "cc-link-flags": "-L/usr/lib -lmymath"
    }
  }
}
```

- ​`cc`​: 指定用于编译C代码的编译器，例如 `clang`​ 或 `gcc`​。
- ​`cc-flags`​: 编译C文件时需要的标志，通常用来指定头文件搜索路径（`-I`​）。
- ​`cc-link-flags`​: 链接时需要的标志，通常用来指定库文件搜索路径（`-L`​）和具体要链接的库（`-l`​）。

同时，我们还需要一个 "胶水" C 文件，我们这里命名为 `cwrap.c`​，用来包含 C 库的头文件和 MoonBit 的运行时头文件。

```c
// cwrap.c
#include <mymath.h>
#include <moonbit.h>
```

这个胶水文件也需要通过 `moon.pkg.json`​ 告知 MoonBit 编译器：

```json
{
  // ... 其他配置
  "native-stub": ["cwrap.c"]
}
```

完成这些配置后，我们的项目就已经准备好与 `mymath`​ 库进行链接了。

## 第一次跨语言调用 (The First FFI Call)

万事俱备，让我们来进行第一次真正的跨语言调用。在 MoonBit 中声明一个外部 C 函数，语法如下：

```moonbit
extern "C" fn moonbit_function_name(arg: Type) -> ReturnType = "c_function_name"
```

- ​`extern "C"`​：告诉 MoonBit 编译器，这是一个外部 C 函数。
- ​`moonbit_function_name`​：在 MoonBit 代码中使用的函数名。
- ​`"c_function_name"`​：实际链接到的 C 函数的名称。

让我们用 `mymath.h`​ 中最简单的 `version_major`​ 函数来小试牛刀：

```moonbit
extern "C" fn version_major() -> Int = "version_major"
```

> **注意**：MoonBit 拥有强大的死代码消除（DCE）能力。如果你只是声明了上面的 FFI 函数但从未在代码中（例如 `main`​ 函数）实际调用它，编译器会认为它是无用代码，并不会在最终生成的 C 代码中包含它的声明。所以，请确保你至少在一个地方调用了它！

## 跨越类型系统的鸿沟 (Navigating the Type System Chasm)

真正的挑战在于处理两种语言之间的数据类型差异，对于一些复杂的类型情况，需要读者有一定的C语言知识。

### 3.1 基本类型：(Basic Types)

对于基础的数值类型，MoonBit 和 C 之间有直接且清晰的对应关系。

| MoonBit Type | C Type            | Notes                                               |
| ------------ | ----------------- | --------------------------------------------------- |
| ​`Int`​      | ​`int`​           |                                                     |
| ​`Int64`​    | ​`int64_t`​       |                                                     |
| ​`UInt`​     | ​`unsigned int`​  |                                                     |
| ​`UInt64`​   | ​`uint64_t`​      |                                                     |
| ​`Float`​    | ​`float`​         |                                                     |
| ​`Double`​   | ​`double`​        |                                                     |
| ​`Bool`​     | ​`int`​           | C语言标准没有原生 `bool`​，通常用 `int`​ (0/1) 表示 |
| ​`Unit`​     | ​`void`​ (返回值) | 用于表示 C 函数没有返回值的情况                     |
| ​`Byte`​     | ​`uint8_t`​       |                                                     |

根据这个表格，我们可以轻松地为 `mymath.h`​ 中的大部分简单函数编写 FFI 声明：

```moonbit
extern "C" fn print_version() -> Unit = "print_version"
extern "C" fn version_major() -> Int = "version_major"

// 返回值语义上是布尔值，使用 MoonBit 的 Bool 类型更清晰
extern "C" fn is_normal(input: Double) -> Bool = "is_normal"

extern "C" fn sinf(input: Float) -> Float = "sinf"
extern "C" fn cosf(input: Float) -> Float = "cosf"
extern "C" fn tanf(input: Float) -> Float = "tanf"

extern "C" fn sin(input: Double) -> Double = "sin"
extern "C" fn cos(input: Double) -> Double = "cos"
extern "C" fn tan(input: Double) -> Double = "tan"
```

### 3.2 字符串 (Strings)

事情在遇到字符串时开始变得有趣。你可能会想当然地把 C 的 `char*`​ 映射到 MoonBit 的 `String`​，但这是一个常见的陷阱。

​`MoonBit`​ 的 `String`​ 和 C 的 `char*`​ 在内存布局上完全不同。`char*`​ 是一个指向以 `\0`​ 结尾的字节序列的指针，而 `MoonBit`​ 的 `String`​ 是一个由 GC 管理的、包含长度信息和 UTF-16 编码数据的复杂对象。

**参数传递：从 MoonBit 到 C**

当我们需要将一个 MoonBit 字符串传递给一个接受 `char*`​ 的 C 函数时（如 `parse_int`​），我们需要手动进行转换。一个推荐的做法是将其转换为 `Bytes`​ 类型。

```moonbit
// 一个辅助函数，将 MoonBit String 转换为 C 期望的 null-terminated byte array
fn string_to_c_bytes(s: String) -> Bytes {
  let mut arr = s.to_bytes().to_array()
  // 确保以 \0 结尾
  if arr.last() != Some(0) {
    arr.push(0)
  }
  Bytes::from_array(arr)
}

// FFI 声明，注意参数类型是 Bytes
#borrow(s) // 告诉编译器我们只是借用 s，不要增加其引用计数
extern "C" fn __parse_int(s: Bytes) -> Int = "parse_int"

// 封装成一个对用户友好的 MoonBit 函数
fn parse_int(str: String) -> Int {
  let s = string_to_c_bytes(str)
  __parse_int(s)
}
```

> ​ **​`#borrow`​**​ **标记**
> ​`borrow`​ 标记是一个优化提示。它告诉编译器，C函数只是"借用"这个参数，不会持有它的所有权。这可以避免不必要的引用计数操作，防止潜在的内存泄漏。

**返回值：从 C 到 MoonBit**

反过来，当 C 函数返回一个 `char*`​ 时（如 `version`​），情况更加复杂。我们绝对不能直接将其声明为返回 `Bytes`​ 或 `String`​：

```moonbit
// 错误的做法！
extern "C" fn version() -> Bytes = "version"
```

这是因为 C 函数返回的只是一个裸指针，它缺少 MoonBit GC 所需的头部信息。直接这样转换会导致运行时崩溃。

正确的做法是，将返回的 `char*`​ 视为一个不透明的句柄，然后在 C "胶水" 代码中编写一个转换函数，手动将其转换为一个合法的 MoonBit 字符串。

**MoonBit 侧：**

```moonbit
// 1. 声明一个外部类型来代表 C 字符串指针
#extern
type CStr

// 2. 声明一个 FFI 函数，它调用 C 包装器
extern "C" fn CStr::to_string(self: Self) -> String = "cstr_to_moonbit_str"

// 3. 声明原始的 C 函数，它返回我们的不透明类型
extern "C" fn __version() -> CStr = "version"

// 4. 封装成一个安全的 MoonBit 函数
fn version() -> String {
  __version().to_string()
}
```

**C 侧 (在** **​`cwrap.c`​**​ **中添加):**

```c
#include <string.h> // for strlen

// 这个函数负责将 char* 正确地转换为带 GC 头的 moonbit_string_t
moonbit_string_t cstr_to_moonbit_str(char *ptr) {
  if (ptr == NULL) {
    return moonbit_make_string(0, 0);
  }
  int32_t len = strlen(ptr);
  // moonbit_make_string 会分配一个带 GC 头的 MoonBit 字符串对象
  moonbit_string_t ms = moonbit_make_string(len, 0);
  for (int i = 0; i < len; i++) {
    ms[i] = (uint16_t)ptr[i]; // 假设是 ASCII 兼容的
  }
  // 注意：是否需要 free(ptr) 取决于 C 库的 API 约定。
  // 如果 version() 返回的内存需要调用者释放，这里就需要 free。
  return ms;
}
```

这个模式虽然初看有些繁琐，但它保证了内存安全，是处理 C 字符串返回值的标准做法。

### 3.3 指针的艺术：传递引用与数组 (The Art of Pointers: Passing by Reference and Arrays)

C 语言大量使用指针来实现"输出参数"和传递数组。MoonBit 为此提供了专门的类型。

**单个值的"输出"参数**

当 C 函数使用指针来返回一个额外的值时，如 `tan_with_errcode(double input, double* output)`​，MoonBit 使用 `Ref[T]`​ 类型来对应。

```moonbit
extern "C" fn tan_with_errcode(input: Double, output: Ref[Double]) -> Int = "tan_with_errcode"
```

​`Ref[T]`​ 在 MoonBit 中是一个包含单个 `T`​ 类型字段的结构体。当它传递给 C 时，MoonBit 会传递这个结构体的地址。从 C 的角度看，一个指向 `struct { T val; }`​ 的指针和一个指向 `T`​ 的指针在内存地址上是等价的，因此可以直接工作。

**数组：传递数据集合**

当 C 函数需要处理一个数组时（例如 `double* inputs`​），MoonBit 使用 `FixedArray[T]`​ 类型来映射。`FixedArray[T]`​ 在内存中就是一块连续的 `T`​ 类型元素，其指针可以直接传递给 C。

```moonbit
extern "C" fn sin_array(len: Int, inputs: FixedArray[Double], outputs: FixedArray[Double]) -> Int = "sin_array"
extern "C" fn cos_array(len: Int, inputs: FixedArray[Double], outputs: FixedArray[Double]) -> Int = "cos_array"
extern "C" fn tan_array(len: Int, inputs: FixedArray[Double], outputs: FixedArray[Double]) -> Int = "tan_array"
```

### 3.4 外部类型：拥抱不透明的 C 结构体 (External Types: Embracing Opaque C Structs)

对于 C 中的 `struct`​，比如 `Complex`​，最佳实践通常是将其视为一个"不透明类型"（Opaque Type）。我们只在 MoonBit 中创建一个对它的引用（或句柄），而不关心其内部的具体字段。

这通过 `#extern type`​ 语法实现：

```moonbit
#extern
type Complex
```

这个声明告诉 MoonBit："存在一个名为 `Complex`​ 的外部类型。你不需要知道它的内部结构，只要把它当成一个指针大小的句柄来传递就行了。" 在生成的 C 代码中，`Complex`​ 类型会被处理成 `void*`​。这通常是安全的，因为所有对 `Complex`​ 的操作都是在 C 库内部完成的，MoonBit 侧只负责传递指针。

基于这个原则，我们可以为 `mymath.h`​ 中与 `Complex`​ 相关的函数编写 FFI：

```moonbit
// C: Complex* new_complex(double r, double i);
// 返回一个指向 Complex 的指针，在 MoonBit 中就是返回一个 Complex 句柄
extern "C" fn new_complex(r: Double, i: Double) -> Complex = "new_complex"

// C: void multiply(Complex* a, Complex* b, Complex** result);
// Complex* 对应 Complex，而 Complex** 对应 Ref[Complex]
extern "C" fn multiply(a: Complex, b: Complex, res: Ref[Complex]) -> Unit = "multiply"

// C: void init_n_complexes(int n, Complex** complex_array);
// Complex** 在这里作为数组使用，对应 FixedArray[Complex]
extern "C" fn init_n_complexes(n: Int, complex_array: FixedArray[Complex]) -> Unit = "init_n_complexes"
```

> **最佳实践：封装原生 FFI**
> 直接暴露 FFI 函数会让使用者感到困惑（比如 `Ref`​ 和 `FixedArray`​）。强烈建议在 FFI 声明之上再构建一层对 MoonBit 用户更友好的 API。
>
> ```moonbit
> // 在 Complex 类型上定义方法，隐藏 FFI 细节
> fn Complex::mul(self: Complex, other: Complex) -> Complex {
>   // 创建一个临时的 Ref 用于接收结果
>   let res: Ref[Complex] = Ref::{ val: new_complex(0, 0) }
>   multiply(self, other, res)
>   res.val // 返回结果
> }
>
> fn init_n(n: Int) -> Array[Complex] {
>   // 使用 FixedArray::make 创建数组
>   let arr = FixedArray::make(n, new_complex(0, 0))
>   init_n_complexes(n, arr)
>   // 将 FixedArray 转换为对用户更友好的 Array
>   Array::from_fixed_array(arr)
> }
> ```

### 3.5 函数指针：当 C 需要回调 MoonBit (Function Pointers: When C Needs to Call Back)

​`mymath.h`​ 中最复杂的函数是 `for_each_complex`​，它接受一个函数指针作为参数。

```c
void for_each_complex(int n, Complex** arr, void (*call_back)(Complex*));
```

一个常见的误解是试图将 MoonBit 的闭包类型 `(Complex) -> Unit`​ 直接映射到 C 的函数指针。这是不行的，因为 MoonBit 的闭包在底层是一个包含两部分的结构体：一个指向实际函数代码的指针，以及一个指向其捕获的环境数据的指针。

为了传递一个纯粹的、无环境捕获的函数指针，MoonBit 提供了 `FuncRef`​ 类型：

```moonbit
extern "C" fn for_each_complex(
  n: Int,
  arr: FixedArray[Complex],
  call_back: FuncRef[(Complex) -> Unit] // 使用 FuncRef 包装函数类型
) -> Unit = "for_each_complex"
```

任何被 `FuncRef`​ 包裹的函数类型，在传递给 C 时，都会被转换成一个标准的 C 函数指针。

> 如何声明一个`FuncRef`​？只要使用`let`​就可以了，只要函数没有捕获外部变量，就可以声明成功。
>
> ```moonbit
> fn print_complex(c: Complex) -> Unit { ... }
>
> fn main {
>   let print_complex : FuncRef[(Complex) -> Unit] = (c) => print_complex(c)
>   // ...
> }
> ```

## 第四站：高级课题——GC管理(Advanced Topic: GC Management)

我们已经了解了大部分类型的转换问题，但还有一个非常重大的问题：内存管理。C 依赖手动的 `malloc`​/`free`​，而 MoonBit 拥有自动的垃圾回收（GC）。当 C 库创建了一个对象（如 `new_complex`​），谁来负责释放它？

> **可以不要GC吗？** ​
>
> 一些库作者可能会选择不做GC，而是把所有的析构操作都留给用户。这种做法在一些库上有其合理性，因为有些库，例如一些高性能计算库，图形库等，为了提高性能或者稳定性，本身就会放弃掉一些GC特性，但带来的问题就是对程序员的水平要求较高。大多数库还是需要提供GC来增强用户体验的。

理想情况下，我们希望 MoonBit 的 GC 能够自动管理这些 C 对象的生命周期。MoonBit 提供了两种机制来实现这一点。

### 4.1 简单情况

如果 C 结构体非常简单，并且你确信它的内存布局在所有平台上都是稳定不变的，你可以直接在 MoonBit 中重新定义它。

```moonbit
// mymath.h: typedef struct { double real; double img; } Complex;
// MoonBit:
struct Complex {
  r: Double,
  i: Double
}
```

这样做，`Complex`​ 就成了一个真正的 MoonBit 对象。MoonBit 编译器会自动为它管理内存，添加 GC 头。当你把它传递给 C 函数时，MoonBit 会传递一个指向其数据部分的指针，这通常是可行的。

**但这种方法有很大的局限性**：

- 它要求你精确知道 C 结构体的内存布局、对齐方式等，这可能很脆弱。
- 如果 C 函数返回一个 `Complex*`​，你不能直接使用它。你必须像处理字符串返回值一样，编写一个 C 包装函数，将 C 结构体的数据**复制**到一个新创建的、带 GC 头的 MoonBit `Complex`​ 对象中。

因此，这种方法只适用于最简单的情况。对于大多数场景，我们推荐更健壮的析构方案。

### 4.2 复杂情况，使用析构函数（Finalizer） (The Complex Situation: Using Finalizers)

这是一种更通用和安全的方法。核心思想是：创建一个 MoonBit 对象来"包装"C 指针，并告诉 MoonBit 的 GC，当这个包装对象被回收时，应该调用一个特定的 C 函数（析构函数）来释放底层的 C 指针。

这个过程分为几步：

**1. 在 MoonBit 中声明两种类型**

```moonbit
#extern
type C_Complex // 代表原始的、不透明的 C 指针

type Complex C_Complex // 一个 MoonBit 类型，它内部包装了一个 C_Complex
```

​`type Complex C_Complex`​ 是一个特殊的声明，它创建了一个名为 `Complex`​ 的 MoonBit 对象类型，其内部有一个字段，类型为 `C_Complex`​。我们可以通过 `.inner()`​ 方法访问到这个内部字段。

**2. 在 C 中提供析构函数和包装函数**

我们需要一个 C 函数来释放 `Complex`​ 对象，以及一个函数来创建我们带 GC 功能的 MoonBit 包装对象。

**C 侧 (在** **​`cwrap.c`​**​ **中添加):**

```c
// mymath 库应该提供一个释放 Complex 的函数，假设是 free_complex
// void free_complex(Complex* c);

// 我们需要一个 void* 版本的析构函数给 MoonBit GC 使用
void free_complex_finalizer(void* obj) {
    // MoonBit 外部对象的布局是 { void (*finalizer)(void*); T data; }
    // 我们需要从 obj 中提取出真正的 Complex 指针
    // 假设 MoonBit 的 Complex 包装器只有一个字段
    Complex* c_obj = *((Complex**)obj);
    free_complex(c_obj); // 调用真正的析构函数, 如果mymath库提供的话
    // free(c_obj); // 如果是标准的 malloc 分配的
}

// 定义 MoonBit 的 Complex 包装器在 C 中的样子
typedef struct {
  Complex* val;
} MoonBit_Complex;

// 创建 MoonBit 包装对象的函数
MoonBit_Complex* new_mbt_complex(Complex* c_complex) {
  // `moonbit_make_external_obj` 是关键
  // 它创建一个由 GC 管理的外部对象，并注册其析构函数。
  MoonBit_Complex* mbt_complex = moonbit_make_external_obj(
      &free_complex_finalizer,
      sizeof(MoonBit_Complex)
  );
  mbt_complex->val = c_complex;
  return mbt_complex;
}
```

**3. 在 MoonBit 中使用包装函数**

现在，我们不直接调用 `new_complex`，而是调用我们的包装函数 `new_mbt_complex`。

```moonbit
// FFI 声明指向我们的 C 包装函数
extern "C" fn __new_managed_complex(c_complex: C_Complex) -> Complex = "new_mbt_complex"

// 原始的 C new_complex 函数返回一个裸指针
extern "C" fn __new_unmanaged_complex(r: Double, i: Double) -> C_Complex = "new_complex"

// 最终提供给用户的、安全的、GC 友好的 new 函数
fn Complex::new(r: Double, i: Double) -> Complex {
  let c_ptr = __new_unmanaged_complex(r, i)
  __new_managed_complex(c_ptr)
}
```

现在，当 `Complex::new` 创建的对象在 MoonBit 中不再被使用时，GC 会自动调用 `free_complex_finalizer`，从而安全地释放了 C 库分配的内存。

当需要将我们管理的 `Complex` 对象传递给其他 C 函数时，只需使用 `.inner()` 方法：

```moonbit
// 假设有一个C函数 `double length(Complex*);`
extern "C" fn length(c_complex: C_Complex) -> Double = "length"

fn Complex::length(self: Self) -> Double {
  // self.inner() 返回内部的 C_Complex (即 C 指针)
  length(self.inner())
}
```

## 结语 (Conclusion)

这篇文章带你从基本类型，到复杂的结构体类型，再到函数指针类型，梳理了在MoonBit中做C-FFI的流程。末尾讨论了MoonBit管理c对象的GC问题。希望对广大读者的库开发有帮助。
