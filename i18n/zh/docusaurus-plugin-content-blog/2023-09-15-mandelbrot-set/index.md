---
description: 如何用MoonBit绘制Mandelbrot Set？
slug: mandelbrot-set
image: ./cover.png
tags: [MoonBit, Coding Practice]
draft: true
---

import Cover from './cover.png'
import Zoom from './Zoom.mp4'
import Result from './result.png'

# 如何用MoonBit绘制Mandelbrot Set？

<img src={Cover} />

<!--truncate-->

大家是否看过下面的视频：

<video controls src={Zoom} style={{width: '100%'}}></video>

它就是著名的曼德博集合（Mandelbrot set，或译为曼德布洛特复数集合），是一种在复平面上组成分形的点的集合，是数学家本华.曼德博Benoit B. Mandelbrot提出的分形理论中最著名的分形。

这个集合的奇妙之处在于，将曼德博集合无限放大都能够有精妙的细节在内，而这瑰丽的图案仅仅由一个简单的公式生成。因此有人认为曼德博集合是“人类有史以来做出的最奇异、最瑰丽的几何图形”，曾被称为“上帝的指纹”。

今天，我们将分享什么是分形理论，如何用MoonBit来绘制出曼德博分形，用MoonBit发现数学之美。

## 什么是分形理论？

首先，让我们来了解一下什么是分形理论。

分形理论是由**曼德博**在1975年创造的，它源于拉丁语“fractus”，意思是“破碎的”或“断裂的”。分形理论的**数学基础是**分形几何学。分形理论的最基本特点是用分数维度的视角和数学方法描述和研究客观事物。

也正是因为如此，它跳脱出了我们常规世界的维度，可以**更加具体和真实地描述复杂系统**，得以窥见客观事物的**复杂和多样性**。

由于分形具有“无限复杂性”，你可能认为分形很难制作，但这是一个非常简单的过程。要做一个分形，只需要一遍又一遍地重复同样的过程。用数学术语来说，数学分形是一个**迭代**（递归的一种形式）的方程。

最著名的分形是**曼德博集合**，它来自于复数集合$c$。数学家Adrien Douady定义了下面的函数：

$$
  f_c(z) = z^2 + c
$$

以致敬曼德博，并将其命名为**曼德博集合**。当从$z=0$迭代时，不会向无穷大发散。从本质上来说，这是一个迭代公式，式子当中的变量都是复数。所以当你按照这个式子进行代入计算的时候，**局部的图形都能和整体表现出相似的地方**，并且这种相似往往是集中在细微之处的，要**仔细观察才能发现。**

$z_0=0;z_n=z_{n-1}^2+c$

## 如何绘制？

为了确定我们要绘制的图形区域，必须先介绍**区域坐标**这个概念。一个复平面的点由一个复数来表示（d=x+yi）。加上 width 和 height 来确定复平面上一个长方形区域。

假设一个图像宽为$w$个像素，高为$h$个像素，我们需要计算$w\times h$个像素的颜色，并且将它们画上

我们使用 Moonbit 来完成颜色的计算部份，然后将计算完的颜色传给 js，用 js canvas 来画图。

### 颜色的计算

```moonbit
pub fn calc_color(col: Int, row: Int, ox: Double, oy: Double, width: Double) -> Int {
  let pixel_size = width / image_width
  let cx = (float_of_int(col) - coffset) * pixel_size + ox
  let cy = (float_of_int(row) - roffset) * pixel_size + oy
  var r = 0
  var g = 0
  var b = 0
  var i = -1
  while i <= 1 {
    var j = -1
    while j <= 1 {
      let d = iter(
      cx + float_of_int(i) * pixel_size / 3.0,
      cy + float_of_int(j) * pixel_size / 3.0,
      )
      let c = get_color(d)
      r = r + c.asr(16).land(0xFF)
      g = g + c.asr(8).land(0xFF)
      b = b + c.land(0xFF)
      j = j + 1
    }
    i = i + 1
  }
  r = r / 9
  g = g / 9
  b = b / 9
  return r.lsl(16).lor(g.lsl(8)).lor(b)
}
```

这里用于计算 row 行和 col 列那个像素所代表的复平面上的正方形的中心点的坐标

```javascript
let pixel_size = width / image_width
let cx = (float_of_int(col) - coffset) * pixel_size + ox
let cy = (float_of_int(row) - roffset) * pixel_size + oy
```

我们知道对一个复数$c$，它属于Mandelbrot集合，当且仅当下面这个递归定义得到的无穷复数列一直处于复平面上以原点为中心以$2$为半径的圆内：$z_0 = 0;\ z_n = z_{n-1}^2 + c$; 如果我们把 $z_k$ 写成 $x_k+y_ki$ 这样实部和虚部分开的形式，同样也把$c$写成$c_x+c_yi$的形式（$c_x$和$c_y$分别为c的实部和虚部），那么上面的递归定义其实就是 $x_0 = 0, y_0 = 0;\ x_n = x_{n-1}^2 - y_{n-1}^2 + c_x, y_n = 2x_{n-1}y_{n-1} + c_y$ 复数 $c_x+c_yi$ 属于Mandelbrot集合，当且仅当对所有的自然数n，$x_n^2+y_n^2 < 2^2 = 4$。

`calc_color` 接下来调用 `iter` 来计算 $x_n$ 和 $y_n$。这个函数返回首次出逃逸半径时的迭代次数，如果迭代了 max_iter_number 次没有逃逸就返回 -1.0

```moonbit
pub fn iter(cx : Double, cy : Double) -> Double {
  var x = 0.0
  var y = 0.0
  var newx = 0.0
  var newy = 0.0
  var smodz = 0.0
  var i = 0
  while i < max_iter_number {
    newx = x * x - y * y + cx
    newy = 2.0 * x * y + cy
    x = newx
    y = newy
    i = i + 1
    smodz = x * x + y * y
    if smodz >= escape_radius {
      return float_of_int(i) + 1.0 - log(log(smodz) * 0.5) / log(2.0)
    }
  }
  return -1.0
}
```

接着我们需要根据返回的迭代次数来选择相应的颜色。我们首先需要的是一个调色盘，这就是 `interpolation` 的作用，`interpolation` 用于生成色彩梯度。

```moonbit
fn interpolation(f : Double, c0 : Int, c1 : Int) -> Int {
  let r0 = c0.asr(16).land(0xFF)
  let g0 = c0.asr(8).land(0xFF)
  let b0 = c0.land(0xFF)
  let r1 = c1.asr(16).land(0xFF)
  let g1 = c1.asr(8).land(0xFF)
  let b1 = c1.land(0xFF)
  let r = floor((1.0 - f) * float_of_int(r0) + f * float_of_int(r1) + 0.5)
  let g = floor((1.0 - f) * float_of_int(g0) + f * float_of_int(g1) + 0.5)
  let b = floor((1.0 - f) * float_of_int(b0) + f * float_of_int(b1) + 0.5)
  return r.lsl(16).lor(g.lsl(8).lor(b))
}
```

`getColor` 先将迭代次数进行一些转换然后传个 `interpolation` 来得到相应的颜色

```moonbit
pub fn get_color(d : Double) -> Int {
  if d >= 0.0 {
    var k = 0.021 * (d - 1.0 + log(log(128.0)) / log(2.0))
    k = log(1.0 + k) - 29.0 / 400.0
    k = k - float_of_int(floor(k))
    k = k * 400.0
    if k < 63.0 {
      return interpolation(k / 63.0, 0x000764, 0x206BCB)
    } else if k < 167.0 {
      return interpolation((k - 63.0) / (167.0 - 63.0), 0x206BCB, 0xEDFFFF)
    } else if k < 256.0 {
      return interpolation((k - 167.0) / (256.0 - 167.0), 0xEDFFFF, 0xFFAA00)
    } else if k < 342.0 {
      return interpolation((k - 256.0) / (342.0 - 256.0), 0xFFAA00, 0x310230)
    } else {
      return interpolation((k - 342.0) / (400.0 - 342.0), 0x310230, 0x000764)
    }
  } else {
    return 0x000000
  }
}
```

颜色的计算到此就完成了。

### 使用 canvas 绘制

创建一个 canvas

```html
<html>
  <body>
    <canvas id="canvas"></canvas>
  </body>
</html>
```

在 js 代码中获取 canvas，设置 canvas 的大小

```javascript
let canvas = document.getElementById('canvas')
var IMAGEWIDTH = 800
var IMAGEHEIGHT = 600
canvas.width = IMAGEWIDTH
canvas.height = IMAGEHEIGHT
```

创建一个 `ImageData` 来保存计算好的像素的颜色

```javascript
var imagedata = context.createImageData(IMAGEWIDTH, IMAGEHEIGHT)
```

接着导入 Moonbit 代码

```javascript
WebAssembly.instantiateStreaming(
  fetch('target/mandelbrot.wasm'),
  spectest
).then((obj) => {
  obj.instance.exports._start()
  const calcColor = obj.instance.exports['mandelbrot/lib::calc_color']
  const drawColor = obj.instance.exports['mandelbrot/lib::draw_color']

  //...
})
```

绘制图像：

```javascript
function saveImage() {
  context.putImageData(imagedata, 0, 0)
}

function generateImage() {
  for (row = 0; row < IMAGEHEIGHT; row++) {
    for (col = 0; col < IMAGEWIDTH; col++) {
      let x = +ox.value
      let y = +oy.value
      let w = +width.value
      var color = calcColor(col, row, x, y, w)
      drawColor(imagedata, col, row, color)
    }
  }

  saveImage()
}
```

这就是具体实现的效果图：

<img src={Result}/>

Mandelbrot 的绘制涉及很多数学推导，这篇博客没有详细的解释，可以参考:

1. [https://eigolomoh.bitbucket.io/math/draw_mandelbrot.1.html](https://eigolomoh.bitbucket.io/math/draw_mandelbrot.1.html)

完整的代码：[https://github.com/moonbitlang/moonbit-docs/pull/69/files](https://github.com/moonbitlang/moonbit-docs/pull/69/files)

好啦，这就是今天分享的全部内容，期待你们的分享。
