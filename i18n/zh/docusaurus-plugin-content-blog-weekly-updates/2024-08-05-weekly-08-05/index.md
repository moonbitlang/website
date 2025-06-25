# weekly 2024-08-05

## MoonBit更新

- JSON字面量支持array spread。

```bash
let xs: Array[@json.JsonValue] = [1, 2, 3, 4]
let _: @json.JsonValue = [1, ..xs]
```

- 增加了类型别名的支持，主要是为了渐进式代码重构和迁移，而不是某种给类型简短名字的机制。例如，假设需要把 `@stack.Stack` 重命名为 `@stack.T`，一次性完成迁移需要修改大量使用 `@stack.Stack` 的地方，对于大项目很容易产生 conflict，如果有第三方包使用了 `@stack.Stack`，则会直接造成 breaking change。使用 type alias，则可以在重命名后留下一个 `@stack.Stack` 的 alias，使现有代码不会失效：

```kotlin
/// @alert deprecated "Use `T` instead"
pub typealias Stack[X] = T[X]
```

  接下来，可以渐进式地逐步迁移对 `@stack.Stack` 的使用、给第三方用户时间去适配新的名字。直到迁移全部完成，再移除 type alias 即可。除了类型重命名，`typealias` 还可用于在包之间迁移类型定义等等

- 增加了给 trait object 定义新的方法的支持：

```moonbit
trait Logger {
  write_string(Self, String) -> Unit
}

trait CanLog {
  output(Self, Logger) -> Unit
}

// 给 trait object 类型 `Logger` 定义新的方法 `write_object`
fn write_object[Obj : CanLog](self : Logger, obj : Obj) -> Unit {
  obj.output(self)
}

impl[K : CanLog, V : CanLog] CanLog for Map[K, V] with output(self, logger) {
  logger.write_string("Map::of([")
  self.each(fn (k, v) {
    // 使用 `Logger::write_object` 方法来简化
    logger
    ..write_string("(")
    ..write_object(k)
    ..write_string(", ")
    ..write_object(v)
    .write_string(")")
  })
  logger.write_string("])")
}
```

- 【breaking change】在可能返回错误的返回值类型 `T!E` 中，错误类型 `E` 只能是使用 `type!` 关键字声明具体的错误类型，目前支持以下两种声明方式：

```moonbit
type! E1 Int   // error type E1 has one constructor E1 with an Integer payload
type! E2       // error type E2 has one constructor E2 with no payload
```

函数声明中可以使用上述具体的错误类型来进行标注，并通过使用 `raise` 来返回具体的错误，比如

```moonbit
fn f1() -> Unit!E1 { raise E1(-1) }
fn f2() -> Unit!E2 { raise E2 }
```

- 添加了内置的 Error 类型作为默认的错误类型，可以在函数声明中使用以下几种等价的声明方式来表明函数会返回 Error 类型的错误，比如：

```moonbit
fn f1!() -> Unit { .. }
fn f2() -> Unit! { .. }
fn f3() -> Unit!Error { .. }
```

对于匿名函数和矩阵函数，可以通过使用 `fn!` 来标注该函数可能返回 Error 类型的错误，比如

```moonbit
fn apply(f: (Int) -> Int!, x: Int) -> Int! { f!(x) }

fn main {
  try apply!(fn! { x => .. }) { _ => println("err") }    // matrix function
  try apply!(fn! (x) => { .. }) { _ => println("err") }  // anonymous function
}
```

通过 `raise` 和 `f!(x)` 这种形式返回的具体的错误类型可以向上 cast 到 Error 类型，比如

```moonbit
type! E1 Int
type! E2
fn g1(f1: () -> Unit!E1) -> Unit!Error {
  f1!()      // error of type E1 is casted to Error
  raise E2   // error of type E2 is casted to Error
}
```

错误类型可以被模式匹配，当被匹配的类型是 Error 的时候，模式匹配的完备性检查会要求添加使用 pattern `_` 进行匹配的分支，而当其是某个具体的错误类型的时候则不需要，比如

```moonbit
type! E1 Int
fn f1() -> Unit!E1 { .. }
fn f2() -> Unit!Error { .. }
fn main {
  try f1!() { E1(errno) => println(errno) }  // this error handling is complete
  try f2!() {
    E1(errno) => println(errno)
    _ => println("unknown error")
  }
}
```

此外，在 try 表达式中，如果使用了不同种类的错误类型，那么整个 try 表达式可以返回的错误类型会按照 Error 类型进行处理，比如

```moonbit
type! E1 Int
type! E2
fn f1() -> Unit!E1 { .. }
fn f2() -> Unit!E2 { .. }
fn main {
  try {
    f1!()
    f2!()
  } catch {
    E1(errno) => println(errno)
    E2 => println("E2")
    _ => println("unknown error")   // currently this is needed to ensure the completeness
  }
}
```

我们会在后续的版本中对此进行改进，以使得完备性检查可能更加精确

- 添加了 Error bound，以在泛型函数中对泛型参数加以约束，使得其可以作为错误类型出现在函数签名中，比如

```moonbit
fn unwrap_or_error[T, E: Error](r: Result[T, E]) -> T!E {
  match r {
    Ok(v) => v
    Err(e) => raise e
  }
}
```

## 标准库更新

- `Bigint` 变为builtin类型

## 构建系统更新

- 支持 debug 单个.mbt文件

- `moon test`支持包级别的并行测试

- `moon.mod.json`增加`root-dir`字段，用于指定模块的源码目录，只支持指定单层文件夹，不支持指定多层文件夹。`moon new`会默认指定`root-dir`为`src`，exec 和 lib 模式的默认目录结构变为：

```bash
exec
├── LICENSE
├── README.md
├── moon.mod.json
└── src
    ├── lib
    │   ├── hello.mbt
    │   ├── hello_test.mbt
    │   └── moon.pkg.json
    └── main
        ├── main.mbt
        └── moon.pkg.json

lib
├── LICENSE
├── README.md
├── moon.mod.json
└── src
    ├── lib
    │   ├── hello.mbt
    │   ├── hello_test.mbt
    │   └── moon.pkg.json
    ├── moon.pkg.json
    └── top.mbt
```

## 工具链更新

- MoonBit AI 支持生成文档

![ai file](<ai file.gif>)
