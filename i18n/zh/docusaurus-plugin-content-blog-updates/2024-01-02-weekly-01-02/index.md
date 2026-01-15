# weekly 2024-01-02
## MoonBit更新

### 1. 上线了MoonBit包管理平台 mooncakes.io

详细信息见：https://mp.weixin.qq.com/s/dBA4dA2fKL4FHc6KOcisBg

### 2. ⽀持了 recursive newtype

可以在MoonBit中实现类型安全的y combinator:

```
type R[X] (R[X]) -> X

fn y[X, Y](f : ((X) -> Y) -> (X) -> Y) -> (X) -> Y {
  fn ff (x: R[(X) -> Y]) -> (X) -> Y {
    fn(a) { f(x.0(x))(a) }
  }
  ff(R::R(fn(x) { fn (a) { f(x.0(x))(a) } }))
}

fn factx(f: ((Int) -> Int)) -> (Int) -> Int {
  fn(n: Int) -> Int {
    if n <= 1 { 1 } else { n * f(n-1)}
  }
}

fn init {
  let fact = y(factx)
  let n = fact(10)
  println(n)
}
```

### 3. 新增内置函数`sqrt`

用于计算二次方根

```
fn init {
  // sqrt 的类型是 Double -> Double
  println(sqrt(4.0)) // 2.0
}
```

### 4. 新增运算符 `===`

用于判断两个值是否引用相等：

```
fn init {
  let x = [1, 3]
  let y = [1, 3]
  let z = x
  if x === y {
    println("x === y")
  } else if x === z {
    println("x === z")
  }
  // Output: x === z
}
```

### 5. method/trait系统的更新：

在过去的几周里，我们对 MoonBit 的方法/接口系统进行了许多设计上的调整，让它的行为更加合理、健壮。下面是现在的方法系统的行为：

- 方法是和类型关联的函数。可以通过下面的语法定义一个方法

```
fn T::method(...) -> ... { ... }

// 例如
type MyInt Int
fn MyInt::default() -> MyInt { MyInt(0) }

enum MyList[X] {
  Nil
  Cons(X, MyList[X])
}

fn MyList::map2[X, Y, R](
  f: (X, Y) -> R,
  xs: MyList[X],
  ys: MyList[Y]
) -> MyList[R] {
  ...
}
```

作为一种便捷的语法糖，当函数的第一个参数名为 `self` 时，Moonbit 会自动将它定义成 `self`的类型上的方法：

```
fn add(self: MyInt, other: MyInt) -> MyInt { ... }
// 等价于
fn MyInt::add(x: MyInt, y: MyInt) -> MyInt { ... }
```

- 方法都是普通函数。所以在没有歧义时，可以直接当成普通函数调用：

```
enum MyList[X] { ... }
fn MyList::length[X](xs: MyList[X]) -> Int {
  ...
}

fn init {
  let xs: MyList[_] = ...
  debug(length(xs))
}
```

如果有歧义无法直接调用，也可以用 `T::method(...)` 的形式显式调用：

```
struct Type1 { ... } derive(Debug)
fn Type1::default() -> Type1 { ... }

struct Type2 { ... } derive(Debug)
fn Type2::default() -> Type2 { ... }

fn init {
  // debug(default()): 有歧义！
  debug(Type1::default()) // ok
  debug(Type2::default()) // ok
}
```

- 当方法的第一个参数就是它所属的类型时，可以使用 `x.method(...)` 语法来快捷地调用。而且这种调用方式在跨包时不需要写出包名。MoonBit 会自动根据 `x` 的类型找到正确的方法：

```
// 名为 @list 的包
pub enum List[X] { ... }
pub fn map[X](self: List[X], f: (X) -> Y) -> List[Y] {
  ...
}

// 在另一个包中使用 @list
fn init {
  let xs: @list.List[_] = ...
  // 下面三种写法是等价的
  xs.map(...)
  @list.map(xs, ...) // 无歧义时可以如此调用
  @list.List::map(xs, ...)
}
```

- **只有类型所在的包可以给类型定义方法。**这保证了第三方包无法意外或恶意修改现有类型的行为和 trait 系统的一致性。

MoonBit 的 trait 系统的行为变化如下：

- `trait` 中的方法声明，任何时候都不再需要 `Self::` 前缀。方法的第一个参数是否是 `Self` 对行为不再有影响

- 类型可以通过它现有的方法自动地实现一个 `trait`，不需要手动写出。但如果一个类型没有实现一个 `trait`，或者原本的实现不能满足需求，需要拓展它的功能，可以用如下的语法定义特殊的拓展方法，用于给一个类型显式地实现某个 `trait`：

```
// 给 [T] 实现 trait [Eq] 中的 [op_equal] 方法
fn Eq::op_equal(x: T, other: T) -> { ... }
```

这些拓展方法**只能**用于实现指定的 trait。例如，上面的拓展方法 `Eq::op_equal` 只能被用于实现 `Eq`，不能被用 `T::op_equal` 或是 `t.op_equal(...)` 的形式直接调用。在寻找 trait 的实现时，拓展方法的优先级比普通方法高。

- **只有类型所在的包或 trait 所在的包可以定义拓展方法**。因此，某个类型为某个 trait 提供的实现在任何地方都是唯一且确定的。这保证了第三方包不会意外地更改一段程序的行为。

和之前相比，方法/trait 系统最大的不兼容改动是，现在不能给内建和第三方类型直接定义方法了。但通过心得拓展方法的机制，依然可以为内建/第三方类型实现新的 trait 来拓展功能。

## 构建系统更新

### 1. `moon.pkg.json` 的 `import` 字段增加了数组的表示

数组中要么是一个字符串，要么是一个 object `{ "path": ..., "alias": ...}`，比如：

```
{
  "is_main": true,
  "import": [
    { "path": "moonbitlang/import004/lib", "alias": "lib" },
    "moonbitlang/import004/lib2", // 使用默认的alias: "lib2"
    { "path": "moonbitlang/import004/lib3", "alias": "lib3" },
    { "path": "moonbitlang/import004/lib4", "alias": "" } // 使用默认的alias: "lib4"
  ]
}
```

### 2. `moon new`现在支持通过交互式方式来创建项目。

- 创建一个可执行项目

```
$ moon new
Enter the path to create the project (. for current directory) > myproject
Enter the create mode (exec or lib) > exec
Enter your username > moonbitlang
Enter the package name > hello
```

上面的命令等价于

```
 moon new --path myproject --user moonbitlang --name hello
```

这将会在文件夹 `./myproject` 中创建一个名为 `moonbitlang/hello` 的项目，其目录结构为

```
.
├── lib
│   ├── hello.mbt
│   ├── hello_test.mbt
│   └── moon.pkg.json
├── main
│   ├── main.mbt
│   └── moon.pkg.json
└── moon.mod.json
```

- 创建一个包

```
$ moon new
Enter the path to create the project (. for current directory) > mylib
Enter the create mode (exec or lib) > lib
Enter your username > moonbitlang
Enter the package name > hello
```

上面的命令等价于

```
 moon new --path mylib --lib --user moonbitlang --name hello
```

这将会在文件夹 `./mylib` 中创建一个名为 `moonbitlang/hello` 的包，其目录结构为

```
.
├── lib
│   ├── hello.mbt
│   ├── hello_test.mbt
│   └── moon.pkg.json
├── moon.mod.json
├── moon.pkg.json
└── top.mbt
```
