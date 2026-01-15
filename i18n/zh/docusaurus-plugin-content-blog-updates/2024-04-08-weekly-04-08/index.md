# weekly 2024-04-08
## MoonBit更新

- 支持 array.iter intrinsic 并且已经对标准库中的函数进行标注，从而可以在特定情况下将循环进行内联，以提升运行效率

  ```java
  /// @intrinsic %array.iter
  pub fn iter[T](self : Array[T], f : (T) -> Unit) -> Unit {
    for i = 0; i < self.length(); i = i + 1 {
      f(self[i])
    }
  }
  ```

## 工具链更新

- 支持实验性的测试覆盖率统计工具
  - 工具已经实验性支持 MoonBit Core CI
  - 我们正在优化面向用户的接口

![image](MoonBit%20Update0408%2074f244b8a35847abae849d6afac5d61b/1280X1280.png)

![image](MoonBit%20Update0408%2074f244b8a35847abae849d6afac5d61b/2.png)

- 默认关闭Alerts pragmas 中 unsafe/throw/raise 类别的警告，启用了 deprecated alert。
- moonfmt
  - 修复带负号的字面量打印后注释错位的问题
  - 修复带负号字面量打印后括号消失的问题
- 修复变量高亮
- moonrun 支持 UTF-16 字符串的打印

## 构建系统更新

- expect test 支持处理 Unicode 字符

![image](MoonBit%20Update0408%2074f244b8a35847abae849d6afac5d61b/b3123cf6-d093-4d88-8742-9800cd3a905d.gif)
