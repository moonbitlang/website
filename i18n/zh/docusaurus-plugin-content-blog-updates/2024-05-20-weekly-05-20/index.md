# weekly 2024-05-20

## MoonBit更新
- 【Breaking Change】`Array`重命名为`FixedArray`，`@vec.Vec`重命名为`Array`
```moonbit
// Before
fn init {
  let array : @vec.Vec[Int] = [1, 2, 3]
}
// After
fn main {
  let array : Array[Int] = [1, 2, 3]
}
```
- 【语法】键值对（如`Map` `HashMap`等）增加模式匹配支持
  - 类型需实现`op_get`方法，其键为原生类型（`Int` `Char` `String` `Bool`等），值为`Option[T]`
  - 匹配时，键需为字面量
  - 在 `{ "key": pat }` 中，模式 `pat` 类型是 `Option[T]`，`None`表示 `"key"`不存在，`Some(p)`表示 `"key"`存在，且 `p` 会被用于匹配这个键的值
  - 匹配键值对的模式都是开放的：未被匹配的键即使存在也会被忽略掉
  - 键值对模式会生成优化过的代码，每个键至多被查询一次
```moonbit
fn main {
  let map = @map.Map::[ ("a", 1) ]
  match map {
    // 当 `map` 包含 "b" 时匹配，
    // 并把 "b" 在 `map` 中的值绑定到 `y`
    { "b": Some(y) } => println(y)
    // 当 `map` 不包含 "b" 而包含 "a" 时匹配，
    // 并把 "a" 的值绑定到 `k`
    { "b": None, "a": Some(k) } => println(k)
    // 编译器提示 { "b": None, "a": None } 的情况未被匹配到
  }
  // 输出：1
}
```
- 【语法】允许在已知类型信息的情况下省略`newtype`构造器
```moonbit
type A Int

pub fn op_add(self : A, other : A) -> A {
  self.0 + other.0 // 省略构造器
}

fn main {
  A::A(0) + 1 |> ignore // 省略 1 的构造器
  let _c : A = 0 + 1 + 2
}
```
## 构建系统更新
- 配置文件选项统一为kebab-case（近期仍对snake_case保持兼容）
```json
{
  "is-main": true,
  "test-import": []
}
```
- 【Wasm，Wasm-GC】后端支持在`moon.pkg.json`中指定导出内存名称（默认为`moonbit.memory`）与编译选项（如`-no-block-params`以兼容binaryen工具链）
```json
{
 "link": {
  "wasm": {
  "export-memory-name": "custom_memory_name",
  "flags": ["-no-block-params"]
 },
}
```
- `moon check` 增加 `--deny-warn` 选项，在有 warning 时视为失败，返回非0值
- `moon fmt` 增加 `--check`选项，用于检查当前代码是否已被格式化
## 标准库更新
- 增加实验性库[moonbitlang/x](https://github.com/moonbitlang/x)，用于开发与测试API不稳定的包。`moonbitlang/x`中的包稳定后，我们会根据社区的意见，选取重要的包合入`moonbitlang/core`。
  - num time uuid json5 均已移动至`moonbitlang/x`
- Bytes API 变更，从`Int`迁移到了`Byte`类型：
```moonbit
fn Bytes::op_get(self : Bytes, index : Int) -> Byte
fn Bytes::op_set(self : Bytes, index : Int, value : Byte) -> Unit
fn Bytes::length(self : Bytes) -> Int
fn Bytes::make(len : Int, ~init : Byte = b'\x00') -> Bytes
```