# weekly 2024-05-27
MoonBit 周报 Vol.42：核心库进行API整理工作、工具链持续完善

## MoonBit更新
- 【核心库 Breaking】核心库进行API整理工作
  - 所有immutable数据结构被放在`immut`路径下，如`@immutable_hashmap.Map`变为`@immut/hashmap.Map`
```moonbit
// Before
let a : @immutable_hashmap.Map[Int, Int] = @immutable_hashmap.make()
// After
let a : @immut/hashmap.Map[Int, Int] = @immut/hashmap.make()
```
- 核心库中 Option[T] 类型性能优化
  - 在类型 T 是一个引用类型情况下，对于 Option[T] 类型的值，`Some(v)` 会被直接编译成 `v` ，`None` 会在 wasm-gc 后端被编译成 `ref.null` ，在 JavaScript 后端被编译成 `undefined`，从而避免内存分配
- 核心库中引入了 `fn panic[T]() -> T` 函数，这个函数可以用于在测试块中，其中测试的名字需要以 `"panic"` 开头：
```bash
test "panic test ok" {
  panic() // 测试通过
}

test "panic test failed" {
  () // 测试失败
}
```

## IDE更新
- 【VS Code插件】增加了`test`和`for`的代码片段
  `test`片段
![test.gif](test.gif)
  `for`片段
![for.gif](for.gif)

## 构建系统更新
- 【初始化】`moon new` 会自动对创建的项目进行版本控制初始化，目前支持 git
- 【测试】现在可以指定对多个包进行测试
```bash
moon test -p a b c
moon test -p a -p b -p c
```

## 工具链更新
- 【安装】现在可以指定版本号进行安装
```bash
# Mac与Linux用户
# 下载最新版
curl -fsSL https://cli.moonbitlang.com/install/unix.sh | bash
# 下载 bleeding 版本
curl -fsSL https://cli.moonbitlang.com/install/unix.sh | bash -s bleeding
# 下载特定版本
curl -fsSL https://cli.moonbitlang.com/install/unix.sh | bash -s 0.1.20240520+b1f30d5e1
```
```powershell
# Windows用户
# 下载最新版
irm cli.moonbitlang.cn/install/powershell.ps1 | iex
# 下载特定版本
$env:MOONBIT_INSTALL_VERSION = "0.1.20240520+b1f30d5e1"; irm cli.moonbitlang.cn/install/powershell.ps1 | iex
```
- 【安装】现在可以查找对应版本的SHA256，对下载进行校验
  - 详情见：[https://www.moonbitlang.cn/download/#%E9%AA%8C%E8%AF%81%E4%BA%8C%E8%BF%9B%E5%88%B6%E6%96%87%E4%BB%B6](https://www.moonbitlang.cn/download/#%E9%AA%8C%E8%AF%81%E4%BA%8C%E8%BF%9B%E5%88%B6%E6%96%87%E4%BB%B6)
