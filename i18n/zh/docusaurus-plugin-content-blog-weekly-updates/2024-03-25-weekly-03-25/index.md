# weekly 2024-03-25
## **构建系统更新**

### **1. 支持 expect testing**

a. 使用 moon new 新建一个 MoonBit 项目。

b. 在 lib/hello.mbt中写入：

```moonbit
pub fn hello() -> String {
  "Hello, world!"
}

test {
  let buf = Buffer::make(10)
  buf.write_string(hello())
  buf.expect()?
}

```

c. 然后运行 moon test --update或者 moon test -u：

```moonbit
$ moon test --update
expect test failed at lib/hello.mbt:8:3-8:15
Diff:
----
Hello, world!
----

Total tests: 1, passed: 0, failed: 1.

Auto updating expect tests and retesting ...

Total tests: 1, passed: 1, failed: 0.

```

d. 再次打开 lib/hello.mbt 文件，可以看到已经将测试结果 promote 到源码中。

```moonbit
pub fn hello() -> String {
  "Hello, world!"
}

test {
  let buf = Buffer::make(10)
  buf.write_string(hello())
  buf.expect(~content="Hello, world!")?
  //         ^~~~~~~~~~~~~~~~~~~~~~~~ 测试结果更新
}

```

### **2. moon run 不再支持 --output-wat选项。**

## **MoonBit 更新**

### **1. 支持多参数构造器的后端代码生成**

支持多参数构造器（multi-argument constructor）的后端代码生成。现在构造一个泛型类型的值的时候，如果泛型参数为元组的话必须要写括号，即：

```moonbit
enum A[X] {
  A(X)
}

fn init {
  // Error, expecting 1 arg, getting 2
  A::A(1, 2) |> ignore

  // Ok
  A::A((1, 2)) |> ignore
}

```

多参数构造器 unbox 了参数，能够提高生成的代码的性能，也允许程序员对数据的内存布局有了更多的掌控。

### **2. 调整了Int64的lsl, lsr, asr方法**

现在移位参数不再是Int64，而是Int。同时调整了clz, ctz, popcnt方法，现在返回类型不再是Int64，而是Int。此项改变有助于我们在不支持原生Int64的平台上生成更高效的代码。

## **IDE 更新**

### **1. 支持带标签参数的重命名。**

### **2. VSCode 插件支持自动安装或者更新 MoonBit**

a. 更新插件后，如果没有安装 moon 或者 moon 不是最新的时候，VSCode 右下角弹出自动安装/升级的提示。

![Untitled](./Untitled.png)

b. 点击 "yes"， 来执行自动安装任务。任务完成后就可以用了。

![Untitled](./Untitled%201.png)
