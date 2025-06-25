# weekly 2023-08-21

<!--truncate-->

## 新的Parser开发中

为了给用户提供更好的开发体验，Moonbit正在开发新的手写递归下降的parser，预期会在近期合入。新parser带来的改变如下：

1. 新的parser将带来更精确的语法错误提示，比如：

```
func init{
    if (someCondition) true else false
    ()
}
```

在原来的parser会提示 "Parse error,unexpected token `true` , you may expect `(` or `[` or `{` "，新的parser会指出上述代码中直接写 true 和 false 是非法的，此处需要使用花括号。

2. 新parser有更完善的自动补全机制，比如
   `func f[X:Eq]`
   当用户预期输入如上代码，当用户写到 `func f[X:E` 时，由于缺少后续的参数列表和函数体，现有的parser的粗粒度错误恢复导致Eq的补全提示不工作。新的parser能够提供关于Eq、Show等interface限制的补全。

3. 新parser在错误恢复上功能更强大，比如
   `let **nonsense = 100 + a.boolField`
   上述代码等号(`=`)两边都有错误，左边的 `**nonsense` 的语法错误是 "Parse error,unexpected token infix 4 , you may expect `identifier`"，右边则是一个整数和布尔值相加的类型不匹配错误。

当前parser只能提示等号左边的错误，使用新的parser则可以同时报出2个错误。

## 构建系统更新

我们提供了构建系统的介绍 ([MoonBit's Build System Tutorial](https://moonbitlang.com/blog/moon-build-system-tutorial/))

1. 增加 `moon check -daemon` 选项，能够启动一个后台守护进程对一个 Moonbit 项目进行类型检查，而不需要每次手动执行 `moon check --watch`

2. `moon check/build/run --tool commands` 更改为 `moon check/build/run --dry-run`，用于只生成命令而不执行
   更改前

```
$ moon new hello && cd hello
$ moon check --tool commands
moonc check ./lib/hello.mbt -o ./target/build/lib/lib.mi -pkg hello/lib
moonc check ./main/main.mbt -o ./target/build/main/main.mi -pkg hello/main -i ./target/build/lib/lib.mi
```

更改后

```
$ moon new hello && cd hello
$ moon check --dry-run
moonc check ./lib/hello.mbt -o ./target/build/lib/lib.mi -pkg hello/lib
moonc check ./main/main.mbt -o ./target/build/main/main.mi -pkg hello/main -i ./target/build/lib/lib.mi
```

3. 现在 `moon run` 需要指定 main 包的路径了，解决如果存在多个 main 包，执行入口不确定的问题
   更改前

```
$ moon new hello && cd hello
$ moon run
Hello, world!
```

更改后

```
$ moon new hello && cd hello
$ moon run ./main
Hello, world!
```

4. `moon new module_name` 如果`module_name`中间有` '/'` 也只创建一个文件夹。
   例如 `moon new example.com/lib/stack`
   更改前：会在文件系统中创建三级文件夹 `example.com/lib/stack`
   更改后：只会创建一个文件夹 `stack`

5. 修复如果`moon check/build/run` 命令如果只指定了 `--source-dir` 但是没有指定 `--target-dir`，target 目录的默认路径在没有在 `--source-dir` 下的问题
