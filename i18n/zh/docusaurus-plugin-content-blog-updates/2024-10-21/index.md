# 2024-10-21

## MoonBit更新

- MoonBit支持[native后端](https://www.moonbitlang.cn/blog/native)

- Wasm-gc 后端支持 Js-string-builtins proposal

当通过编译选项 `-use-js-builtin-string` 开启使用 Js-string-builtins 之后，Moonbit 面向 wasm-gc 后端时，会使用 JavaScript 中的字符串类型表示 MoonBit 中的字符串，这时生成的 wasm 可执行文件中将需要从 JavaScript 宿主中导入字符串类型相关的函数，这个过程可以通过在 JS 的胶水代码中，使用如下选项来实现：

```javascript
// glue.js
// read wasm file
let bytes = read_file_to_bytes(module_name);
// compile the wasm module with js-string-builtin on
let module = new WebAssembly.Module(bytes, { builtins: ['js-string'], importedStringConstants: "moonbit:constant_strings" });
// instantiate the wasm module
let instance = new WebAssembly.Instance(module, spectest);
```

- 整数字面量重载支持表示Byte类型

```moonbit
let b : Byte = 65
println(b) // b'\x41'
```

- 多行字符串插值和转义支持

考虑到多行字符串有时用于保存raw string，即字符串内可能包含与转义序列冲突的字符序列。 MoonBit拓展了原先的多行字符串插值语法，用户可以通过开头的标记单独控制每行是否启用插值和转义序列：`$|`表示启用插值和转义，`#|`表示raw string。

```moonbit
let a = "string"
let b = 20
let c =
  #| This is a multiline string
  $| \ta is \{a},
  $| \tb is \{b}
  #| raw string \{not a interpolation}
println(c)
```

输出:

```plain text
 This is a multiline string
        a is string,
        b is 20
 raw string \{not a interpolation}
```

- 带标签参数的语法调整

移除函数调用中`f(~label=value)`和模式匹配中`Constr(~label=pattern)`的语法，仅保留省略`～`符号的形式：`f(label=value)`和`Constr(label=pattern)`。`f(~value)`和`Constr(~name)`不受影响。

## IDE 更新

- 修复了字符串插值的高亮

## 标准库更新

- Builtin包引入`StringBuilder`

`StringBuilder`针对不同的后端的字符串拼接操作进行了特化，例如JS后端在使用`StringBuilder`后相比原先的`Buffer`实现有大约五倍的速度提升。原先Builtin包的`Buffer`已经弃用，相关API移入moonbitlang/core/buffer包，后续会对`Bytes`和`Buffer`的API进行相关的调整。

- 位运算函数调整

弃用了标准库中各个类型的`lsr`, `asr`, `lsl`, `shr`, `shl`等左移和右移位运算操作函数，只保留`op_shl`和`op_shr`。目前`lxor`, `lor`, `land`, `op_shr`, `op_shl`都有对应的中缀运算符，我们推荐使用中缀表达式的风格。

- 破坏性更新

`immut/List` 的 `Last` 函数现在返回 `Option[T]`

## 构建系统更新

- 初步适配 native 后端
  - `run | test | build | check` 支持 `--target native`
  - native 后端的 `moon test` 在 debug 模式下（默认）用 tcc 编译；release 模式下用 cc 编译（unix），windows 暂未支持
  - 暂未支持 panic test

- 支持 `@json.inspect`，被检查的对象需要实现 `ToJson`。

  使用样例：

```moonbit
enum Color {
  Red
} derive(ToJson)

struct Point {
  x : Int
  y : Int
  color : Color
} derive(ToJson)

test {
  @json.inspect!({ x: 0, y: 0, color: Color::Red })
}
```

执行 `moon test -u` 后，测试块被自动更新成：

```moonbit
test {
  @json.inspect!({ x: 0, y: 0, color: Color::Red }, content={"x":0,"y":0,"color":{"$tag":"Red"}})
}
```

与 `inspect` 相比，`@json.inspect` 的自动更新结果可以使用代码格式化工具：

```moonbit
test {
  @json.inspect!(
    { x: 0, y: 0, color: Color::Red },
    content={ "x": 0, "y": 0, "color": { "$tag": "Red" } },
  )
}
```

此外 `moon test` 会自动对 `@json.inspect` 中的JSON进行结构化对比，例如，对于如下代码

```moonbit
enum Color {
  Red
  Green
} derive(ToJson)

struct Point {
  x : Int
  y : Int
  z : Int
  color : Color
} derive(ToJson)

test {
  @json.inspect!(
    { x: 0, y: 0, z: 0, color: Color::Green },
    content={ "x": 0, "y": 0, "color": { "$tag": "Red" } },
  )
}
```

`moon test` 的输出的 diff 结果类似：

```diff
Diff:
 {
+  z: 0
   color: {
-    $tag: "Red"
+    $tag: "Green"
   }
 }
```

- `moon.mod.json` 中支持 `include` 与 `exclude` 字段。`include` 与 `exclude` 是个字符串数组，字符串的格式与 `.gitignore` 中每行的格式相同。具体的规则如下：
  - 如果 `include` 与 `exclude` 字段都不存在，只考虑 `.gitignore` 文件
  - 如果 `exclude` 字段存在，同时考虑 `exclude` 中的路径与 `.gitignore` 文件
  - 如果 `include` 字段存在，那么 `exclude` 与 `.gitignore` 都失效，只有在 `include` 中的文件才会被打包
  - `moon.mod.json` 忽略上述规则，无论如何都会被打包
  - `/target` 与 `/.mooncakes` 忽略上述规则，无论如何都不会被打包

- 添加 `moon package` 命令，用于只打包而不上传
  - `moon package --list` 用于列出包中的所有文件

- 支持 `moon publish --dry-run`，服务端会进行校验，但是不会更新索引数据
