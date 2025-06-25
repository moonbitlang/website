# 2025-04-21

## 语言更新

- async 函数的调用处语法改为和 error 相同的 `f!(..)`，原语法 `f!!(..)` 将触发警告

- 运算符重载的语义从基于方法迁移到了基于 `trait`，以后重载运算符需要通过给 `@moonbitlang/core/builtin` 中对应的 `trait` 添加 `impl` 的形式。各个运算符对应的 `trait` 可以参考语言文档和 `@moonbitlang/core/builtin` 中的 `operators.mbt`。迁移上：
  - 使用方法重载运算符的旧方式依然可用，但编译器会对此提出警告
  - 把 `op_xxx` 系列方法改成对应 `trait` 的 `impl` 即可完成迁移
    - 但 `trait` 对运算符的签名会有更严格的要求，例如 `-` 运算符的返回类型和参数类型必须相等。如果有签名不符合要求的运算符，这些 API 之后将不再能以运算符的形式提供，只能以普通方法的形式提供
  - 如果在 `trait` 中定义了 `op_xxx` 方法，可以删去这些方法，并将运算符对应的 `trait` 添加到 super trait 列表中，例如：

  ```moonbit
  // 旧的写法
  trait Number {
    from_int(Int) -> Self
    op_add(Self, Self) -> Self
    op_sub(Self, Self) -> Self
  }

  // 迁移后的新写法
  trait Number : Add + Sub {
    from_int(Int) -> Self
  }
  ```

- 在 `trait` 定义中，在方法声明后新增了一个 `= _` 的标记，用于标记 `trait` 中的某个方法是否有默认实现，例如：

  ```moonbit
  trait Hash {
    hash_combine(Self, Hasher) -> Unit
    hash(Self) -> Int = _ // 说明 `hash` 有默认实现
  }
  ```

  a. 如果一个方法有 `= _` 的标记，它必须有对应的默认实现 `impl Trait with some_method(..)`。反之，如果一个方法有默认实现但没有 `= _` 标记，编译器会提出警告。

  b. 这一新增的标记主要是为了提升源码的可读性。现在，从 `trait` 的定义即可直接看出各个方法是否有默认实现。那么，为什么不直接把默认实现的内容放到 `trait` 定义里呢？这是因为我们希望 `trait` 的定义本身尽可能短，这样在阅读时更容易完整获取方法列表和它们的类型签名信息。

- 提供了从 `String` 类型到 `@string.View` 的隐式类型转换，并且恢复了使用 `[:]` 操作符来取一个完整的 view，对于通用的使用 `[i:j]` 取 view 的情况目前还在设计中。

  ```moonbit
  fn f(v : @string.View) -> Unit {
    ignore(v)
  }

  fn main {
    f("hello")
    f("world"[:])
  }
  ```

- 对 `@string.View`/`@bytes.View` 进行模式匹配时，允许直接匹配 string/bytes literal，如：

  ```moonbit
  test {
    let s = "String"
    inspect!(s.view(end_offset=3) is "Str", content="true")
    let s : Bytes = "String"
    inspect!(s[:3] is "Str", content="true")
  }
  ```

- 【Breaking Change】Core 中的 `@string` 包 API 发生改动，参数类型由 `String` 迁移至 `@string.View`，返回值类型根据情况调整为了 `@string.View`，比较有代表性的改动如下：

| 旧方法签名 | 新方法签名 |
| ----- | ----- |
| `self.replace(old~: String, new~: String) -> String` | `self.replace(old~: View, new~: View) -> String` |
| `self.trim(charset: String) -> String` | `self.trim(charset: View) -> View` |
| `self.split(substr: String) -> Iter[String]` | `self.split(substr: View) -> Iter[View]` |
| `self.index_of(substr: String, from~: Int) -> Int` | `self.find(substr: View) -> Option[Int]` |
| `self.last_index_of(substr: String, from~: Int) -> Int` | `self.rev_find(substr: View) -> Option[Int]` |
| `self.starts_with(substr: String) -> Bool` | `self.has_prefix(substr: View) -> Bool` |
| `self.ends_with(substr: String) -> Bool` | `self.has_suffix(substr: View) -> Bool` |

- Core 中的 `Json` 类型未来将改为 readonly，届时将不能使用该类型的 enum constructor，但作为替代提供了对应的辅助函数，如：

```moonbit
test {
  let num = Json::number(3.14)
  let str = Json::string("Hello")
  let obj = Json::object({ "hello": num, "world": str })
}
```

## 工具链更新

- IDE 停止支持 `moonbit: true` Markdown 文件头
  - 现在只有 `.mbt.md` 拓展名会触发 Markdown 文件的 MoonBit IDE 支持
- IDE 支持在 `.mbt.md` 中直接设置 debug 断点
  - 今后不再需要在 VSCode 设置中开启 `Debug: Allow Breakpoint Everywhere` 选项
- 在 `moon.mod.json` 中添加构建脚本 `scripts` 字段
  - 目前支持 postadd 脚本：如果一个模块中包含 `postadd` 字段，那么执行 `moon add` 之后会自动执行该脚本
    - 设置 `MOON_IGNORE_POSTADD` 环境变量可以忽略 postadd 脚本的执行

```json
{
  "scripts": {
    "postadd": "python3 build.py"
  }
}
```

- 优化 `moon` 工具的 `.mbt.md` 格式 Markdown 支持
  - `moon check` 命令执行时自动包含 Markdown 检查
  - `moon test` 命令执行时自动包含 Markdown 测试（未来该命令的 `--md` 选项将被移除）
