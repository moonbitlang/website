# weekly 2024-04-08
## MoonBit Update

- Support array.iter intrinsic and annotate functions in the standard library, enabling inline loops in specific cases to improve runtime efficiency.

  ```java
  /// @intrinsic %array.iter
  pub fn iter[T](self : Array[T], f : (T) -> Unit) -> Unit {
    for i = 0; i < self.length(); i = i + 1 {
      f(self[i])
    }
  }
  ```

## Toolchain Update

- Support the experimental code coverage tool:
  - The tool has experimentally supported MoonBit Core CI.
  - We are optimizing the user-facing interface.

![image](MoonBit%20Update0408%2074f244b8a35847abae849d6afac5d61b/1280X1280.png)

![image](MoonBit%20Update0408%2074f244b8a35847abae849d6afac5d61b/2.png)

- By default, the unsafe/throw/raise warnings in Alerts pragmas are turned off, while deprecated alerts are enabled.
- moonfmt
  - Fixed an issue where comments were misaligned after printing literals with negative signs.
  - Fixed an issue where parentheses disappeared after printing literals with negative signs.
- Fixed variable highlighting.
- moonrun now supports printing UTF-16 strings.

## Build System Update

- expect test now supports Unicode characters.

![image](MoonBit%20Update0408%2074f244b8a35847abae849d6afac5d61b/b3123cf6-d093-4d88-8742-9800cd3a905d.gif)
