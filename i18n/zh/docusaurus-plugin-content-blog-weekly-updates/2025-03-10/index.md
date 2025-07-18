# 2025-03-10

## 语言更新

### 模式匹配支持守卫（Pattern Guard）

模式守卫可以通过在模式后追加 `if ...` 的语法结构来指定。有模式守卫的分支只有在被模式匹配的值满足对应模式，并且模式守卫为真的情况下才会执行。如果模式守卫为假，则会继续向下寻找能够被匹配的分支。

  这个特性能够简化许多使用模式匹配的代码，以化简算术表达式为例：

```moonbit
fn simplify(e : Expr) -> Expr {
  match e {
    Add(e1, Lit(0)) => e1
    Sub(e1, e2) if e1 == e2 => Lit(0)
    //          ^^^^^^^^^^^ pattern guard
    _ => e
  }
}
```

  模式守卫还可以配合 `is` 表示式使用来引入新的变量，例如：

```moonbit
fn json_get_key(json : Json, key : String) -> Json! {
  match json {
    Object(map) if map[key] is Some(value) => value
    _ => fail!("key not found: \{key}")
  }
}
```

### 支持 Attribute 语法

支持 Attribute 语法，用来代替原有的 `@alert deprecated "message"` 等 pragmas。每个 attribute 单独占用一行，attribute 内不允许换行。

  目前支持的attribute：

1. `#deprecated("message")`：声明该函数为 deprecated ，并且在使用处提示 message 中的内容。
2. `#coverage.skip`：声明该函数不计入覆盖率测试。
  我们后续将会移除旧的 pragmas 语法。

```moonbit
#deprecated("use function g instead")
#coverage.skip
fn f() -> Unit {
  ...
}
```

### Bytes 类型支持使用字符串字面量进行初始化和赋值

Bytes 类型支持使用字符串字面量进行初始化和赋值。该字符串会以 UTF-8 编码的形式存储为一个 Bytes 。例如：

```moonbit
fn main {
  let xs : Bytes = "123"
  let ys : Bytes = "你好，世界"
}
```

### `enum` 支持自定义 tag 值

`enum` 支持自定义 tag 值，这在绑定 Native 的 C FFI 时非常有用。以 `open` 这个 syscall 为例：

```moonbit
enum OpenFlag {
  O_RDONLY = 0x00
  O_WRONLY = 0x01
  O_RDWR   = 0x02
}

extern "c" fn open(path : Bytes, flag : OpenFlag) -> Int = "open"

test {
  let path : Bytes = "tmp.txt"
  let fd = open(path, O_RDONLY)
}
```

### 增强了常量（`const`）声明的表达能力

const 新增支持：

- 引用其他常量
- 内建类型的其四则运算、位运算和比较运算

例如：

```moonbit
const A : Int = 1 + 2 * 3
const B : Int = A * 6
```

### Deprecate 通过方法隐式实现 trait 的行为

通过方法隐式实现 trait 的行为现已 deprecate。如果需要为一个类型实现一个 trait ，需要通过显示的 `impl` 构造来实现。

```moonbit
// 为 T 隐式实现 Show （deprecated）
fn T::output(self : T, logger : &Logger) -> Unit {
  ...
}

// 你应该迁移到如下的显示实现
impl Show for T with output(Self : T, logger : &Logger) -> Unit {
  ...
}
```

### 移除了直接调用形如 fn T::f(..) 的行为

移除了直接调用形如 fn T::f(..) 的行为。该行为之前已通过警告的形式 deprecate。未来，形如 `fn f(self : T, ..)` 的方法可以当成普通函数使用，而形如 `fn T::f(..)`的方法只能用 `T::f(..)` 的形式或 `x.f(..)` 语法调用。新语义的更多细节见 [GitHub PR #1472](https://github.com/moonbitlang/core/pull/1472)

### 单独拆分 Native 后端部分 runtime

Native 后端的一部分 runtime 拆出来到单独的 C 文件里面了。该 C 文件位于 `$MOON_HOME/lib/runtime.c`。如果你使用了非标准的构建方式，比如自己通过调用 C 编译器编译生成出来的 C 文件，需要注意在编译的时候加入该 C 文件。

### 在 bleeding 版本的工具链上面发布 LLVM 后端

我们在 bleeding 版本的工具链上面发布了我们的 LLVM 后端。目前我们的 LLVM 后端只支持了 x86_64 Linux 和 ARM64 macOS 平台。这两个平台上可以通过如下 bash 命令安装 bleeding 版本的 moon 。

```bash
curl -fsSL https://cli.moonbitlang.com/install/unix.sh | bash -s 'bleeding'
```

然后就可以在构建、测试和运行的时候，通过向 moon 传入 `--target llvm` 的选项来使用 LLVM 后端。例如：

```bash
moon build --target llvm
```

## 构建系统更新

1. 新增 `moon check --explain` ，能够输出关于某个 error code 的详细信息。
![explain](explain.png)

2. `moon.pkg.json`中新增 `"native-stub"` 配置项用来声明当前包用到的 C stub 文件。在构建时，这些 stub 会被构建并连接到当前包的产物中。如果你的项目是把 C stub 文件写在 cc-flags 中，现在可以将这些 C stub 文件声明在 `"native-stub"` 字段中

3. 放松了 `moon publish` 必须要通过 moon check 的要求。如果 check 失败，会询问用户是否坚持发布。

### IDE 更新

1. Markdown 中内嵌的 MoonBit 代码块支持格式化。用户可以通过选择 MoonBit 插件来格式化含有 MoonBit 的 Markdown 。

![fmt](fmt.gif)
