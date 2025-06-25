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

import React, { useState } from 'react'
import styles from './styles.module.css'
import clsx from 'clsx'
import BrowserOnly from '@docusaurus/BrowserOnly'

type Item = {
  title: string
  code: string
}

const MobileTabs: React.FC<{
  items: Item[]
  setFocusIndex: React.Dispatch<React.SetStateAction<number>>
}> = (props) => {
  const { items, setFocusIndex } = props
  return (
    <select
      className={styles['mobile-tabs-select']}
      onChange={(e) => {
        setFocusIndex(Number(e.target.value))
      }}
    >
      {items.map((item, index) => {
        return (
          <option
            key={item.title}
            value={index}
            onSelect={() => {
              setFocusIndex(index)
            }}
          >
            {item.title}
          </option>
        )
      })}
    </select>
  )
}

const DesktopTabs: React.FC<{
  items: Item[]
  focusIndex: number
  setFocusIndex: React.Dispatch<React.SetStateAction<number>>
}> = (props) => {
  const { items, focusIndex, setFocusIndex } = props
  return (
    <div className={styles['desktop-tabs']}>
      {items.map((item, index) => {
        let className = styles['desktop-tab-item']
        if (index === focusIndex) {
          className = clsx(className, styles['desktop-tab-item--active'])
        }
        return (
          <div
            className={className}
            key={item.title}
            onClick={() => {
              setFocusIndex(index)
            }}
          >
            {item.title}
          </div>
        )
      })}
    </div>
  )
}

const MoonpadMonacoTabs: React.FC<{ items: Item[] }> = (props) => {
  const { items } = props
  const [focusIndex, setFocusIndex] = useState(0)
  const [output, setOutput] = useState('')
  return (
    <div className={styles.container}>
      <MobileTabs items={items} setFocusIndex={setFocusIndex} />
      <DesktopTabs
        items={items}
        focusIndex={focusIndex}
        setFocusIndex={setFocusIndex}
      />
      <div className={styles['moonpad-monaco-container']}>
        <BrowserOnly fallback={<div></div>}>
          {() => {
            const MoonpadMonaco =
              require('@site/src/components/MoonpadMonaco').default
            return (
              <MoonpadMonaco
                className={styles['moonpad-monaco']}
                value={items[focusIndex].code}
                onOutput={async (s: ReadableStream<string>) => {
                  let buffer = ''
                  await s.pipeTo(
                    new WritableStream({
                      write(chunk) {
                        buffer += chunk + '\n'
                      }
                    })
                  )
                  setOutput(buffer)
                }}
              />
            )
          }}
        </BrowserOnly>
      </div>
      <div className={styles['output']}>
        <pre>{output}</pre>
      </div>
    </div>
  )
}

export default MoonpadMonacoTabs
