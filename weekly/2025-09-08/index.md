# 20250908 MoonBit Monthly Update Vol.03
## Language Updates
1. Support for Bitstring Patterns
- Added support for Bitstring patterns, enabling matching of specific-width bits when pattern matching on `Bytes` or `@bytes.View`, for example:
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
  }
  ```

    You can use `u<width>be` or `u<width>le` to match bits of the specified width in big-endian or little-endian order. If neither `be` nor `le` is specified, big-endian is used by default. The valid `width` range is [1, 64].


2. Direct use of constructors in pattern matching
- Allowed direct use of constructors in pattern matching to match only the tag of an enum, for example:
  ``` moonbit
  fn is_some(x: Int?) -> Unit {
    guard x is Some
  }
  ```
  Previously, using a constructor with a payload as if it had none would result in a compiler error. This has now been changed to a warning, allowing users to disable such warnings via the `warn-list` parameter.

3. Added `#callsite(migration)` attribute for code migration of optional arguments.

      For example, if the author wants to change the default value of parameter `y` in the next version, they can use `migration(fill=true, ...)` to prompt downstream users to explicitly provide a value. Similarly, if the optional parameter `z` is planned to be removed in the next version, `migration(fill=false, ...)` can be used to notify users that they no longer need to explicitly provide `z`.

    ```moonbit
    #callsite(migration(y, fill=true, msg="must fill y for migration"), migration(z, fill=false, msg="cannot fill z for migration"))
    fn f(x~ : Int, y~ : Int = 42, z? : Int) -> Unit {
      ...
    }
    ```

4. Added `#skip` attribute to skip tests, for example:
    ```moonbit
    #skip("Reason for skipping")
    test "will not run" {
      ...
    }
    ```
      However, the compiler will still perform type checking on the code inside the test block.
5. Added `#as_free_fn` attribute as a replacement for the `fnaIias Type::f` functionality, for example:
    ```moonbit
    #as_free_fn // allow MyType::f to be called as f
    #as_free_fn(f0) // allow MyType::f to be called as f0
    #as_free_fn(f1, deprecated) // allow MyType::f to be called as f1, but with deprecated message
    fn MyType::f(self : MyType) -> Unit {
      ...
    }
    ```
    This allows `MyType::f` to be called directly as a regular function `f` or `f0`.
6. Added visibility control to `#alias` and `#as_free_fn`, for example:
    ```moonbit
    #as_free_fn(visibility="pub")
    fn MyType::f(self : MyType) -> Unit {
      ...
    }
    ```
    In this case, the `MyType::f` method is private, but its free function `f` is public. The same applies to `#alias` in the following example.
    ```moonbit
    #alias(pub_alias, visibility="pub")
    fn priv_func() -> Unit {
      println("priv func")
    }
    ```
7. Async functions now implicitly `raise`.
  - Functions marked with `async` no longer need an explicit `raise`, making the code more concise. If you want type checking to ensure that an async function does not throw errors, you can mark it with `noraise`.

8. FFI parameter ownership annotations required.
- In the C/LLVM/Wasm backends, parameters declared as pointers in FFI must now be annotated with either `#borrow` or `#owned`; otherwise, the compiler will emit a warning. `#borrow` means the called FFI function will only read or write the parameter locally and will not store or return it, so no special handling is required. `#owned` means ownership of the parameter is transferred to the called function.

  For details, see the documentation on external function calls. The motivation for this change is that in the future we plan to switch the default calling convention for FFI parameters from `#owned` to `#borrow`, and explicit annotations help users migrate progressively.
9. Changed calling convention of `FuncRef[_]`.

  - Previously, `FuncRef[_]` treated parameter ownership as `#owned`. It has now been changed to `#borrow`. This change is **breaking**: users who use `FuncRef[_]` in FFI and have pointer-type parameters must update their code accordingly.

## Toolchain Updates
- IDE now supports hover and go-to-definition features for .mbti files.