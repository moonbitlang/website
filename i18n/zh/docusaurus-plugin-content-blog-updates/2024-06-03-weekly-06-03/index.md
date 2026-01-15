# weekly 2024-06-03

## MoonBit更新
- 类型标注增加了新的语法`T?` 来表示`Option[T]`
```moonbit
struct Cell[T] {
  val: T
  next: Cell[T]?
}

fn f(x : Cell[T]?) -> Unit { ... }
```

相当于
```moonbit
struct Cell[T] {
  val: T
  next: Option[Cell[T]]
}

fn f(x : Option[Cell[T]]) -> Unit { ... }
```
旧的`Option[T]`仍然兼容，但是推荐使用更简短的新语法。moonfmt也会将`Option[T]`格式化为`T?`。

- 核心库 API 整理工作继续进行
  - Iter包被合入了builtin包。现在使用`Iter[T]`不需要`@iter.`前缀
```moonbit
pub fn any[T](xs : Iter[T], predicate : (T) -> Bool) -> Bool {
                // ^不需要@iter.
  match xs.find_first(predicate) {
    None => false
    Some(_) => true
  }
}
```
  - `Stack`包被移入`moonbitlang/x`。
  - 移除了List包，以及各类数据结构的`to_list`和`from_list`函数。对于数据结构间转换和中间的表示结构，推荐使用`Iter[T]`与`Array[T]`。
- 性能提升
  - 编译器现在会在分离编译的阶段进行一部分的闭包转化，从而改进了编译性能，并且对 JavaScript 后端生成的代码在特定情况下也进行了闭包转化
  - `Option[Bool]`, `Option[Char]`, `Option[Byte]`, `Option[Unit]` 这些类型使用32位整数表示，其中 `None` 对应的值为 -1, `Some(x)` 对应的值为 `x`; `Option[Int]` 类型在 wasm 后端使用 64 位整数表示，其中 `None` 对应的值为 `0x1_0000_0000`, `Some(x)` 对应的值为 `x`, `Option[Int]`在 JavaScript 后端使用 `int | undefined` 表示，其中 `undefined` 表示 `None`
- `abort`行为变更
  - 为了解除Wasm程序对于非标准的`spectest.print_char`的依赖，正在重构错误输出功能。
  - `abort`将不会利用`spectest.print_char`打印错误信息，行为与`panic`相同，等待功能进一步完善。

## 插件更新

- 【语言服务器】修复了内存泄露的问题