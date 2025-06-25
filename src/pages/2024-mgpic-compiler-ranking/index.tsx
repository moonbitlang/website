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

import Layout from '@theme/Layout'
import styles from './styles.module.css'
import clsx from 'clsx'

export default function Page() {
  return (
    <Layout>
      <main className={styles['contest-main']}>
        <div className={styles['section-wrapper']}>
          <section className={styles['hero-section']}>
            <img
              className={styles['desktop-hero-img']}
              src='/img/contest/desktop-hero.jpg'
              alt=''
            />
            <img
              className={styles['mobile-hero-img']}
              src='/img/contest/mobile-hero.jpg'
              alt=''
            />
          </section>
        </div>

        <div className={styles['section-wrapper']}>
          <nav className={styles['navbar']}>
            <div className={styles['navbar__item']}>
              <a href='/2024-mgpic'>总章程</a>
            </div>
            <div className={styles['navbar__item']}>
              <a href='/2024-mgpic-compiler'>编程语言赛道</a>
            </div>
            <div className={styles['navbar__item']}>
              <a href='/2024-mgpic-game'>游戏赛道</a>
            </div>
            <div className={styles['navbar__item']}>
              <a href='https://moonbitlang.github.io/MoonBit-Code-JAM-2024/'>
                游戏作品展示
              </a>
            </div>
            <div
              className={clsx(
                styles['navbar__item'],
                styles['navbar__item__active']
              )}
            >
              <a href='https://tianchi.aliyun.com/competition/entrance/532263/rankingList'>
                排行榜
              </a>
            </div>
          </nav>
        </div>

        <div className={styles['section-wrapper']}>
          <article>
            <h1>敬请期待</h1>
          </article>
        </div>
      </main>
    </Layout>
  )
}
