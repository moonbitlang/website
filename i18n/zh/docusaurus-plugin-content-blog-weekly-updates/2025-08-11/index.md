# 20250811 MoonBit 月报 Vol.02

## 语言更新

- 新增条件编译属性 cfg。可以根据后端等条件进行文件内的条件编译。

    ```moonbit
    #cfg(any(target="js", target="wasm-gc"))
    let current_target = "js | wasm-gc"
    ```

- 新增`#alias`属性，目前可以给方法或函数创建别名，并支持标注废弃。后续支持更多场景。

    ```moonbit
    #alias(combine, deprecated="use add instead")
    fn Int::add(x : Int, y : Int) -> Int {
      x + y
    }

    test {
      let _ = Int::add(1, 2)
      let _ = Int::combine(1, 2)
    }
    ```

- 新增 `defer`表达式。提供了一个基于词法作用域的资源清理功能。当程序以任何方式离开 `defer expr; body` 中的 `body` 时，`expr` 都会被运行

    ```moonbit
    fn main {
      defer println("End of main")
      {
        defer println("End of block1")
        println("block1")
      }
      for i in 0..<3 {
        defer println("End of loop \{i}")
        if i == 2 {
          break // `break` 等也能触发 `defer`
        }
        println("Looping \{i}")
      }
      return
    }
    ```

    ```moonbit
    block1
    End of block1
    Looping 0
    End of loop 0
    Looping 1
    End of loop 1
    End of loop 2
    End of main
    ```

      目前，`defer expr` 的 `expr` 里不能抛出错误或调用 `async` 函数。`expr` 里不能使用 `return`/`break`/`continue` 等控制流跳转构造

- Native 后端的 `Bytes` 的末尾现在永远会有一个额外的 `'\0'` 字节，因此现在 `Bytes` 可以直接当作 C string 传给需要 C string 的 FFI 调用。这个额外的 `'\0'` 字节不计入 `Bytes` 的长度，因此现有代码的行为不会有任何变化

- 调整可选参数的语法，默认参数现在可以依赖前面的参数（之前这一行为被废弃了，因为它和 virtual package 不兼容，但现在我们找到了在兼容 virtual package 的前提下支持这种复杂默认值的方式）。另外，我们统一了有默认值（`label~ : T = ..`）和没有默认值（`label? : T`）的可选参数：现在，对于函数的调用者来说，这两种默认参数不再有区别，并且都支持下列调用方式：

    - 不提供参数，使用默认值

    - 通过 `label=value` 的形式显式提供参数

    - 通过 `label?=opt` 的形式调用，语义是：如果 `opt` 是 `Some(value)`，等价于 `label=value`。如果 `opt` 是 `None`，等价于不提供这个参数

- 调整自动填充参数的语法，改用 `#callsite(autofill(...))` 属性替代原有语法

    ```moonbit
    // 原版本
    pub fn[T] fail(msg : String, loc~ : SourceLoc = _) -> T raise Failure { ... }
    // 现版本
    #callsite(autofill(loc))
    pub fn[T] fail(msg : String, loc~ : SourceLoc) -> T raise Failure { ... }
    ```

- 废弃 newtype，增加 tuple struct 支持

    ```moonbit
    // 旧语法，运行时等价于 Int
    type A Int
    fn get(a : A) -> Int {
      a.inner()
    }

    // 新语法，运行时依然等价于 Int
    struct A(Int)
    fn get(a : A) -> Int {
      a.0
    }

    struct Multiple(Int, String, Char)
    fn use_multiple(x: Multiple) -> Unit {
      println(x.0)
      println(x.1)
      println(x.2)
    }
    fn make_multiple(a: Int, b: String, c: Char) -> Multiple {
      Multiple(a, b, c)
    }
    ```

    - 当 tuple struct 中类型数量为 1 个的时候，tuple struct 等价于原有的 newtype。因此，当 newtype 的 underlying type 不是 tuple 的时候，formatter 目前会自动将旧语法迁移至新语法。为了便于迁移，这种情况下的 tuple struct 也提供了一个 `.inner()` 方法，之后会 deprecated 掉并移除

    - 当 tuple struct 中类型数量超过 1 个的时候，tuple struct 和原有的 tuple newtype 的区别在于：

        - tuple struct 不能由直接通过 tuple 构造

        - tuple struct 不能通过 `.inner()` 方法得到一个 tuple

    - 如果需要可以直接和 tuple 互相转换的 tuple struct，可以使用：


    ```moonbit
    struct T((Int, Int))

    fn make_t(x: Int, y: Int) -> T {
      (x, y)
    }

    fn use_t(t: T) -> (Int, Int) {
      t.0
    }
    ```


不过这种情况下访问具体元素时，需要 `t.0.0` 或者 `t.0.1` 进行访问

- 由于主要用途为数据存储和 `@json.inspect` 等功能，`derive(FromJson, ToJson)` 将不再提供高级格式调整参数。目前保留的格式参数为每个字段的 `rename`（重命名）、批量重命名和 enum 的格式选择 `style`，其余参数均将被移除。

    - `style`的可选项为`legacy`和`flat`。后者简化了表示，适用于`@json.inspect`等场景。目前所有 enum 都必须选择其中一个 style 使用。

    - 如果需要自定义 JSON 的格式，请自行实现 `FromJson` 和 `ToJson` 两个 trait。


    ```moonbit
    ///| Flat
    test {
      @json.inspect(Cons(1, Cons(2, Nil)), content=["Cons", 1, ["Cons", 2, "Nil"]])
    }

    ///| Legacy
    test {
      @json.inspect(Cons(1, Cons(2, Nil)), content={
        "$tag": "Cons",
        "0": 1,
        "1": { "$tag": "Cons", "0": 2, "1": { "$tag": "Nil" } },
      })
    }
    ```


## 工具链更新

- 新增 `moon coverage analyze`功能，提供更直观的覆盖率报告

    ```moonbit
    Total: 1 uncovered line(s) in 2 file(s)

    1 uncovered line(s) in src/top.mbt:

       | fn incr2(x : Int, step? : Int = 1) -> Int {
    12 |   x + step
       |   ^^^^^^^^         <-- UNCOVERED
       | }
       …

    Total: 1 uncovered line(s) in 2 file(s)
    ```

- 现在 `moon test --target js`在 panic 的时候，能根据 sourcemap 显示原始位置了

    ```Bash
    test username/hello/lib/hello_test.mbt::hello failed: Error
        at $panic ($ROOT/target/js/debug/test/lib/lib.blackbox_test.js:3:9)
        at username$hello$lib_blackbox_test$$__test_68656c6c6f5f746573742e6d6274_0 ($ROOT/src/lib/hello_test.mbt:3:5)
        at username$hello$lib_blackbox_test$$moonbit_test_driver_internal_execute ($ROOT/src/lib/__generated_driver_for_blackbox_test.mbt:41:9)
    ```