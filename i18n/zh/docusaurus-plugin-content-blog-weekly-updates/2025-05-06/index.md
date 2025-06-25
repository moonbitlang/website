# 2025-05-06

## 语言更新

- 【Breaking Change】Trait 的实现方式将发生改动，未来将只支持通过 `impl T for A ...` 对类型 `A` 显式实现 `trait T`；仅对 `A` 实现同签名的方法不再视为对 `A` 实现了 `trait T`。该改动之前已在编译器中提供警告，近期将会正式生效。

- 新增语法糖，允许使用 `_` 作为待定参数占位符以简化匿名函数的创建，如 `f(a, _, c, _)` 等效于 `fn(b, d) { f(a, b, c, d) }`。目前支持的使用场景有：
  - `Constructor(args, _)`, `lhs |> Constructor(args, _)`
  - `function(args, _)`, `lhs |> function(args, _)`
  - `object.method(args, _)`（暂不支持 `_.method(args)`）

- `fnalias` 支持给类型和 `trait` 的方法创建别名：

```moonbit
trait Floating {
  sin(Self) -> Self
  cos(Self) -> Self
}

// 接下来可以直接使用 `sin` 和 `cos`，不需要加 `Floating::`
pub fnalias Floating::(sin, cos)
```

- 移除了所有 pragmas，未来将全面使用 attributes 替代。

- 实现了 `#internal` attribute，用于为 public API 的外部用户提供警告：

```moonbit
/// in moonbitlang/core
#internal(unsafe, "message")
pub fn unsafe_get(args){...}

/// in user/module
fn main {
  unsafe_get(...) // warning!
}
```

用户可以在 `moon.pkg.json` 中通过配置 `alert` 选项来关闭这些警告。

- 对于 `loop` 中可能产生歧义的 loop argument 的使用方式新增了警告：

```moonbit
fn main {
  let a = "asdf"
  loop a {
    [k, .. b] => continue a // warning
    [k, .. b] as a => continue a // suggested
    [] => ()
  }
}
```

- 支持了从 `Array` 到 `ArrayView` 类型、`Bytes` 到 `@bytes.View` 类型的隐式类型转换。

## 工具链更新

- `moon` 支持 `bench` 子命令，用于执行基准性能测试。

  使用带 `b : @bench.T` 参数的 `test` 块创建基准测试。可对计算结果使用 `b.keep()` 防止无副作用的计算被编译优化移除：

  ```moonbit
  fn fib(n : Int) -> Int {
    if n < 2 {
      return n
    }
    return fib(n - 1) + fib(n - 2)
  }

  test (b : @bench.T) {
    b.bench(fn() { b.keep(fib(20)) })
  }
  ```

  使用 `moon bench` 运行基准测试：

  ```shell
  $ moon bench
  [..]
  time (mean ± σ)         range (min … max)
    21.67 µs ±   0.54 µs    21.28 µs …  23.14 µs  in 10 ×   4619 runs
  ```

  更详细的使用说明参见 [https://docs.moonbitlang.com/zh-cn/latest/language/benchmarks.html](https://docs.moonbitlang.com/zh-cn/latest/language/benchmarks.html)。
