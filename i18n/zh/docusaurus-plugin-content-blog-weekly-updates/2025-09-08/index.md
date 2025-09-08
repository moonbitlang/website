# 20250908 MoonBit 月报 Vol.03

## 语言更新

- 1、新增 Bitstring pattern 支持，用于在模式匹配 `Bytes` 或者 `BytesView` 的过程中匹配特定宽度的 bits，比如可以用
    
    ```moonbit
    pub fn parse_ipv4(ipv4 : @bytes.View) -> Ipv4  {
      match ipv4 {
        [ // version (4) + ihl (4)
          u4(4), u4(ihl),
          // DSCP (6) + ECN (2)
          u6(dscp), u2(ecn),
          // Total length
          u16(total_len),
          // Identification
          u16(ident),
          // Flags (1 reserved, DF, MF) + Fragment offset (13)
          u1(0), u1(df), u1(mf), u13(frag_off),
          // TTL + Protocol
          u8(ttl), u8(proto),
          // Checksum (store; we'll validate later)
          u16(hdr_checksum),
          // Source + Destination
          u8(src0), u8(src1), u8(src2), u8(src3),
          u8(dst0), u8(dst1), u8(dst2), u8(dst3),
          // Options (if any) and the rest of the packet
          .. ] => ...
        ...
    }
    ```
    
      其中可以用 `u<width>be` 或者 `u<width>le` 来通过指定按大端或者小端序来匹配 `width` 宽度的 bits，如果没有写 `be` 或者 `le` 的话则默认大端序。`width` 长度范围是 `[1, 64]`
    
      
    
- 允许直接用构造器进行模式匹配，来表示只匹配 enum 的 tag，比如：
    
    ```moonbit
    fn is_some(x: Int?) -> Unit {
      guard x is Some
    }
    ```
    
      之前如果一个有 payload 的构造器当作没有没有 payload 的构造器使用的话，编译器会进行报错，现在改成了报 warning，从而用户可以选择通过 `warn-list` 参数关掉这类 warning
    
      
    
- 新增 `#callsite(migration)` attribute，用于对 optional argument 进行代码迁移，比如下面代码的作者希望在下个版本中修改参数 `y` 的默认值，所以通过 `migration(fill=true, ...)` 来提示下游用户都显式提供参数值，并且在下个版本中将去掉可选参数 `z` ，所以通过 `migration(fill=false, ...)` 来提示下游用户不需要再显式提供参数 `z`
    
    ```moonbit
    #callsite(migration(y, fill=true, msg="must fill y for migration"), migration(z, fill=false, msg="cannot fill z for migration"))
    fn f(x~ : Int, y~ : Int = 42, z? : Int) -> Unit {
      ...
    }
    ```
    
- 新增 `#skip` attribute 用于跳过测试，比如：
    
    ```moonbit
    #skip("Reason for skipping")
    test "will not run" {
      ...
    }
    ```
    
      不过编译器依然会对 test block 中的代码进行类型检查
    
- 新增 `#as_free_fn` attribute，用来替代 `fnalias Type::f` 的功能，比如：
    
    ```moonbit
    #as_free_fn // allow MyType::f to be called as f
    #as_free_fn(f0) // allow MyType::f to be called as f0
    #as_free_fn(f1, deprecated) // allow MyType::f to be called as f1, but with deprecated message
    fn MyType::f(self : MyType) -> Unit {
      ...
    }
    ```
    
      这样就会允许 `MyType::f` 被当作普通函数 `f` 或者 `f0` 直接调用
    
- `#alias` 和 `#as_free_fn` 增加了可见性控制，比如：
    
    ```moonbit
    #as_free_fn(visibility="pub")
    fn MyType::f(self : MyType) -> Unit {
      ...
    }
    ```
    
      这里的 `MyType::f` 方法是 private 的，但是它的 free function `f` 是 public 的。下述例子中的 `#alias` 同理。
    
    ```moonbit
    #alias(pub_alias, visibility="pub")
    fn priv_func() -> Unit {
      println("priv func")
    }
    ```
    
- 异步函数默认 raise，这样标记了 `async` 的函数可以不用再标注 `raise`，以使代码更加简洁，如果需要通过类型检查保证异步函数不会抛错误，可以使用 `noraise` 标记
    
- ``在 C/LLVM/Wasm 后端，FFI 声明中，ABI 为指针的参数必须标注 `#borrow` 或 `#owned`，否则编译器会产生一个警告。`#borrow` 表示被调用的 FFI 函数只会局部地读写对应的参数，不会存储或返回参数。此时，被调用的函数无需对参数做特殊操作。`#owned` 表示参数的所有权会被转移给被调用的 FFI 函数。详细情况见文档中外部函数调用相关章节。``这一改动的动机是，未来我们希望将 FFI 参数的默认调用约定切换为 `#borrow`（目前是 `#owned`），因此通过强制标注的方式来帮助用户渐进地迁移
    
- 修改了 `FuncRef[_]` 的 calling convention。之前，`FuncRef[_]` 是以 `#owned` 的方式处理参数的所有权的。现在改为了 `#borrow`。这一改动是 breaking 的：在 FFI 中使用了 `FuncRef[_]`，且 `FuncRef[_]` 的参数中有指针类型的用户需要注意修改
    

## 工具链更新

- IDE 支持了对 mbti 文件的 hover 和 gotodef 等功能



[[月报模板]]