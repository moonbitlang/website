# weekly 2023-09-25

<!--truncate-->

## MoonBit更新

### 1. Int64支持位运算

MoonBit支持Int64类型的数字继续位运算，当前支持的运算符如下:

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

### 2. Int64与Float数据类型支持reinterpret

MoonBit的64位整数和64位浮点数之间的 [reinterpret](https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/Numeric/Reinterpret)，这意味着我们可以通过对每个 bit 进行逐位复制的方式从一个64位整数得到一个64位浮点数，反之亦然

```
  println(3.14.reinterpret_as_i64())  // output: 4614253070214989087
  print_float(4614253070214989087L.reinterpret_as_f64()) // output: 3.14
```

## MoonBit Gallery

### 1. 用MoonBit开发的俄罗斯方块游戏

本周MoonBit gallery增加俄罗斯方块游戏，我们可以在IDE上实时修改代码查看运行效果，比如修改背景颜色、方块下落速度等。欢迎体验：

https://www.moonbitlang.cn/gallery/tetris/

![俄罗斯方块2|538x472](./Tetris.png)

### 2. Awesome-MoonBit

MoonBit正式进入Alpha测试至今的1个多月时间里面，出现了一些用MoonBit实现的有意思的项目，为此，我们创建了[Awesome-MoonBit](https://github.com/moonbitlang/awesome-moonbit)这个项目帮助大家更好的学习MoonBit以及了解当前用MoonBit开发的项目。
