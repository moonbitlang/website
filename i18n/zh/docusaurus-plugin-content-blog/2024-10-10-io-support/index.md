---
description: moonbitlang/x 现已支持文件 I/O
slug: io-support
image: /img/blogs/zh/2024-10-10-io-support/cover.png
tags: [MoonBit]
---

# moonbitlang/x 现已支持文件 I/O

![cover](cover.png)

最近社区对于在 MoonBit 中进行文件 IO 的呼声很高，为此，我们在 [moonbitlang/x](https://github.com/moonbitlang/x) 中提供了一个基础的 fs 包，[moonbitlang/x/fs](https://github.com/moonbitlang/x/tree/main/fs) 包支持 wasm, wasm-gc, js 后端，包含以下常用 api：（注：此库目前是实验性的，其 api 可能会有进一步的更新和调整。）


- `write_string_to_file`, `write_bytes_to_file`
- `read_file_to_string`, `read_file_to_bytes`
- `path_exists`
- `read_dir`
- `create_dir`
- `is_dir`, `is_file`
- `remove_dir`, `remove_file`

## 用法示例

- 声明依赖

在命令行中执行以下命令
```json
moon update
moon add moonbitlang/x
```

或者手动在 moon.mod.json 中声明依赖

```json
"deps": {
    "moonbitlang/x": "0.4.10"
}
```

- 在需要使用的包中的 moon.pkg.json 导入依赖

```json
"import": [
    "moonbitlang/x/fs"
]
```

```moonbit
test "write_and_read" {
  let path = "1.txt"
  // write content to the file
  @fs.write_string_to_file(
    path="1.txt",
    content=
      #|target/
      #|.mooncakes/
      #|
    ,
  )
  // make sure the file has been create
  assert_true!(@fs.path_exists(~path))
  let byte = @fs.read_file_to_bytes!(~path)
  // verify file content
  inspect!(
    byte,
    content=
      #|b"\x74\x61\x72\x67\x65\x74\x2f\x0a\x2e\x6d\x6f\x6f\x6e\x63\x61\x6b\x65\x73\x2f\x0a"
    ,
  )
  @fs.remove_file!(~path)
  assert_false!(@fs.path_exists(~path))
  try {
    @fs.read_file_to_string!(~path) |> ignore
  } catch {
    @fs.IOError::NotFound(_) as e =>
      inspect!(e, content="`1.txt` does not exist")
    _ => return
  }
  let bytes = Bytes::from_array([65, 97].map(fn(x) { x.to_byte() }))
  @fs.write_bytes_to_file(~path, content=bytes)
  assert_true!(@fs.path_exists(~path))
  let content = @fs.read_file_to_string!(~path)
  inspect!(content, content="Aa")
  @fs.remove_file!(~path)
  assert_false!(@fs.path_exists(~path))
  try {
    @fs.remove_file!(~path) |> ignore
  } catch {
    @fs.IOError::NotFound(_) as e =>
      inspect!(e, content="`1.txt` does not exist")
    _ => return
  }
}
```

 更多示例可参见 [fs/fs_test.mbt](https://github.com/moonbitlang/x/blob/main/fs/fs_test.mbt)，这个文件是对于 `fs` 库的黑盒测试，其中的 test case 直观地展示了外部用户应该如何该库。

## Background：MoonBit 项目的测试机制

目前一个 MoonBit 项目中可以有三种类型的测试：白盒测试（white box test）、黑盒测试（black box test）、内部测试（inline test）。

### 白盒测试

写在 `*_wbtest.mbt`中，构建系统会把当前包中的 `*.mbt` 和 `*_wbtest.mbt` 一起打包编译，因此在 `*_wbtest.mbt` 中可以访问当前包的私有成员，这些测试可以使用 `moon.pkg.json` 中 import 和 `wbtest-import` 字段中的依赖。`wbtest-import` 只在白盒测试中用到，不会打包到最终的构建产物中。

### 黑盒测试

写在 `*_test.mbt` 中，构建系统会在编译 `*_test.mbt` 时会自动将其所在的包作为依赖， `*_test.mbt` 只能访问其所在包的公开成员（即模拟外部用户在使用这个包时的视角），这些测试可以使用 `moon.pkg.json` 中的 `import` 和 `test-import` 字段中的依赖（以及其所在包，不需要显式写在 `test-import` 字段中）。`test-import` 只在黑盒测试中用到，不会打包到最终的构建产物中。

### 内部测试

可以直接写在 `*.mbt`​（注意这里的`*.mbt` 不包含上面提到的 `*_wbtest.mbt`与`*_test.mbt`​）中，可以访问当前包的私有成员，这些测试只使用 moon.pkg.json 中 import 字段中的依赖。

|测试类型 | 文件拓展名 | 访问权限 | 依赖来源 | 打包到最终产物 |
|--- | --- | --- | --- | --- |
|白盒测试| *_wbtest.mbt | 当前包私有成员 | moon.pkg.json import & wbtest-import | 否 |
|黑盒测试| *_test.mbt | 公有成员 | moon.pkg.json import & test-import | 否 |
|内部测试| *.mbt | 当前包私有成员 | moon.pkg.json import | 是 |

**更多资源**

- 查看多人Wasm4游戏案例：[双人乒乓](https://docs.moonbitlang.cn/examples/pingpong/)
- [2024 MoonBit 编程创新挑战赛](https://www.moonbitlang.cn/2024-mgpic)
- [开始使用MoonBit](https://www.moonbitlang.cn/download/).
- 查看[MoonBit文档](https://docs.moonbitlang.cn/).
- 学习基于MoonBit设计的课程[《现代编程思想》](https://moonbitlang.github.io/moonbit-textbook/)
- 加入[中文论坛](https://taolun.moonbitlang.com/)
