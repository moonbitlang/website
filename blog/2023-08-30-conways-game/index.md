---
description: How to make Conway's Game of Life in Moonbit?
slug: conways-game
image: ./cover.png
tags: [MoonBit, Coding Practice]
draft: true
---

import Cover from './cover.png'
import Area from './Area.mp4'
import gameOfLifeRules from './gameofliferules11.png'
import lifeGame from './life-game.gif'

# The Genesis Code of Life: How to make Conway's Game of Life in Moonbit?

<img src={Cover} />

It has been two weeks since we officially launched the Moonbit. We've witnessed numerous users eagerly diving into various projects with Moonbit over this time. Woonki, an engineer hailing from the renowned GreenLabs company, is one of them, and he excitedly shared on Twitter his latest endeavor: using Moonbit to revamp the classic Game of Life. Notably, Moonbit's outstanding compilation speed during this project has truly astounded him.

<!--truncate-->

<video controls src={Area} style={{width: '100%'}}></video>

The Game of Life, a well-known game to many people, was conceived by the mathematician John Conway in 1970. It is a zero-player game that simulates the evolution of cells through simple rules. The fusion of Moonbit with the Game of Life offers us a fresh perspective.

Today, we will explore how to rewrite the Game of Life using Moonbit. Whether you're a programming novice or an experienced developer, you can easily embark on this project by following our steps.

But before we dive into the technical details, let's take a moment to ponder the unique appeal of the Game of Life. Despite its lack of traditional players, this remarkable cellular automaton has remained a captivating subject of discussion in academic circles for over half-century.

# What is the Game of Life?

When you see a phenomenon of self-replication on your computer screen, what's the first thing comes to your mind? Perhaps a computer virus? However, there exists another entity with the capability of self-replication. This digital life resides within a two-dimensional grid world and is famously known as the "Game of Life.”

To be precise, the Game of Life isn't truly a game, for it operates without the involvement of players. Conway described it as a "game" that is "played with no players and never-ending", as these digital cells also undergo processes of birth, aging, sickness, and death.

As the renowned physicist Stephen Hawking once said: "It’s possible to imagine that something like ‘The Game of Life’, with only a few basic laws might produce highly complex features, perhaps even intelligence."

In this virtual world, each black square represents a cell, while the white squares signify emptiness. Just as the survival of organisms in the natural world depends on the dynamics of populations, here, too, we establish some rules to govern life and death:

And so, here are the fundamental rules:

1. If a cell has only 1 or 0 other cells neighboring it, it will die of loneliness.
2. If a cell want to survive or reproduce, the number of neighboring cells must remain between 2 and 3.
3. If a cell is surrounded by 4 or more neighboring cells, it will die due to overcrowding.
4. If a cell is surrounded by 3 neighbors, it will give birth to a new cell in an empty space, and the game will continue to propagate.

<img src={gameOfLifeRules} style={{display:'block', margin:'1rem auto'}} />

The source of picture：[https://qualityswdev.com/2011/07/31/conways-game-of-life-in-scala/](https://qualityswdev.com/2011/07/31/conways-game-of-life-in-scala/)

These simple rules create a virtual world teeming with life and dynamism, captivating the imagination. It's precisely this complexity that has drawn the interest of countless students and enthusiasts in mathematics, physics, and computer science, who perceive it as a valuable form of entertainment.

# So, how to use Moonbit + JS to write Conway's Game of Life?

To write Conway's Game of Life using Moonbit, we can follow these steps: Firstly, we can utilize Moonbit to script the logic of the Game of Life. Subsequently, we can compile it into WebAssembly (wasm) format. Then, we can employ JavaScript code to load the wasm code and use a canvas to render the logic of the Game of Life.

## Using Moonbit to Write the Logic of the Game of Life

Before we begin, make sure you have downloaded the [Moonbit toolchain](/download) from the official website.

In Conway's Game of Life, cells have two states: alive and dead. We can use an `enum` to represent them:

```moonbit
enum Cell {
  Dead
  Alive
}
```

Use a structure named `Universe` to manage the states of cells. `width` represents the width, `height` represents the height, and `cells` stores an array of cell states:

```moonbit
struct Universe {
  width : Int
  height : Int
  mut cells : Array[Cell]
}
```

`live_neighbor_count` is used to caculate the number of living cells around a specified cell location, following the rules of Conway's Game of Life:

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

`tick` is used for one iteration, updating cell states based on the rules of the Game of Life.

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

Execute function after completing writing:

```other
moon build
```

## Loading code and Rendering in Javascript

Moonbit currently can only compile to wat code, so we need to use `wat2wasm` to convert wat to wasm.

```other
wat2wasm target/build/main/main.wat --output=www/src/game_of_life.wasm
```

Using the code below, we import the corresponding functions from wasm.

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

Initialize the canvas:

```javascript
const canvas = document.getElementById('game-of-life-canvas')
canvas.height = (CELL_SIZE + 1) * height + 1
canvas.width = (CELL_SIZE + 1) * width + 1
```

We need to continuously render the screen, so we start by calling the `tick` function written using Moonbit to update the cell states, and then we invoke `drawGrid` and `drawCell` to draw the graphics.

```javascript
const renderLoop = () => {
  universe.tick()

  drawGrid()
  drawCells()

  requestAnimationFrame(renderLoop)
}
```

`drawGrid` is used to draw individual grid cells:

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

`drawCells` uses a double loop to iterate through the grid, calls `get_cell` to capture the cell state, and fills them with different colors based on the cell state.

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

Complete code: [https://github.com/mununki/moonbit-wasm-game-of-life](https://github.com/mununki/moonbit-wasm-game-of-life)

According to these steps, you can achieve the following effect:

<img src={lifeGame} style={{display:'block', margin:'1rem auto', width: '300px'}} />

By following the steps, you can easily create your own Game of Life. We hope this tutorial sparks your creativity and allows you to explore this virtual ecosystem. Looking forward to seeing your creations!
