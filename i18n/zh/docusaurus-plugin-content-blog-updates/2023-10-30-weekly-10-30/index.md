# weekly 2023-10-30

<!--truncate-->

## MoonBit更新

### 1. 添加 `Js_string` 类型

添加 `Js_string` 类型，支持从 MoonBit 传递字符串到 JavaScript 宿主环境。比如如下程序会在控制台输出 "Hello, Js_string!"

```
fn init {
  let x = Js_string::new("Hello, ")
  let y = Js_string::new("Js_string!")
  let z = x + y
  z.log()
}
```

MoonBit与JS之间的字符串互操作依赖于 FFI 和定制的 JS 运行时，我们的 online playground 很快会提供定制 JS 运行时的功能

### 2. Double 类型支持` to_string` 方法

Double 类型支持` to_string` 方法，现在可以直接使用 `println` 打印一个浮点数了。

```
fn init {
  println(3.14)
}
```

### 3. 对只有一个不可变字段的结构体进行了拆箱（Unboxing）优化。

例如，对于如下代码，原本 `x` 是一个结构体，需要在堆上分配内存。经过优化后直接用一个` i32` 整数来代替 `x`，避免了结构体的内存分配和访问结构体字段的开销。

```
struct X {
  val : Int
}

fn init {
  let x : X = { val: 42 }
  println(x.val)
}
```

## IDE与构建系统

### 1. `moon build` 现在默认输出 wasm 二进制格式

`moon build` 现在默认输出 wasm 二进制格式，不再需要依赖外部工具 `wat2wasm` 进行转换。同时提供 `--output-wat` 选项用于输出 wat 格式。

### 2. 提供 MoonBit Windows 工具链下载

提供MoonBit Windows工具链下载，目前可能会存在一些兼容性问题，欢迎试用并反馈。

链接是：
https://www.moonbitlang.cn/download/
![截屏2023-10-30 17.58.16|690x115](./windows.png)
