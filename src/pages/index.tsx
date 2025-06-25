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
import { translate } from '@docusaurus/Translate'
import MoonpadMonacoTabs from '@site/src/components/MoonpadMonacoTabs'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import RecentBlogPosts from '@site/src/components/RecentBlogPosts'
import { HiChevronRight } from 'react-icons/hi'
import Link from '@docusaurus/Link'

export default function Page() {
  const siteConfig = useDocusaurusContext().siteConfig
  const nrRecentBlogPosts = siteConfig.customFields!
    .recentBlogPostsOnHomePage as number
  const examples = siteConfig.customFields!.homePageCodeExamples as any
  const isZh = useDocusaurusContext().i18n.currentLocale.startsWith('zh')
  return (
    <Layout>
      <main
        className={clsx(
          styles['index-main'],
          isZh ? styles['zh'] : styles['en']
        )}
      >
        <div className={styles['section-wrapper']}>
          <section className={styles['hero-section']}>
            <div className={styles['hero-section-left']}>
              <h1>
                <span className={styles['plain-span']}>
                  {translate({ id: 'index.hero-section.span0' })}
                </span>
                <span className={styles['colorful-span']}>
                  {translate({ id: 'index.hero-section.span1' })}
                </span>
                <span className={styles['plain-span']}>
                  {translate({ id: 'index.hero-section.span2' })}
                </span>
              </h1>
              <p>{translate({ id: 'index.hero-section.advantages' })}</p>
              <div className={styles['hero-buttons']}>
                <Link className={styles['colorful-button']} href='/download'>
                  {translate({ id: 'index.get-started' })}
                </Link>
                <a
                  className={styles['with-right-arrow']}
                  href={translate({ id: 'index.tour-url' })}
                >
                  {translate({ id: 'index.language-tour' })}
                </a>
              </div>
            </div>
            <div className={styles['hero-section-right']}>
              <img
                src={isZh ? '/img/index/hero_zh.jpg' : 'img/index/hero_en.jpg'}
                alt=''
              />
              <img
                className={styles['hero-background']}
                src='/img/index/hero-background.png'
                alt=''
              />
            </div>
          </section>
        </div>

        <div className={styles['section-wrapper']}>
          <section className={styles['why-moonbit']}>
            <h2>{translate({ id: 'index.why-section.why-moonbit' })}</h2>
            <MoonpadMonacoTabs items={examples} />
            <a
              className={styles['colorful-button']}
              style={{ padding: '.75rem 2rem' }}
              href={translate({ id: 'index.tour-url' })}
            >
              {translate({ id: 'index.learn-more' })}
            </a>
          </section>
        </div>

        <div
          className={clsx(
            styles['section-wrapper'],
            styles['first-main-content-section']
          )}
        >
          <section className={styles['main-content-section']}>
            <div>
              <div className={styles['main-content-section--logo']}>
                <img src='/icon/language-design.png' alt='' />
              </div>
              <h2>{translate({ id: 'index.programming-language.title' })}</h2>
              <ul>
                <li>
                  {translate({ id: 'index.programming-language.advantage1' })}
                </li>
                <li>
                  {translate({ id: 'index.programming-language.advantage2' })}
                </li>
                <li>
                  {translate({ id: 'index.programming-language.advantage3' })}
                </li>
              </ul>
              <a
                className={clsx(
                  styles['black-button'],
                  styles['with-right-arrow']
                )}
                href={translate({ id: 'index.docs-url' })}
              >
                {translate({ id: 'index.programming-language.button' })}
              </a>
            </div>
            <div>
              <img src='/img/index/moonbit-language.png' alt='' />
            </div>
          </section>
        </div>

        <div className={styles['section-wrapper']}>
          <section className={styles['main-content-section']}>
            <div>
              <div className={styles['main-content-section--logo']}>
                <img src='/icon/moonbit-ai.png' alt='' />
              </div>
              <h2>{translate({ id: 'index.ai.title' })}</h2>
              <ul>
                <li>{translate({ id: 'index.ai.advantage1' })}</li>
                <li>{translate({ id: 'index.ai.advantage2' })}</li>
                <li>{translate({ id: 'index.ai.advantage3' })}</li>
              </ul>
            </div>
            <div>
              <video autoPlay loop muted playsInline>
                <source src='/img/index/ai.mp4' type='video/mp4' />
              </video>
            </div>
          </section>
        </div>

        <div className={styles['section-wrapper']}>
          <section className={styles['main-content-section']}>
            <div>
              <div className={styles['main-content-section--logo']}>
                <img src='/icon/cloud-ide.png' alt='' />
              </div>
              <h2>{translate({ id: 'index.cloud-ide.title' })}</h2>
              <ul>
                <li>{translate({ id: 'index.cloud-ide.advantage1' })}</li>
                <li>{translate({ id: 'index.cloud-ide.advantage2' })}</li>
              </ul>
              <a
                className={clsx(
                  styles['black-button'],
                  styles['with-right-arrow']
                )}
                href={translate({ id: 'index.cloud-ide.link' })}
              >
                {translate({ id: 'index.cloud-ide.button' })}
              </a>
            </div>
            <div>
              <video autoPlay loop muted playsInline>
                <source src='/img/index/cloud-ide.mp4' type='video/mp4' />
              </video>
            </div>
          </section>
        </div>

        <div className={styles['section-wrapper']}>
          <section className={styles['main-content-section']}>
            <div>
              <div className={styles['main-content-section--logo']}>
                <img src='/icon/toolchain.png' alt='' />
              </div>
              <h2>{translate({ id: 'index.toolchain.title' })}</h2>
              <ul>
                <li>{translate({ id: 'index.toolchain.advantage1' })}</li>
                <li>{translate({ id: 'index.toolchain.advantage2' })}</li>
                <li>{translate({ id: 'index.toolchain.advantage3' })}</li>
              </ul>
              <Link
                className={clsx(
                  styles['black-button'],
                  styles['with-right-arrow']
                )}
                href='/download'
              >
                {translate({ id: 'index.toolchain.button' })}
              </Link>
            </div>
            <div>
              <img src='/img/index/toolchain.png' alt='' />
            </div>
          </section>
        </div>

        <div className={styles['section-wrapper']}>
          <section className={styles['course-section']}>
            <div>
              <img src='/icon/course-tv.svg' alt='' />
            </div>
            <h2>{translate({ id: 'index.course.title' })}</h2>
            <a
              className={styles['colorful-button']}
              style={{ padding: '.5rem 2rem' }}
              href={translate({ id: 'index.course-url' })}
            >
              {translate({ id: 'index.course.button' })}
            </a>
          </section>
        </div>

        <div className={styles['section-wrapper']}>
          <section className={styles['plan-section']}>
            <h2>{translate({ id: 'index.plan.title' })}</h2>
            <div className={styles['plans']}>
              <div className={clsx(styles['plan'], styles['plan0'])}>
                <h3>01</h3>
                <div className={styles['glass']}>
                  <ul>
                    <li>{translate({ id: 'index.plan0.1' })}</li>
                  </ul>
                  <p>{translate({ id: 'index.plan0.time' })}</p>
                </div>
              </div>
              <div className={clsx(styles['plan'], styles['plan1'])}>
                <h3>02</h3>
                <div className={styles['glass']}>
                  <ul>
                    <li>{translate({ id: 'index.plan1.1' })}</li>
                    <li>{translate({ id: 'index.plan1.2' })}</li>
                  </ul>
                  <p>{translate({ id: 'index.plan1.time' })}</p>
                </div>
              </div>
              <div className={clsx(styles['plan'], styles['plan2'])}>
                <h3>03</h3>
                <div className={styles['glass']}>
                  <ul>
                    <li>{translate({ id: 'index.plan2.1' })}</li>
                    <li>{translate({ id: 'index.plan2.2' })}</li>
                  </ul>
                  <p>{translate({ id: 'index.plan2.time' })}</p>
                </div>
              </div>
              <div className={clsx(styles['plan'], styles['plan3'])}>
                <h3>04</h3>
                <div className={styles['glass']}>
                  <ul>
                    <li>{translate({ id: 'index.plan3.1' })}</li>
                    <li className={styles['hide']}>place holder</li>
                  </ul>
                  <p>{translate({ id: 'index.plan3.time' })}</p>
                </div>
              </div>
              <div className={clsx(styles['plan'], styles['plan4'])}>
                <h3>05</h3>
                <div className={styles['glass']}>
                  <ul>
                    <li>{translate({ id: 'index.plan4.1' })}</li>
                    <li>{translate({ id: 'index.plan4.2' })}</li>
                    <li>{translate({ id: 'index.plan4.3' })}</li>
                  </ul>
                  <p>{translate({ id: 'index.plan4.time' })}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className={styles['section-wrapper']}>
          <section className={styles['comment-section']}>
            {isZh ? (
              <>
                <div className={clsx(styles['zh-card'], styles[`zh-card1`])}>
                  <a
                    style={{ height: '50%' }}
                    target='_blank'
                    href='https://www.jazzyear.com/article_info.html?id=1275'
                  ></a>
                  <a
                    style={{ height: '50%' }}
                    target='_blank'
                    href='https://mp.weixin.qq.com/s/yGUY7yz2LjRSi_jauiE21Q'
                  ></a>
                </div>
                <div className={clsx(styles['zh-card'], styles[`zh-card2`])}>
                  <a
                    style={{ height: '50%' }}
                    target='_blank'
                    href='https://www.htcz.com/content/2024-09/19/content_31222534.htm'
                  ></a>
                  <a
                    style={{ height: '50%' }}
                    target='_blank'
                    href='https://www.infoq.cn/article/1X5jJEzrsIa5M1HR3RRz'
                  ></a>
                </div>
                <div className={clsx(styles['zh-card'], styles[`zh-card3`])}>
                  <a
                    href='https://blog.vigoo.dev/posts/moonbit-with-golem/'
                    target='_blank'
                  ></a>
                </div>
                <div
                  className={clsx(styles['zh-card'], styles[`zh-card4`])}
                ></div>
                <div
                  className={clsx(styles['zh-card'], styles[`zh-card5`])}
                ></div>
                <div
                  className={clsx(styles['zh-card'], styles[`zh-card6`])}
                ></div>
              </>
            ) : (
              <>
                {footers.map(({ title, description, link }, i) => (
                  <div
                    key={i}
                    className={clsx(styles['card'], styles[`card${i + 1}`])}
                  >
                    <a href={link} target='_blank'></a>
                    <div className={styles['card__img']}>
                      <img src={`/img/index/card${i + 1}.jpg`} alt='' />
                    </div>
                    <div className={styles['card__footer']}>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </section>
        </div>

        <div className={styles['section-wrapper']}>
          <section className={styles['update-section']}>
            <h2>{translate({ id: 'index.update.title' })}</h2>
            <RecentBlogPosts nrPosts={nrRecentBlogPosts} />
            <div className={styles['update-section--more']}>
              <Link href='/blog'>More</Link> <HiChevronRight />
            </div>
          </section>
        </div>

        <div className={styles['section-wrapper']}>
          <section className={styles['try-section']}>
            <h2>{translate({ id: 'index.try-section.title' })}</h2>
            <Link className={styles['colorful-button']} href='/download'>
              {translate({ id: 'index.try-section.button' })}
            </Link>
          </section>
        </div>
      </main>
    </Layout>
  )
}

const footers: { title: string; description: string; link: string }[] = [
  {
    title: 'MoonBit for Developers',
    description:
      'John A De Goes, CEO @ZivergeTech, CEO @GolemCloud, OSS contributor @zioscala',
    link: 'https://x.com/jdegoes/status/1870103854743794097'
  },
  {
    title: 'MoonBit for Developers',
    description:
      'Dmitrii Kovanikov, Functional Programming account #1. Senior SWE at Bloomberg.',
    link: 'https://x.com/ChShersh/status/1869837541853315439'
  },

  {
    title: 'Community Voice',
    description: 'From MoonBit Discord',
    link: 'https://discord.gg/TGEQPjhcDe'
  },
  {
    title: 'Build A Simple Collaborative List Editor',
    description: 'Golem Cloud with MoonBit, by Daniel Vigovszky',
    link: 'https://blog.vigoo.dev/posts/moonbit-with-golem/'
  },
  {
    title: 'MoonBit: Wasm-Optimized Language Creates Less Code Than Rust',
    description: 'The New Stack',
    link: 'https://thenewstack.io/moonbit-wasm-optimized-language-creates-less-code-than-rust/'
  },
  {
    title: 'MoonBit: Ideal for WebAssembly',
    description: 'mizchi, Frontend Developer',
    link: 'https://zenn.dev/mizchi/articles/introduce-moonbit'
  }
]
