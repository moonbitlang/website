# 20250908 MoonBit 月报 Vol.04

对应moonc版本：v0.6.29

## 语言更新

- 新增`async test` 与 `async fn main` 语法, 支持异步测试与异步主函数。`async fn main` 和 `async test` 基于 `moonbitlang/async` 库，目前支持 Linux/MacOS 上的 native 后端。关于 MoonBit 异步编程的更多信息见`moonbitlang/async` 的[文档](https://mooncakes.io/docs/moonbitlang/async)和 [GitHub 仓库](https://github.com/moonbitlang/async)。`async test` 声明的异步测试会并行地运行：

    ```moonbit
    ///|
    async test "http request" {
      let (response, result) = @http.get("https://www.example.org")
      inspect(response.code, content="200")
      assert_true(result.text().has_prefix("<!doctype html>"))
    }
    ```

- 新增`lexmatch`表达式(实验性特性)。提供了用正则表达式对`StringView`或`BytesView`进行模式匹配的能力。下面这个例子匹配2到4个连续的字符'a'以及紧随其后的字符'b', 并将连续的'a'捕获为变量`a`。更具体的使用方式可参考 [moonbitlang/parser](https://github.com/moonbitlang/parser.git) 中的 [lexer.mbt](https://github.com/moonbitlang/parser/blob/master/lexer/lexer.mbt) 和 [moonbit-evolution](https://github.com/moonbitlang/moonbit-evolution) 中的 [lexmatch 提案](https://github.com/moonbitlang/moonbit-evolution/pull/15)。

    ```moonbit
    lexmatch x using longest {
      (("a{2,4}" as a) "b", _) => Some(a.length())
      _ => None
    }
    ```

- 新增`using`语法，统一了 `fnalias`、`traitalias` 和简单 `typealias`。在导入类型和 `trait` 时，需要在名称前添加对应的关键字：

    ```moonbit
    using @pkg {
      value,
      CONST,
      type Type,
      trait Trait,
    }
    ```

      另外，也可以使用 `pub using` 实现 re-export 的效果，将其他包的定义在当前包重新导出。未来，`fnalias`、`traitalias` 和简单 `typealias` 语法将会被废弃，给外部定义创建别名的功能会被 `using` 代替，给当前包的定义创建别名的功能由 `#alias` 属性代替

- `trait` 中的方法支持可选参数：

    ```moonbit
    pub(open) trait Reader {
      async read(Self, buf : FixedArray[Byte], offset? : Int, len? : Int) -> Unit
    }
    ```

      可选参数的默认值由每个 `impl` 各自决定，不同的 `impl` 可以设置不同的默认值，或者直接不提供默认值（此时可选参数在 `impl` 内部的类型会是 `T?`，`None` 表示用户没有提供这个参数）

- 支持使用 `#alias` 来重载 `op_get` 等运算符，相比 `op_xxx` 可读性更好。目前支持下列操作符：

    ```moonbit
    // 对应之前的 `op_get`
    #alias("_[_]")
    fn[X] Array::get(self : Array[X], index : Int) -> X { ... }

    // 对应之前的 `op_set`
    #alias("_[_]=_")
    fn[X] Array::set(self : Array[X], index : Int, elem : X) -> Unit { ... }

    // 对应之前的 `op_as_view`
    #alias("_[_:_]")
    fn[X] Array::view(
      self : Array[X],
      start? : Int = 0,
      end? : Int = self.length(),
    ) -> ArrayView[X] { ... }
    ```

      这里，实际的实现的名字（上面的 `get`/`set`/`view`）可以随意设置，只需要写上对应的 `#alias`，就可以完成运算符重载。我们推荐使用 `#alias` 代替 `op_xxx` 来进行基于方法的运算符重载（`+` 等运算符是通过 `trait` 重载的，不受影响）

- 一些已经废弃较长时间的语法和行为被正式移除：

    - 过去，用 `fn meth(self : T, ..)` 形式定义的方法，既是方法也是函数，可以直接当作普通函数使用。这一行为已经废弃较长时间，编译器会提供警告。现在，这一行为被正式移除。用 `fn meth(self : T, ..)`现在等价于 `fn T::meth(self : T, ..)`。未来，`self` 形式的方法定义本身也可能被废弃

    - `moon.pkg.json` 中的 `direct_use` 字段被正式移除，由 `using` 代替


## 工具链更新

- 发布了wasm版工具链, x86 Darwin与 arm Linux用户可使用：https://www.moonbitlang.cn/blog/moonbit-wasm-toolchain

- 我们为构建系统开发了一个实验性的新版本 (RR)。这一新版本拥有更高的性能和更好的可维护性，将会完全替代 `moon` 现在的内部实现，欢迎大家试用并寻找问题。可以使用环境变量 `NEW_MOON=1` 或者命令行参数 `-Z rupes_recta` 启用。如果遇到任何问题，请发在 https://github.com/moonbitlang/moon/issues 上。

- `moon fmt`支持对.mbt.md文件进行format

- 新增`moon info --no-alias` ，在生成`pkg.generated.mbti` 文件时不显示类型别名


## 标准库更新

- 为了应对潜在的 HashDos 攻击，Hash 的计算将会变为进程随机。目前 JS 后端已实现此修改。

- `ArrayView`已改为不可变数据结构，用于统一对`Array` `FixedArray` `ImmutArray`取切片。