# weekly 2024-04-15
## 标准库更新

自3月 MoonBit [标准库开源](https://github.com/moonbitlang/core)以来，我们已经接收到221个 PR 🩷，吸引了26位贡献者进行代码贡献，贡献了近一万多行优质的代码。感谢所有贡献者对于MoonBit的热情与支持，正是你们的参与推动着我们不断进步。

![0.PNG](MoonBit%20Update0415%2024882bd3c46a48e68c91ae69e92373ad/0.png)

## MoonBit更新

- 模式匹配中拓展了array pattern

  - 支持标准库中的 vec 类型
  - 支持更通用的 array pattern：如 `[a, .., b]`

  ```moonbit
  fn main {
    let xs = @vec.from_array([1, 2, 3])
    match xs {
      [1, .., 3] => { println("ok")}
      _ => println("not ok")
    }
    // Output: ok
  }
  ```

## IDE更新

- 在线IDE的打印输出从Output频道改为终端。修复了firefox浏览器上输出偶尔被截断的问题，浏览器上的代码可以使用ANSI转义序列，比如：

![1.PNG](MoonBit%20Update0415%2024882bd3c46a48e68c91ae69e92373ad/1.png)

- 支持 `\x |> @pkg.` 形式的补全

![1.5.PNG](MoonBit%20Update0415%2024882bd3c46a48e68c91ae69e92373ad/1.5.png)

- 对矩阵函数不再显示 inlay hint
  修改后

![2.PNG](MoonBit%20Update0415%2024882bd3c46a48e68c91ae69e92373ad/2.png)

修改后

![3.PNG](MoonBit%20Update0415%2024882bd3c46a48e68c91ae69e92373ad/3.png)

## 工具链更新

- 工具链新增（实验性的）测试覆盖率工具（注意：暂不支持windows端）

  - `moon test`支持`-enable-coverage`选项，开启后会在运行时统计测试对当前程序的覆盖率。
  - 加入`moon coverage`指令，用于读取和处理覆盖率统计数据
    - 在测试完成之后，可以使用`moon coverage report -f <格式>`输出覆盖率数据。支持的输出格式包括：
      - bisect（OCaml Bisect 工具的输出格式，默认）
      - html（输出统计结果网页）
      - coveralls（适合 CodeCov 和 Coveralls 工具上传的 JSON 格式）
      - summary（在终端中输出简报）
        更多功能可以通过 `moon coverage report -h`.
    - 可以使用`moon coverage clean`指令清除之前的覆盖率数据输出。

- 构建系统添加`moon info`命令，用于生成包的公开接口描述文件，使用示例如下：
  （注意：目前暂不支持Windows端）

  ```moonbit
  $ moon new hello
  $ cd hello
  $ moon info
  $ cat lib/lib.mbti
  package username/hello/lib

  // Values
  fn hello() -> String

  // Types and methods

  // Traits

  // Extension Methods
  ```

- moonfmt 修复尾部逗号导致的注释错位的问题
- moon 修复了文件路径中不能包含空格的问题
