# 20260112 MoonBit 月报 Vol.7 

对应moonc版本：v0.7.1

## 语言更新
1. 添加了 unused `async` 的警告。这有助于清理未使用的 async 标记，从而提升代码可读性、可维护性，并且能够避免潜在的爆栈问题。
    ```moonbit
    pub async fn log_debug(msg : String) -> Unit {
      //^^^^^ Warning (unused_async): This `async` annotation is useless.
      println("[DEBUG] \{msg}")
    }
    ```

2. Optional argument 的默认值表达式支持抛错。如果 optional argument 的默认值能够抛错误，则该函数签名本身需要支持抛错误。

    ```moonbit
    pub async fn log_debug(
      msg : String,
      file? : @fs.File = @fs.open("log.txt", mode=WriteOnly, append=true),
    ) -> Unit {
      file.write("[DEBUG] \{msg}\n")
    }
    ```

3. 新增 `#declaration_only attribute`，支持函数/方法/类型。可用于 spec-driven development，允许先定义函数签名和类型声明,后续再补充实现。在函数/方法上使用 `#declaration_only` 时，需要使用 `...` 填充函数/方法体。以下是一个简单的 TOML parser 功能的声明：
    ```mbt
    #declaration_only
    type Toml

    #declaration_only
    pub fn Toml::parse(string : String) -> Toml raise {
      ...
    }

    #declaration_only
    pub fn Toml::to_string(self : Toml) -> String {
      ...
    }
    ```

  4. `SourceLoc`的显示迁移为相对路径。例如：
      ```moonbit
      ///|
      #callsite(autofill(loc))
      fn show_source_loc(loc~ : SourceLoc) -> Unit {
        println(loc)
      }

      ///|
      fn main {
        show_source_loc()
      }
      ```
        运行 `moon run .` 输出：
        ```moonbit
        main.mbt:9:3-9:20@username/test
        ```



5. 对于只进行读写操作的 array literal 添加了警告，提示可以改用 `ReadOnlyArray` 或者 `FixedArray` 以获得更好的编译优化，比如：
    ```moonbit
    pub fn f() -> Unit {
      let a = [1, 2, 3]
          ^ --- [E0065] Warning (prefer_readonly_array)
      ignore(a[0])
      let b = [1, 2, 3]
          ^ --- [E0066] Warning (prefer_fixed_array)
      b[0] = 4
    }
    ```
    目前该警告默认关闭，需要用户手动在 `moon.pkg` 中通过 `warn-list` 中添加 `+prefer_readonly_array` 和 `+prefer_fixed_array` 打开


6. 管道语法支持改进

    支持了`e1 |> x => { e2 + x }`的语法，这个语法可以简化原先的`e |> then(x => e2 + x)`。

7. 支持了给 for 循环标注 loop invariant 和 reasoning 的功能，比如：

    ```moonbit
    fn test_loop_invariant_basic() -> Unit {
      for i = 0; i < 10; i = i + 1 {
        println(i)
      } where {
        invariant: i >= 0,
        reasoning: "i starts at 0 and increments by 1 each iteration",
      }
    }
    ```
8. 废弃了在类型未知的情况下，通过结构体字面量推导出 `Ref` 类型的行为：
    ```moonbit
    let x = { val: 1 } // 之前会自动推导出 `Ref[Int]` 类型，
                      // 该行为已被废弃，目前会报警告，以后会移除
    let x : Ref[_] = { val: 1 } // 类型已知时没有问题
    let x = Ref::{ val: 1 } // 有类型标注时没有问题
    let x = Ref::new(1) // 也可以使用 `Ref::new` 而非字面量构造
    ```
## 工具链更新
1. 实验性 moon.pkg 支持
    ```json
    // moon.pkg
    // 导入包
    import {
      "path/to/package1",
      "path/to/package2" as @alias,
    }

    // 黑盒测试的导入
    import "test" {
      "path/to/test_pkg1",
      "path/to/test_pkg2" as @alias,
    }

    // 白盒测试的导入
    import "wbtest" {
      "path/to/package" as @alias,
    }

    // 兼容原先moon.pkg.json的所有选项
    options(
      warnings: "-unused_value-deprecated",
      formatter: {
        ignore: ["file1.mbt", "file2.mbt"]
      },
      // 兼容旧的带“-”命名的选项，可以使用双引号
      "is-main": true,
      "pre-build": [
        {
          "command": "wasmer run xx $input $output",
          "input": "input.mbt",
          "output": "output.moonpkg",
        }
      ],
    )
    ```
      支持了实验性的 moon.pkg 配置文件来代替 moon.pkg.json。moon.pkg 使用接近于 MoonBit Object Notation 的语法，在简化书写配置的同时尽可能保持简单。
    - 兼容旧的格式，当一个包内存在`moon.pkg`文件时，moonbit将使用它作为这个包的配置。
    - 支持格式化，当设置了环境变量`NEW_MOON_PKG=1`时，moon fmt 将自动迁移项目中旧的 moon.pkg.json 配置，生成新的文件。
    - 支持注释和空的 `moon.pkg` 配置。

    `options(...)`声明内兼容了所有moon.pkg.json提供的配置,我们后续会对已经稳定和常见的配置提供和它平级的声明支持。详细语法以及后续改进见 https://github.com/moonbitlang/moonbit-evolution/pull/17

2. 现在 `moon add` 会先自动执行 `moon update`，简化了工作流程.

3. 重构后的 `moon` 默认开启，可以用 `NEW_MOON=0`手动切换回更老版本的 moon 实现。

4. 增加了间接依赖的支持。现在可以不用显式在 `moon.pkg.json`/`moon.pkg`中导入一个包的情况下，使用这个包里面的方法和 impl 。
    ```moonbit
    // @pkgA
    pub(all) struct T(Int)
    pub fn T::f() -> Unit { ... }

    // @pkgB
    pub fn make_t() -> @pkgA.T { ... }

    // @pkgC
    fn main {
      let t = @pkgB.make_t()
      t.f()
    }
    ```

5. `moon fmt` 不再格式化 prebuild 的输出。

6. `moon check --fmt` 支持检测未格式化的源文件。

7. `moon`在 target 为 js 时运行测试与代码不再受到项目中的 `package.json` 影响。

8. 构建产物的目录从 `target` 切换到了 `_build`，目前还会生成 `target` 作为 symlink 指向 `_build`，以向后兼容

## 标准库和实验库更新
1. `moonbitlang/async` 改动：
    - 新增 Windows 支持。目前仅支持 MSVC，因此使用时需要在系统上安装 MSVC。除符号链接与文件系统权限外的功能已全部在 Windows 上实现

    - `@fs.mkdir` 新增了 `recursive? : Bool = false` 参数，`recursive=true` 时，如果目标路径的父文件夹不存在，会递归创建父文件夹

    - 改进了 `@process.run` 被取消时，自动终止外部进程的设计。现在，`@process.run` 会先尝试通知外部进程主动退出，超时后再强制终止外部进
    
    - `@process.read_from_process` 与 `@process.write_to_process` 现在会返回专门的临时管道类型 `@process.ReadFromProces` 和 `@process.WriteToProcess`，而非 `@pipe` 中的通用管道类型

2. 标准库中的迭代器类型正式迁移到外部迭代器。对用户来说的改动是：
    - `Iter::new`的签名发生改变，从内部迭代器变成外部迭代器。此前 `Iter::new` 已通过警告弃用，并提示用户通过 https://github.com/moonbitlang/core/pull/3050 进行迁移
    - 外部迭代器类型 `Iterator` 和 `Iter` 类型合并，此后只有一种迭代器类型。如果同时给 `Iter` 和 `Iterator` 实现了 `trait`，需要删除 `Iterator` 上的实现
    - `Iterator` 这个名字被弃用，用户应使用 `Iter`。此外，标准库中的各种容器类型的 `.iterator()` 方法也被弃用，应改为 `.iter()`
   
    对大部分用户（没有手动构造迭代器）来说，上述改动不会影响现有代码。但需要注意，原本的 `Iter` 类型可以多次重复遍历，重复遍历会导致重复计算。现在，`Iter` 只能遍历一次。这是一项行为上的不兼容改动。重复遍历同一个迭代器是不被鼓励的用法，用户应当避免重复遍历同一个迭代器

3. 实验性 lexmatch 表达式支持 POSIX character classes（例如 `[:digit:]`），同时开始弃用 `\w`/`\d`/`\s`等转义序列。POSIX character classes 仅可在方括号表达式内使用，例如：
    ```mbt
    ///|
    fn main {
      let subject = "1234abcdef"
      lexmatch subject {
        ("[[:digit:]]+" as num, _) => println("\{num}")
        _ => println("no match")
      }
    }
    ```

    输出：
    ```moonbit
    1234
    ```
## IDE 更新

1. LSP 修复了 `.mbti` 不工作等问题。

2. `moon ide` 命令行工具，文档可参见https://docs.moonbitlang.com/en/latest/toolchain/moonide/index.html

    - 支持 `moon ide peek-def`，能够根据位置和 symbol 名字找到对应的定义。例如：

    ```moonbit
    ///|
    fn main {
      let value = @strconv.parse_int("123") catch {
        error => {
          println("Error parsing integer: \{error}")
          return
        }
      }
      println("Parsed integer: \{value}")
    }
    ```

    运行 `moon ide peek-def -loc main.mbt:3 parse_int`， 输出:
    ```moonbit
        Definition found at file $MOON_HOME/lib/core/strconv/int.mbt
        | }
        | 
        | ///|
        | /// Parse a string in the given base (0, 2 to 36), return a Int number or an error.
        | /// If the `~base` argument is 0, the base will be inferred by the prefix.
    140 | pub fn parse_int(str : StringView, base? : Int = 0) -> Int raise StrConvError {
        |        ^^^^^^^^^
        |   let n = parse_int64(str, base~)
        |   if n < INT_MIN.to_int64() || n > INT_MAX.to_int64() {
        |     range_err()
        |   }
        |   n.to_int()
        | }
        | 
        | // Check whether the underscores are correct.
        | // Underscores must appear only between digits or between a base prefix and a digit.
        | 
        | ///|
        | fn check_underscore(str : StringView) -> Bool {
        |   // skip the sign
        |   let rest = match str {
    ```
    - 支持 `moon ide outline`。该命令以简略的方式列出指定包的大纲。
    - 之前 `moon doc <符号或包名>`迁移到`moon ide doc <符号或包名>`。
3. Doc test 支持 `mbt check` 。现在，你可以在 doc test 里面写 test block 并获得运行/调试/更新测试的 codelens ：
![alt text](image-1.png)
