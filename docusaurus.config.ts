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

import { Config } from '@docusaurus/types'
import { Options as BlogOptions } from '@docusaurus/plugin-content-blog'
import math from 'remark-math'
import katex from 'rehype-katex'
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import rehypeShiki, { RehypeShikiOptions } from '@shikijs/rehype'
import { bundledLanguages, type BundledLanguage } from 'shiki'
import moonbit from './plugins/rehype-moonbit-markdown/packages/moonbit-tmlanguage/moonbit.tmLanguage.json'
import rehypeMoonbitMarkdown from './plugins/rehype-moonbit-markdown/packages/rehype-moonbit-markdown'
import type * as Preset from '@docusaurus/preset-classic'

async function readExamples() {
  const items = await fs.readdir(path.join(process.cwd(), 'examples'))
  const res = []
  for (const item of items.sort()) {
    const content = await fs.readFile(
      path.join(process.cwd(), 'examples', item),
      'utf-8'
    )
    const title = item.slice(1).replace('-', ' ').replace('.mbt', '')
    res.push({ title, code: content })
  }
  return res
}

const rehypeShikiPlugin = [
  rehypeShiki,
  {
    themes: {
      light: 'one-light',
      dark: 'one-dark-pro'
    },
    langs: [moonbit, ...Object.keys(bundledLanguages)] as BundledLanguage[],
    langAlias: {
      mbt: 'moonbit'
    }
  } satisfies RehypeShikiOptions
] as const

export default async (): Promise<Config> => {
  const isZh = process.env.DOCUSAURUS_CURRENT_LOCALE === 'zh'
  const data = await fs
    .readFile(path.join(process.cwd(), 'data', 'data.json'), 'utf-8')
    .then(JSON.parse)

  return {
    title: 'MoonBit',
    tagline:
      'MoonBit: the fast, compact & user friendly language for WebAssembly',
    favicon: 'img/favicon.ico',

    url: isZh ? 'https://www.moonbitlang.cn/' : 'https://www.moonbitlang.com/',
    baseUrl: '/',

    organizationName: 'moonbit',
    projectName: 'Homepage',

    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',

    i18n: {
      defaultLocale: 'en',
      locales: ['en', 'zh']
    },

    markdown: {
      mermaid: true
    },

    themes: ['@docusaurus/theme-mermaid'],

    presets: [
      [
        'classic',
        {
          docs: false,
          blog: false,
          theme: {
            customCss: './src/css/custom.css'
          }
        } satisfies Preset.Options
      ]
    ],

    plugins: [
      [
        './plugins/blog-plugin',
        {
          onUntruncatedBlogPosts: 'ignore',
          showReadingTime: true,
          remarkPlugins: [math],
          rehypePlugins: [katex, rehypeShikiPlugin],
          blogTitle: 'The MoonBit Blog',
          postsPerPage: 'ALL',
          blogDescription: 'The big news and updates from the MoonBit team'
        } satisfies BlogOptions
      ],
      [
        '@docusaurus/plugin-content-blog',
        {
          id: 'weekly-updates',
          path: 'weekly',
          blogDescription: 'Updates from the MoonBit team',
          routeBasePath: 'weekly-updates',
          blogSidebarCount: 'ALL',
          blogSidebarTitle: 'All posts',
          onUntruncatedBlogPosts: 'ignore',
          rehypePlugins: [rehypeShikiPlugin]
        } satisfies BlogOptions
      ],
      [
        '@docusaurus/plugin-content-blog',
        {
          id: 'pearls',
          path: 'pearls',
          blogDescription: 'MoonBit Pearls',
          routeBasePath: 'pearls',
          blogSidebarCount: 'ALL',
          blogSidebarTitle: 'All posts',
          onUntruncatedBlogPosts: 'ignore',
          remarkPlugins: [math],
          rehypePlugins: [katex, rehypeMoonbitMarkdown]
        } satisfies BlogOptions
      ]
    ],

    themeConfig: {
      announcementBar: {
        content: isZh
          ? `🎉️ <b><a href="/2025-mgpic">2025全球编程挑战赛火热来袭，立即参赛赢取丰厚奖金</a></b> 🥳️`
          : `🎉️ <b><a href="/blog/beta-release">MoonBit hits Beta — fast, stable, and async-ready.</a></b> 🥳️`,
        isCloseable: false
      },
      navbar: {
        title: 'MoonBit',
        hideOnScroll: true,
        logo: {
          alt: 'MoonBit Logo',
          src: 'img/logo.png'
        },
        items: [
          {
            to: 'https://docs.moonbitlang.com',
            label: 'Docs',
            position: 'left',
            locale: ['en']
          },
          {
            to: 'https://docs.moonbitlang.cn',
            label: '文档',
            position: 'left',
            locale: ['zh']
          },
          {
            to: '/blog/',
            label: 'Blog',
            position: 'left',
            locale: ['en', 'zh']
          },
          {
            to: '/download/',
            label: 'Download',
            position: 'left',
            locale: ['en', 'zh']
          },
          {
            to: 'https://try.moonbitlang.com/',
            label: 'Web IDE',
            position: 'left',
            locale: ['en']
          },
          {
            type: 'dropdown',
            label: 'Resource',
            position: 'left',
            items: [
              {
                to: '/gallery/',
                label: 'Gallery'
              },
              {
                to: '/weekly-updates/',
                label: 'Updates'
              },
              {
                to: '/pearls/',
                label: 'Pearls'
              },
              {
                href: 'https://moonbitlang.github.io/moonbit-textbook/',
                label: 'Course'
              },
              {
                href: 'https://tour.moonbitlang.com',
                label: 'Tour'
              },
              {
                href: 'https://oj.moonbitlang.com',
                label: 'Online Judge'
              }
            ],
            locale: ['en']
          },
          {
            to: 'https://docs.moonbitlang.com/zh-cn/latest/pilot/moonbit-pilot/getting-started.html',
            label: 'AI原生',
            position: 'left',
            locale: ['zh']
          },
          {
            type: 'dropdown',
            label: 'Resource',
            position: 'left',
            items: [
              {
                to: '/weekly-updates/',
                label: 'Weekly Updates'
              },
              {
                to: '/pearls/',
                label: '黑板报'
              },
              {
                to: '/course/',
                label: 'Course'
              },
              {
                to: '/gallery/',
                label: 'Gallery'
              },
              {
                href: 'https://try.moonbitlang.cn/',
                label: '试用'
              },
              {
                href: 'https://tour.moonbitlang.com',
                label: '导览'
              },
              {
                href: 'https://oj.moonbitlang.com',
                label: '在线评测'
              }
            ],
            locale: ['zh']
          },
          {
            type: 'dropdown',
            label: 'Community',
            position: 'left',
            items: [
              {
                href: '/contributor/',
                label: 'Contributor'
              },
              {
                href: 'https://mooncakes.io',
                label: 'Package Manager'
              }
            ],
            locale: ['en']
          },
          {
            type: 'dropdown',
            label: '社区',
            position: 'left',
            locale: ['zh'],
            items: [
              {
                href: 'https://mooncakes.io',
                label: '包管理'
              },
              {
                href: '/contributor/',
                label: '贡献者'
              },
              {
                href: '/events/',
                label: '活动'
              },
              {
                href: '/2024-mgpic',
                label: '2024 MoonBit 编程挑战赛'
              },
              {
                href: '/2025-mgpic',
                label: '2025 MoonBit 编程挑战赛'
              }
            ]
          },
          {
            type: 'localeDropdown',
            position: 'right',
            locale: ['en', 'zh']
          },
          {
            type: 'custom-DiscordButton',
            position: 'right',
            locale: ['en']
          },
          {
            type: 'custom-GithubButton',
            position: 'right',
            locale: ['en', 'zh']
          }
        ]
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Resources',
            items: [
              {
                label: 'Docs',
                href: 'https://docs.moonbitlang.com',
                locale: ['en']
              },
              {
                label: 'Blog',
                to: '/blog/',
                locale: ['en']
              },
              {
                label: 'Updates',
                to: '/weekly-updates/',
                locale: ['en']
              },
              {
                label: 'Courses',
                href: 'https://moonbitlang.github.io/moonbit-textbook/',
                locale: ['en']
              },
              {
                label: 'Gallery',
                to: '/gallery/',
                locale: ['en']
              },
              {
                label: 'Tour',
                href: 'https://tour.moonbitlang.com',
                locale: ['en']
              },
              {
                label: 'Online Judge',
                href: 'https://oj.moonbitlang.com',
                locale: ['en']
              },
              {
                label: '文档',
                href: 'https://docs.moonbitlang.cn',
                locale: ['zh']
              },
              {
                label: '博客',
                to: '/blog/',
                locale: ['zh']
              },
              {
                label: '动态',
                to: '/weekly-updates/',
                locale: ['zh']
              },
              {
                label: '课程',
                to: '/course/',
                locale: ['zh']
              },
              {
                label: '样例',
                to: '/gallery/',
                locale: ['zh']
              },
              {
                label: '导览',
                href: 'https://tour.moonbitlang.com',
                locale: ['zh']
              },
              {
                label: '在线评测',
                href: 'https://oj.moonbitlang.com',
                locale: ['zh']
              }
            ]
          },
          {
            title: 'Toolchain',
            items: [
              {
                label: 'Cloud IDE',
                href: 'https://try.moonbitlang.com',
                locale: ['en']
              },
              {
                label: 'Build System',
                href: 'https://moonbitlang.github.io/moon/',
                locale: ['en']
              },
              {
                label: 'Package Manager',
                href: 'https://mooncakes.io/',
                locale: ['en']
              },
              {
                label: '云IDE',
                href: 'https://try.moonbitlang.cn',
                locale: ['zh']
              },
              {
                label: '构建系统',
                href: 'https://moonbitlang.github.io/moon/zh',
                locale: ['zh']
              },
              {
                label: '包管理',
                href: 'https://mooncakes.io/',
                locale: ['zh']
              }
            ]
          },
          {
            title: 'Support',
            items: [
              {
                label: 'Contact Us',
                to: 'mailto:support@moonbitlang.com',
                locale: ['en']
              },
              {
                label: 'About Us',
                to: '/about-us',
                locale: ['en']
              },
              {
                label: '联系我们',
                to: 'mailto:support@moonbitlang.com',
                locale: ['zh']
              },
              {
                label: '关于我们',
                to: '/about-us',
                locale: ['zh']
              }
            ]
          }
        ],
        copyright: `Copyright © ${new Date().getFullYear()} MoonBit`
      }
    },

    stylesheets: [
      {
        href: isZh
          ? 'https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/KaTeX/0.13.24/katex.min.css'
          : 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
        type: 'text/css',
        integrity:
          'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
        crossorigin: 'anonymous'
      },
      '/fira-code.css'
    ],
    customFields: {
      MOONCAKES_API_HOST: process.env.MOONCAKES_API_HOST,
      MOONCAKES_API:
        process.env.NODE_ENV === 'development'
          ? process.env.DEV_MOONCAKES_API
          : process.env.PROD_MOONCAKES_API,
      GITHUB_OAUTH_CLIENT_ID:
        process.env.NODE_ENV === 'development'
          ? process.env.DEV_GITHUB_OAUTH_CLIENT_ID
          : process.env.PROD_GITHUB_OAUTH_CLIENT_ID,
      HOST:
        process.env.NODE_ENV === 'development'
          ? process.env.DEV_HOST
          : process.env.PROD_HOST,
      recentBlogPostsOnHomePage: 3,
      homePageCodeExamples: await readExamples(),
      ...data
    }
  }
}
