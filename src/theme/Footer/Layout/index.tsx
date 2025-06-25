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
import styles from './styles.module.css'
import {
  FaGithub,
  FaXTwitter,
  FaDiscord,
  FaYoutube,
  FaBilibili,
  FaZhihu,
  FaWeibo,
  FaWeixin,
  FaBluesky,
  FaMastodon
} from 'react-icons/fa6'
import { SiXiaohongshu } from 'react-icons/si'
import type { Props } from '@theme/Footer/Layout'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'

export default function FooterLayout({
  style,
  links,
  copyright
}: Props): JSX.Element {
  const { i18n } = useDocusaurusContext()
  const isZh = i18n.currentLocale.startsWith('zh')
  return (
    <footer
      className={clsx('footer', {
        'footer--dark': style === 'dark'
      })}
    >
      <div className='container container-fluid'>
        <div className='row margin-bottom--lg' style={{ gap: '2rem' }}>
          <div className='col margin-bottom--lg'>
            <div className={clsx(styles['logo'], 'margin-bottom--sm')}>
              <div className={styles['logo__image']}>
                <img src='/icon/logo.svg' alt='' />
              </div>
              <div className={styles['logo__title']}>MoonBit</div>
            </div>
            <div className={clsx(styles['about-us'], 'margin-bottom--sm')}>
              {isZh ? (
                <>
                  粤港澳大湾区数字经济研究院（福田）（International Digital
                  Economy
                  Academy，简称IDEA研究院）致力于人工智能和数字经济领域的前沿研究与产业落地，是一家国际化创新型机构。MoonBit是编程语言以及开发者平台，专注于AI原生通用程序语言的设计、编译器、运行时、IDE以及构建系统的开发。
                  <br />
                  地址：中国深圳市福田区市花路5号长富金茂大厦1号楼20层
                  <br />
                  办公电话：<a href='tel:+8675561610106'>86-755-61610106</a>
                  （39F）
                </>
              ) : (
                <>
                  IDEA (International Digital Economy Academy) is an innovative
                  institution dedicated to cutting-edge research and industrial
                  implementation in the fields of artificial intelligence and
                  the digital economy. MoonBit focuses on the development of an
                  AI-native general-purpose programming language, including
                  language design, compiler, runtime, IDE, and build system.
                  <br />
                  Address: 20F, No. 5 Shihua Road, Futian District, Shenzhen,
                  Guangdong Province, China
                  <br />
                  Tel: <a href='tel:+8675561610106'>86-755-61610106</a>(39F)
                </>
              )}
            </div>
            <div className={styles['social-medias']}>
              {isZh ? (
                <>
                  <a href='https://www.github.com/moonbitlang'>
                    <FaGithub />
                  </a>
                  <a href='https://space.bilibili.com/1453436642'>
                    <FaBilibili />
                  </a>
                  <a href='https://weibo.com/u/7852652406'>
                    <FaWeibo />
                  </a>
                  <a href='https://www.zhihu.com/people/moonbit'>
                    <FaZhihu />
                  </a>
                  <a href='https://www.xiaohongshu.com/user/profile/636b072f000000001f01c84a'>
                    <SiXiaohongshu />
                  </a>
                  <div className={styles['weixin']}>
                    <div className={styles['weixin__qr-code']}>
                      <img src='/img/index/wx-qr-code.jpg' alt='' />
                    </div>
                    <FaWeixin />
                  </div>
                </>
              ) : (
                <>
                  <a href='https://www.github.com/moonbitlang'>
                    <FaGithub />
                  </a>
                  <a href='https://x.com/moonbitlang'>
                    <FaXTwitter />
                  </a>
                  <a href='https://discord.gg/CVFRavvRav'>
                    <FaDiscord />
                  </a>
                  <a href='http://www.youtube.com/@MoonBit_lang'>
                    <FaYoutube />
                  </a>
                  <a href='https://bsky.app/profile/moonbitlang.bsky.social'>
                    <FaBluesky />
                  </a>
                  <a href='https://mastodon.social/@moonbitlang'>
                    <FaMastodon />
                  </a>
                </>
              )}
            </div>
          </div>
          <div className='col'>{links}</div>
        </div>
        {copyright}
      </div>
    </footer>
  )
}
