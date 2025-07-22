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

import Link from '@docusaurus/Link'
import styles from './styles.module.css'
import clsx from 'clsx'

export type ContestNavbarItem = {
  name: string
  href: string
  isActive?: boolean
}

type SignupButton = {
  text: string
  href: string
}

export const items2024: ContestNavbarItem[] = [
  { name: '总章程', href: '/2024-mgpic' },
  { name: '编程语言赛道', href: '/2024-mgpic-compiler' },
  { name: '游戏赛道', href: '/2024-mgpic-game' },
  {
    name: '游戏作品展示',
    href: 'https://moonbitlang.github.io/MoonBit-Code-JAM-2024/'
  },
  {
    name: '排行榜',
    href: 'https://tianchi.aliyun.com/competition/entrance/532263/rankingList'
  }
]

export const items2025: ContestNavbarItem[] = [
  { name: '总章程', href: '/2025-mgpic' },
  { name: '编程语言赛道', href: '/2025-mgpic-compiler' },
  { name: '游戏赛道', href: '/2025-mgpic-game' },
  {
    name: '游戏作品展示',
    href: 'https://moonbitlang.github.io/MoonBit-Code-JAM-2025/'
  },
  {
    name: '排行榜',
    href: 'https://tianchi.aliyun.com/competition/entrance/532402/rankingList'
  }
]

export default function ContestNavbar({
  activeIndex,
  items,
  qqGroup = false,
  buttons
}: {
  activeIndex: number
  items: ContestNavbarItem[]
  qqGroup: boolean
  buttons?: SignupButton[]
}) {
  return (
    <>
      <nav className={styles['navbar']}>
        {qqGroup && (
          <div className={styles['qq-group']}>
            <div className={styles['qq-group__card']}>
              <img src='/img/contest/qq-group.jpg' alt='' />
              <div className={styles['qq-group__text']}>
                大赛官方QQ群
                <br />
                914387051
              </div>
            </div>
          </div>
        )}
        {items.map((item, i) => (
          <div
            key={item.name}
            className={clsx(
              styles['navbar__item'],
              i === activeIndex && styles['navbar__item__active']
            )}
          >
            <Link href={item.href}>{item.name}</Link>
          </div>
        ))}
      </nav>

      {buttons && (
        <section className={styles['signup-section']}>
          {buttons.map((button) => (
            <a
              key={button.text}
              href={button.href}
              className={clsx(
                'button',
                'button--primary',
                'button--lg',
                styles['signup-button']
              )}
            >
              <span>{button.text}</span>
            </a>
          ))}
        </section>
      )}
    </>
  )
}
