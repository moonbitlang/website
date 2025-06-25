# weekly 2023-09-25

In August 2023, MoonBit underwent Alpha testing. This post aims to introduce recent updates to MoonBit's language and toolchain, along with applications developed using MoonBit.

<!--truncate-->

## Changes in MoonBit Language

### 1. Support for Bitwise Operations in Int64

MoonBit now supports bitwise operations for the Int64 data type. The currently supported operators are as follows:

```
  println(0x7fL.land(-1L)) // bitwise and
  println(0x7fL.lor(-1L))  // bitwise or
  println(0x7fL.lxor(-1L)) // bitwise xor
  println(0x7fL.asr(2L))   // arithmetic shift right
  println(0x7fL.lsl(2L))   // logic shift left
  println(0x7fL.lsr(2L))   // logic shift right
  println(0x7fL.clz())     // count leading zero
  println(0x7fL.ctz())     // count trailing zero
  println(0x7fL.popcnt())  // count the amount of 1s
```

### 2. Reinterpret Support between Int64 and Float Data Types

MoonBit enables [reinterpretation](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/Numeric/Reinterpret) between 64-bit integers and 64-bit floating-point numbers. This means we can obtain a 64-bit floating-point number from a 64-bit integer by bitwise copying each bit, and vice versa.

```
  println(3.14.reinterpret_as_i64())  // output: 4614253070214989087
  print_float(4614253070214989087L.reinterpret_as_f64()) // output: 3.14
```

## MoonBit Gallery

### 1. Tetris Game Developed With MoonBit

This week, the MoonBit gallery added a Tetris game. We can modify the code in real-time on the IDE to view the running effect, such as changing the background color and the speed of block falling.

Please experience it here: [https://www.MoonBitlang.com/gallery/tetris/](https://www.moonbitlang.com/gallery/tetris/)

![俄罗斯方块|538x472](./Tetris.png)

### 2. Awesome-MoonBit

MoonBit has been officially in Alpha testing for over a month, during which a number of interesting projects implemented using MoonBit have emerged. As a result, we have created the [Awesome-MoonBit](https://github.com/moonbitlang/awesome-moonbit) project to help everyone learn MoonBit better and understand the projects currently developed with MoonBit.
