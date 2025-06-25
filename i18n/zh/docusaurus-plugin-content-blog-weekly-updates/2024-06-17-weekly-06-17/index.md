# weekly 2024-06-17

## MoonBit 更新

- **支持了错误处理机制**

1) 函数返回值类型可以用 `Int!String` 来标识这个函数正常情况下返回 `Int` ，错误情况下会抛出类型为 `String` 的错误值，比如
```moonbit
fn div(x: Int, y: Int) -> Int!String { .. }
```

2) `raise` 关键字用于中断当前控制流，直接抛出错误，比如
```moonbit
fn div(x: Int, y: Int) -> Int!String {
  if y == 0 { raise "divide by 0" }
  x / y
}
```

3) `try { expr0 } catch { pattern1 => expr1; pattern2 => expr2; .. }` 表达式可以用于捕获 `expr0` 中抛出的错误，并对其进行模式匹配来处理，比如下面这个函数调用上面的 `div` 函数，并在 `div` 函数抛出错误的时候将错误信息打印，并返回默认值
```moonbit
fn div_with_default(x: Int, y: Int, default: Int) -> Int {
  try {
    div(x, y)!
  } catch {
    s => { println(s); default }
  }
}
```

4) 此外，可以用后缀运算符 `!` 和 `!!` 进行错误处理，这些后缀运算符只能应用于函数调用，其中：
`f(x)!` 将调用 `f` 的过程中发生的错误立即重新抛出。
`f(x)!!` 则会在 `f` 发生错误的情况下直接 panic，其等价于
```moonbit
try { f(x)! } catch { _ => panic() }
```
函数调用的形式包括方法调用，中缀运算符和管道运算符的调用，比如
```moonbit
fn init {
  let _ = x.f()!!
  let _ = (x + y)!!
  let _ = (x |> f)!!
}
```

5) 最后，对可能会抛出错误的函数如果没有使用上述任何错误处理，那么则会报 unhandled error 的错误

- 支持 `Map` 字面量语法：
```moonbit
fn init {
  // 键必须是字面量
  let m1 : Map[String, Int] = { "x": 1, "y": 2 }
  let m2 : Map[Int, String] = { 1: "x", 2: "y" }
}
```

## IDE更新

- 修复了 IDE 在补全过程中 builtin package 中的方法会重复出现两次的 bug

- 修复了 IDE 中缺少 Byte 相关的补全功能

## 构建系统更新

- 添加对 internal 包的支持，这些包被放在名为 `internal` 的目录中。internal 包只能被以 `internal` 的父目录为根的包导入。
    例如，如果有一个包的路径为 `username/hello/x/internal/a`，该 internal 包的父目录为 `username/hello/x`，那么只有包`username/hello/x` 或其子包（例如 `username/hello/x/a`）能够导入`username/hello/x/internal/a`，而`username/hello/y`则不能导入该包。