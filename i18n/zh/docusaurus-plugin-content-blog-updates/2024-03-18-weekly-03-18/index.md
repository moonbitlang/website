# weekly 2024-03-18
## **语言更新**

### **1. 实验性地添加对 trait 实现默认方法的功能**

```moonbit
trait MyShow {
  repr(Self) -> String
  str (Self) -> String // it has a default implementation
}

impl MyShow::str(self : Self) -> String {
  // default implementation of str
  self.repr()
}

type MyInt Int
fn repr(self:MyInt) -> String {
  self.0.to_string()
}
// Now MyInt implements MyShow now
```

### **2. 允许类型定义的类型参数为 \_**

`_`可以用来定义 phantom type，来限制一些程序逻辑上非法的操作。例如我们希望不同单位的长度不能够相加：

```moonbit
type Length[_] Int

type Kilometer
type Mile

fn add[T](x: Length[T], y:Length[T]) -> Length[T] {
  Length::Length(x.0 + y.0)
}

let d_km: Length[Kilometer] = Length(10)
let d_mile: Length[Mile] = Length(16)
```

此时，两个单位不同的长度并不能够直接相加：

```moonbit
fn init {
  add(d_km, d_mile) |> ignore
  //        ^~~~~~ Error: Expr Type Mismatch
}
```

而两个单位相同的长度可以相加：

```moonbit
fn init {
  add(d_km, d_km) |> ignore
  // OK
}
```

### **3. 现在 Toplevel 函数没有标记返回值的行为改成报错**

Toplevel 函数没有标记返回值的行为从之前的默认设置为 `Unit` 改成报错。

```moonbit
fn print_hello() {
// ^~~~~~~~~~~ Error:
// Missing type annotation for the return value.
  println("Hello!")
}
```

### **4. 添加了按位取反的操作符**

```moonbit
fn main {
  println((1).lnot())
}
```

输出：

```moonbit
-2
```

### **5. 改进 List::to_string/debug_write 的输出**

```moonbit
fn main {
  let l = List::Cons(1, Cons(2, Cons(3, Nil)))
  println(l)
}
```

输出：

```moonbit
List::[1, 2, 3]
```

### 6. 添加了 Byte 类型

byte 字面量由 b 作为前缀，使用方式如下：

```moonbit
fn init {
  let b1 = b'a'
  println(b1.to_int())
  let b2 = b'\xff'
  println(b2.to_int())
}
```

更多关于 Byte 的功能还在完善中

## **IDE更新**

### **1.支持对 moonbitlang/core 的补全**

### **2. 格式化的更新和修复：**

- 调整空的 struct、enum、trait，避免出现空行。

之前：

```moonbit
struct A {

}
```

之后：

```moonbit
struct A {}
```

- 修复 continue 的错误缩进。
- 修复多行语句格式化后出现分号的问题。

## **构建系统更新**

### **1. moon.mod.json 添加了 test_import 字段**

`test_import`这个字段中用到的依赖只会在测试的时候被用到。

### **2. 优化 moon test 输出**

默认只输出失败的测试用例信息，如果需要完整输出可使用`moon test -v`命令。
