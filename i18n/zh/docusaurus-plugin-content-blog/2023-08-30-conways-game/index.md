---
description: 如何用Moonbit开发生命游戏
slug: conways-game
image: ./cover.png
tags: [MoonBit, Coding Practice]
draft: true
---

import Cover from './cover.png'
import Area from './Area.mp4'
import gameOfLifeRules from './gameofliferules11.png'
import lifeGame from './life-game.gif'

# The Genesis Code of Life: 如何用Moonbit开发生命游戏？

<img src={Cover} />

距离我们在海外正式推出公测已有两周，在这两周中，我们看到不少的用户开始跃跃欲试，用Moonbit做各种项目的尝试。其中就有这样一位用户，他是来自知名公司GreenLabs的工程师Woonki，他在Twitter上分享了自己最新的尝试：使用Moonbit重新构建经典的生命游戏，同时在构建生命游戏中，Moonbit卓越的编译速度也让他大开眼界。

<!--truncate-->

<video controls src={Area} style={{width: '100%'}}></video>

**生命游戏**，这个名字对大多数人来说并不陌生，它是由数学家约翰·康威（John Conway）于1970年创造，是一种零玩家游戏，它通过简单的规则模拟了细胞的演化过程。Moonbit与生命游戏的结合，为我们展示了一个新的视角。

今天，我们将探讨如何使用Moonbit来重新编写生命游戏，不管你是一个编程新手或者是经验丰富的开发者，跟着我们的步伐，你都可以游刃有余地开启这个探索之旅。

但首先，让我们来了解一下这个特别的游戏——**为何生命游戏没有玩家，但在学术圈火了半个世纪？**

# 什么是生命游戏

当你的计算机屏幕上出现自我复制的现象时，你会最先想到什么？也许是病毒？然而，除了电脑病毒，还存在另一种具有自我复制能力的存在。这种数字化生物栖息在一个二维方格世界里，被称作“生命游戏”。

严格来说，生命游戏并非游戏，因其内无玩家参与。康威将其描述为一种“无玩家参与且永无终结”的“游戏”，因为这些数字化的细胞也有生老病死的过程。

物理学家斯蒂芬·霍金（Stephen Hawking）就这样写道：“**我们完全可以想象，像生命游戏这样的东西，只有少数几个基本定律，就可以产生高度复杂的特征，甚至可能产生智能。**”

在这个虚拟世界中，每个黑色格子代表一个细胞，而白色格子则相当于什么都没有。假设细胞存在着生老病死，并且每个细胞的存活取决于它周围细胞的个数，这里就跟远古时期的“部落”概念一致，人太多或者太少都不利于生命的繁衍，所以我们需要制定一些规则。游戏规则如下：

1. 如果一个细胞周围只有1个或0个其他细胞，它将会孤独而死
1. 如果一个细胞要想存活下来或繁衍，周围细胞的数量必须保持在2到3个之间
1. 如果细胞周围有4个或更多细胞相邻，它将因过度拥挤而死
1. 如果细胞周围有3个邻居，它将在空白处产生一个新细胞，游戏将继续繁衍

<img src={gameOfLifeRules} style={{display:'block', margin:'1rem auto'}} />

The source of picture：[https://qualityswdev.com/2011/07/31/conways-game-of-life-in-scala/](https://qualityswdev.com/2011/07/31/conways-game-of-life-in-scala/)

这些简单的规则创造出一个充满生命和变化的虚拟世界，令人着迷。正是这种复杂性吸引了众多数学、物理和计算机科学的学生和爱好者，他们将其视为一种宝贵的娱乐方式。

# 如何用 Moonbit + JS 编写生命游戏

为了编写康威生命游戏，我们可以充分利用 Moonbit 这个面向 WebAssembly 的语言。首先，我们可以使用Moonbit编写生命游戏的逻辑，然后将其编译成 WebAssembly (wasm) 格式。接下来，我们可以使用 JavaScript 代码加载 wasm 代码，并通过 canvas 来渲染生命游戏的逻辑。

## Moonbit 编写生命游戏的逻辑

在开始之前，请确保你已经从官方网站下载了 [Moonbit 工具链](/download)。

康威游戏中细胞的生命有两种状态：生和死。我们可以使用 `enum` 来表示

```moonbit
enum Cell {
  Dead
  Alive
}
```

使用一个结构体 `Universe` 来管理细胞的状态， `width` 表示宽度，`height` 表示高度，`cells` 存储了细胞状态的数组

```moonbit
struct Universe {
  width : Int
  height : Int
  mut cells : Array[Cell]
}
```

`live_neighbor_count`用于计算指定位置细胞周围存活细胞的数量，计算规则根据康威游戏的规则来

```moonbit
fn live_neighbor_count(self : Universe, row : Int, column : Int) -> Int {
  var count = 0
  let delta_rows = [self.height - 1, 0, 1]
  let delta_cols = [self.width - 1, 0, 1]
  var r = 0
  while r < 3 {
    var c = 0
    while c < 3 {
      if delta_rows[r] == 0 && delta_cols[c] == 0 {
        c = c + 1
        continue
      }
      let neighbor_row = (row + delta_rows[r]) % self.height
      let neighbor_col = (column + delta_cols[c]) % self.width
      let idx = self.get_index(neighbor_row, neighbor_col)
      count = count + self.get_cell(idx)
      c = c + 1
    }
    r = r + 1
  }
  count
}
```

`tick` 用于进行一次迭代，根据生命游戏规则更新细胞状态。

```moonbit
pub fn tick(self : Universe) {
  let next : Array[Cell] = array_make(self.width * self.height, Dead)
  var r = 0
  while r < self.height {
    var c = 0
    while c < self.width {
      let idx = self.get_index(r, c)
      let cell = self.cells[idx]
      let live_neighbor = self.live_neighbor_count(r, c)
      let next_cell : Cell = match (cell, live_neighbor) {
        (Alive, c) =>
          if c < 2 {
            Dead
          } else if c == 2 || c == 3 {
            Alive
          } else {
            Dead
          }
        (Dead, 3) => Alive
        _ => cell
      }
      next[idx] = next_cell
      c = c + 1
    }
    r = r + 1
  }
  self.cells = next
}
```

编写完成后执行

```bash
moon build
```

## JS 加载代码和渲染

因为 Moonbit 目前只能编译成 wat 代码，所以我们需要借助 wat2wasm 来将 wat 转为 wasm

```bash
wat2wasm target/build/main/main.wat --output=www/src/game_of_life.wasm
```

我们通过下面的代码从 wasm 导入相应的函数

```javascript
WebAssembly.instantiateStreaming(fetch("src/game_of_life.wasm"), importObject)
  .then((obj) => {
    const universe_new = obj.instance.exports["moonbit_game_of_life/lib::new"];
    const universe_tick =
      obj.instance.exports[
        "moonbit_game_of_life/lib::@moonbit_game_of_life/lib.Universe::tick"
      ];
    const universe_cells =
      obj.instance.exports[
        "moonbit_game_of_life/lib::@moonbit_game_of_life/lib.Universe::get_cells"
      ];
    const universe_height =
      obj.instance.exports[
        "moonbit_game_of_life/lib::@moonbit_game_of_life/lib.Universe::get_height"
      ];
    const universe_width =
      obj.instance.exports[
        "moonbit_game_of_life/lib::@moonbit_game_of_life/lib.Universe::get_width"
      ];
    const universe_get_cell =
      obj.instance.exports[
        "moonbit_game_of_life/lib::@moonbit_game_of_life/lib.Universe::get_cell"
      ];
```

初始化 canvas:

```javascript
const canvas = document.getElementById('game-of-life-canvas')
canvas.height = (CELL_SIZE + 1) * height + 1
canvas.width = (CELL_SIZE + 1) * width + 1
```

我们需要不停的渲染画面，需要先调用使用 Moonbit 编写好的 tick 来更新细胞状态，然后调用 `drawGrid` 和 `drawCell` 来画图

```javascript
const renderLoop = () => {
  universe.tick()

  drawGrid()
  drawCells()

  requestAnimationFrame(renderLoop)
}
```

`drawGrid` 就是用于画一个个格子

```javascript
const drawGrid = () => {
  ctx.beginPath()
  ctx.strokeStyle = GRID_COLOR

  for (let i = 0; i <= width; i++) {
    ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0)
    ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1)
  }

  for (let j = 0; j <= height; j++) {
    ctx.moveTo(0, j * (CELL_SIZE + 1) + 1)
    ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1)
  }

  ctx.stroke()
}
```

`drawCells` 使用双重循环来遍历表格，调用 `get_cell` 来获取细胞状态，根据细胞状态来填上不同的颜色

```javascript
const drawCells = () => {
  ctx.beginPath()

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = getIndex(row, col)

      ctx.fillStyle = universe.get_cell(idx) === 0 ? DEAD_COLOR : ALIVE_COLOR

      ctx.fillRect(
        col * (CELL_SIZE + 1) + 1,
        row * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      )
    }
  }

  ctx.stroke()
}
```

完整代码: [https://github.com/mununki/moonbit-wasm-game-of-life](https://github.com/mununki/moonbit-wasm-game-of-life)

这就是具体的操作步骤，根据步骤，可以呈现出这样的效果：

<img src={lifeGame} style={{display:'block', margin:'1rem auto', width: '300px'}} />

根据上面的步骤，你们也可以轻松创建自己的生命游戏。希望这个教程能够激发你们的创造力，让你们在这个独特的虚拟生态系统中畅游。期待看到你们的作品！
