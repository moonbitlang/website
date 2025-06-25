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
import Link from '@docusaurus/Link'

const lecture1 = '/img/events/lecture1.png'
const campus1 = '/img/events/campus1.png'
const meetup1 = '/img/events/meetup1.png'
const meetup2 = '/img/events/meetup2.png'
const meetup3 = '/img/events/meetup3.png'
const meetup4 = '/img/events/meetup4.png'
const meetup5 = '/img/events/meetup5.png'
const meetup6 = '/img/events/meetup6.jpg'
const meetup7 = '/img/events/meetup7.png'
const meetup8 = '/img/events/meetup8.png'
const meetuphaiwai11 = '/img/events/meetup-haiwai1-1.png'
const meetuphaiwai12 = '/img/events/meetup-haiwai1-2.png'
const ojcontest1 = '/img/events/oj-contest1.png'
const ojcontest2 = '/img/events/oj-contest2.png'
const ojcontest3 = '/img/events/oj-contest3.png'

type MeetUp = {
  title: string
  href: string
  img: any
}

const meetups: MeetUp[] = [
  {
    title: 'MoonBit Meetup 2025年 成都站',
    href: 'https://mp.weixin.qq.com/s/libPOjb8pgFaNlMGEORt4Q',
    img: meetup8
  },
  {
    title: 'MoonBit Meetup 25年第一期（AI 时代下的编程软件）',
    href: 'https://mp.weixin.qq.com/s/vDvsqxNAUzkijsPg26RIHA',
    img: meetup7
  },
  {
    title: '年终 Meetup丨MoonBit 2024年度回顾与未来展望',
    href: 'https://mp.weixin.qq.com/s/wR8rZIoyEihnilHmxYDgCw',
    img: meetup6
  },
  {
    title: '第五期 Meetup （11.3-上海）',
    href: 'https://mp.weixin.qq.com/s/yaI45jtaE7O9Z7t_46kg5A',
    img: meetup5
  },
  {
    title: '海外Meetup (12.22-12.23-新加坡)',
    href: 'https://mp.weixin.qq.com/s/bMiko2UcIAHPe2RGJypxMw',
    img: meetuphaiwai11
  },
  {
    title: '海外Meetup (12.22-12.23-新加坡)',
    href: 'https://mp.weixin.qq.com/s/bMiko2UcIAHPe2RGJypxMw',
    img: meetuphaiwai12
  },
  {
    title: '第四期 Meetup (9.1-深圳）',
    href: 'https://mp.weixin.qq.com/s/gu0m2xyKiTDsJHNe6e3SvQ',
    img: meetup4
  },
  {
    title: '第三期 Meetup （6.29-北京）',
    href: 'https://mp.weixin.qq.com/s/bO4zE8jPzYNpeN1eaYMexA',
    img: meetup3
  },
  {
    title: 'MoonBit MeetUp 深圳站｜探索国产基础软件新发展',
    href: 'https://mp.weixin.qq.com/s/eSsu2ZoAfE6yiwPGRTGMRw',
    img: meetup1
  },
  {
    title: 'MoonBit MeetUp 深圳站｜AI 时代下的新编程',
    href: 'https://mp.weixin.qq.com/s/Q8129AQo0z_en-EEZWMUxA',
    img: meetup2
  }
]

const ojs: MeetUp[] = [
  {
    title: 'MoonBit 线上编程竞技赛启动！',

    href: '/2024-oj-contest',
    img: ojcontest1
  },
  {
    title: 'MoonBit 好友共练计划上线！',
    href: '/2024-oj-contest#好友共练计划',
    img: ojcontest2
  },
  {
    title: 'MoonBit OJ编程竞赛选拔赛火热开启！',
    href: '/2024-oj-contest#oj-%E7%BA%BF%E4%B8%8A%E7%BC%96%E7%A8%8B%E7%AB%9E%E8%B5%9B%E9%80%89%E6%8B%94%E8%B5%9B',
    img: ojcontest3
  }
]

export default function Page() {
  return (
    <Layout>
      <main className={styles['main']}>
        <section className={styles['section']}>
          <h1>MoonBit MeetUp</h1>
          <div className={styles['cards']}>
            {meetups.map((meetup) => (
              <div key={meetup.href} className={styles['card']}>
                <a href={meetup.href} className={styles['card__image']}>
                  <img src={meetup.img} alt={meetup.title} />
                </a>
                <a href={meetup.href} className={styles['card__link']}>
                  {meetup.title}
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className={styles['section']}>
          <h1>MoonBit 编程比赛</h1>
          <div className={styles['cards']}>
            {ojs.reverse().map((oj) => (
              <div key={oj.href} className={styles['card']}>
                <Link href={oj.href} className={styles['card__image']}>
                  <img src={oj.img} alt={oj.title} />
                </Link>
                <Link href={oj.href} className={styles['card__link']}>
                  {oj.title}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className={styles['section']}>
          <h1>MoonBit 线上讲座</h1>
          <div className={styles['cards']}>
            <div className={styles['card']}>
              <a
                href='https://mp.weixin.qq.com/s/iF9lipkwBWHo2YSVsr0k8Q'
                className={styles['card__image']}
              >
                <img src={lecture1} alt='MoonBit 线上讲座' />
              </a>
              <a
                href='https://mp.weixin.qq.com/s/iF9lipkwBWHo2YSVsr0k8Q'
                className={styles['card__link']}
              >
                MoonBit 直播｜从平衡搜索树到 HAMT，用 MoonBit 高效实现
              </a>
            </div>
          </div>
        </section>

        <section className={styles['section']}>
          <h1>MoonBit 校园活动</h1>
          <div className={styles['cards']}>
            <div className={styles['card']}>
              <a
                href='https://mp.weixin.qq.com/s/reHus5MWgEqyuMesR6xPqA'
                className={styles['card__image']}
              >
                <img src={campus1} alt='MoonBit 校园活动' />
              </a>
              <a
                href='https://mp.weixin.qq.com/s/reHus5MWgEqyuMesR6xPqA'
                className={styles['card__link']}
              >
                MoonBit 校园大使
              </a>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}
