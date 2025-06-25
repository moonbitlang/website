/*
 * Copyright 2025 International Digital Economy Academy
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react'
import clsx from 'clsx'
import Link from '@docusaurus/Link'
import Translate from '@docusaurus/Translate'
import Heading from '@theme/Heading'

const Galleries = [
  {
    name: 'Tetris',
    image: '/img/gallery/tetris.png',
    url: 'pathname:///gallery/tetris/',
    description: (
      <Translate id='playground.codesandbox.tetris.description'>
        A traditional tetris game development in MoonBit using web canvas API.
        You can change the MoonBit code and see the result on the fly.
      </Translate>
    )
  },
  {
    name: 'Mario',
    image: '/img/gallery/mario.png',
    url: 'pathname:///gallery/mario/',
    description: (
      <Translate id='playground.codesandbox.mario.description'>
        A mario game development in MoonBit using web canvas API. You can change
        the MoonBit code and see the result on the fly.
      </Translate>
    )
  },
  {
    name: 'Sudoku',
    image: '/img/gallery/sudoku.png',
    url: 'pathname:///gallery/sudoku/',
    description: (
      <Translate id='playground.codesandbox.sudoku.description'>
        A sudoku solver written in MoonBit
      </Translate>
    )
  },
  {
    name: 'Snake',
    image: '/img/gallery/snake.png',
    url: 'pathname:///gallery/snake/',
    description: (
      <Translate id='playground.codesandbox.snake.description'>
        A snake game written in MoonBit
      </Translate>
    )
  },
  {
    name: 'Wasm4 Snake',
    image: '/img/gallery/wasm4-snake.png',
    url: 'pathname:///gallery/wasm4-snake/',
    description: (
      <Translate id='playground.codesandbox.wasm4snake.description'>
        A snake game written in MoonBit using wasm4 game engine
      </Translate>
    )
  }
]

interface Props {
  name: string
  image: string
  url: string
  description: JSX.Element
}

function GalleryCard({
  name,
  image,
  url,
  description
}: Props): React.JSX.Element {
  return (
    <div className='col col--6 margin-bottom--lg'>
      <div className={clsx('card')}>
        <div className={clsx('card__image')}>
          <Link to={url}>
            <img src={image} alt={`${name}'s image`} />
          </Link>
        </div>
        <div className='card__body'>
          <Heading as='h3'>{name}</Heading>
          <p>{description}</p>
        </div>
      </div>
    </div>
  )
}

export function GalleryCardsRow(): JSX.Element {
  return (
    <div className='row'>
      {Galleries.map((playground) => (
        <GalleryCard key={playground.name} {...playground} />
      ))}
    </div>
  )
}
