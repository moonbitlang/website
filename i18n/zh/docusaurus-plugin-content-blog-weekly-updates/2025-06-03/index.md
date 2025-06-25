# 2025-06-03

## 语言更新

### 1. 调用副作用函数时可省略 `!`，IDE 自动高亮错误与异步
- 调用带副作用的函数（抛出错误或异步）时的 ! 现在可以省略，IDE 的语义着色会自动给带错误的函数加上下划线，将异步函数标记为*斜体*

### 2. `f?(..)` 替换为更灵活的 `try?` 表达式语法
`f?(..) `语法被替代为一个新语法 `try? f(..)`，`try? expr` 等价于 `try Ok(expr) catch { err => Err(err) }`，可以把错误转换为` Result `类型。相比原来的 `f?(..)`，`try?` 具有更多的灵活性，它可以同时处理多处函数调用的错误。

例如

```moonbit
try? {
  f(..)
  g(..)
}
```
  在迁移时，需要特别注意一种情况：`f?(g!(..))` 不能简单翻译为 `try? f(g(..))`，因为这会导致 `g` 中的错误被重定向到 `Result` 中。这种情况需要先用 `let` 将 `g` 的结果提取出来，再使用 `try?`


### 3. 新增了 “错误多态” 功能，允许高阶函数同时处理带错误和不带错误的参数：
```moonbit
fn[X] Array::each(arr : Array[X], f : (X) -> Unit?Error) -> Unit?Error {
  for x in arr {
    f(x)
  }
}

fn main {
  let arr = [ "a", "b", "c" ]
  arr.each(println) // 无错误
  println(try? arr.each(fail)) // 输出 Err(Failure)
}
```
  错误多态的语法是 `(..) -> T?Error`，在调用时，`?Error` 可以被替换为任意错误类型，也可以被抹去，变成没有错误的情况。例如，在上面的 `each` 函数中，如果参数 `f` 没有错误，那么 `?Error` 会被替换为 “没有错误”，整个 `each` 函数的调用也不会抛出错误。如果 `f` 会抛出错误，那么 `?Error` 会被替换为 `f` 实际的错误类型，整个 `each` 函数的调用也会抛出同样的错误


### 4. 废弃 `fn meth(self: T)` 风格，统一使用 `fn T::meth(..)` 定义方法
之前，使用 `fn meth(self : T)` 形式定义的方法既是方法也是函数，可以用 `meth(..)` 或 `@pkg.meth(..)` 的形式直接调用。这一 “将方法当作普通函数使用” 的行为将被废弃，目前编译器会对这一行为的使用提出警告。
  这一调整后，我们鼓励的 API 设计方式是：
  - 永远使用 `fn T::meth(..) `的形式定义方法，新代码中不再使用 `fn meth(self : T)`（在以后，`fn meth(self : T)` 语法本身也可能被废弃）
  - 和某个类型绑定的 API 若无特殊理由，都鼓励设计成方法


### 5. `.` 语法支持使用 `_` 的匿名函数
写法是 `_.meth(..)`，同时，管道运算符` |> `的右手侧也支持了这种形式的匿名函数。注意使用这一语法时，必须能从上下文中得知` _ `的类型，否则无法解析方法。例子：
```moonbit
fn main {
  let array_of_array = [ [], [ 1 ], [ 1, 2 ] ]
  let lens = array_of_array.map(_.length())
  lens |> _.each(println)
}
```
和直接写 `x.meth(..) `相比，`x |> _.meth(..)` 的好处是，它可以把方法嵌入到一个现有的 `|>` 管线里，例如 `x |> regular_func(..) |> _.meth(..)`

### 6. 方法定义中支持用 `Self` 替代类型名，简化签名
在 `fn TypeName::meth(..)` 形式的方法声明中，可以使用 `Self` 来指代 `TypeName`，缩短类型签名的长度：
```moonbit
type MyLongTypeName Int

fn MyLongTypeName::to_string(x : Self) -> String {
  x._.to_string()
}
```
如果 `TypeName` 有参数，使用 `Self` 时也需要提供参数


 ### 7. 使用方法实现 `trait` 的行为被正式移除

 ### 8. 函数的类型参数的位置从 `fn f[..]` 调整为 `fn[..] f`，从而和 `impl` 保持一致。这一改动可以使用格式化工具自动迁移
### 9. `moon info` 生成的 `.mbti` 文件中，方法的格式发生了变动。之前方法会被合并到一个大的 `impl` 块中，现在方法在 `.mbti` 中会被显示为一个扁平的列表，和 MoonBit 自身的语法保持一致

### 10. 异步函数的语法调整回了 `async (..) -> T`，`!Async` 的语法由于和错误多态语法不兼容被废弃。这一改动可以使用格式化工具自动迁移

### 11. 增加了Float类型的字面量`3.14F`


## 标准库更新
### `Char` 的 `Show::output` 实现发生变更，现在对于所有不可打印字符会进行转译，包括 *Control、Format、Surrogate、Private Use、Unassigned、Separator（除空格）等*。

## 工具链更新
### 单个 `.mbt.md` 文件支持外部依赖，用法如下：
```markdown
---
moonbit:
  deps:
    moonbitlang/x: 0.4.23
    # moonbitlang/x:
    #   path: "/Users/flash/projects/x"  # local deps
  backend:
    js
---
```
