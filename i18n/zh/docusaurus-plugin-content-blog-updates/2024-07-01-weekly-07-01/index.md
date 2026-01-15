# weekly 2024-07-01

## MoonBit 更新

- 在没有歧义的情况下，enum构造器的使用可以省略类型前缀。比如现在可以直接使用 `Some(42)` 而不需要写 `Option::Some(42)`；如果当前环境中有两个类型 `T1` 和 `T2` 都定义了某个构造器 `C`，那么在使用的时候则需要通过上下文中的类型或者类型前缀指明是 `T1::C` 还是 `T2::C`，否则编译器会报错

- 添加 UInt64 内建类型，支持加、减、乘、除、模以及 `UInt64`/`Int64` 的互相转换。
```moonbit
fn main {
  let a = 0UL
  let b : UInt64 = 1UL
  println(a - b) //18446744073709551615
}
```

- 将 `!!` 后缀的语义修改为捕获函数调用中可能出现的错误，并返回 `Result` 类型，比如
```moonbit
fn f() -> Int!String { .. }
fn main {
  let res = f()!! // res: Result[Int, String]
  println(res)
}
```

- `moon test` 中支持使用错误类型表示测试失败的情况，比如
```moonbit
fn eq[T : Debug + Eq](a : T, b : T, ~loc : SourceLoc = _) -> Unit!String {
  if a != b {
    let a = debug_string(a)
    let b = debug_string(b)
    raise ("FAILED: \(loc) `\(a) == \(b)`")
  }
}

test "test_eq" {
  eq(1+2, 3)!
}
```

- 标准库中的 I/O 相关操作只保留了 `println`，其他操作将会在 `io` package 中提供

## 标准库更新

- 统一 `T::new()`/`T::make()` 等创建容器对象的函数风格，移除了 `T::with_capacity`

- 原先的 `iter` 和 `iteri` 重命名为 `each` 和 `eachi`，`iter_rev` 和 `iter_revi` 重命名为 `each_rev` 和 `eachi_rev`

- `as_iter` 重命名为`iter`

## 构建系统更新

- 预计将于本周开源

## 工具链更新

- 优化调试体验，现在⽤户可在 JavaScript Debug Terminal 中执⾏ `moon run --target js --debug` 进行调试

- `moon info` 和覆盖率工具适配错误类型和错误处理