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

type ContestNavbarItem = {
  name: string
  href: string
  isActive?: boolean
}

const items: ContestNavbarItem[] = [
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

export default function ContestNavbar({
  activeIndex
}: {
  activeIndex: number
}) {
  return (
    <nav className={styles['navbar']}>
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
  )
}
