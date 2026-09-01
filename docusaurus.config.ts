/*
 * Copyright 2026 International Digital Economy Academy
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
import { Options as RedirectOptions } from '@docusaurus/plugin-client-redirects'
import math from 'remark-math'
import katex from 'rehype-katex'
import 'dotenv/config'
import fs from 'node:fs/promises'
import {
  readFileSync,
  readdirSync,
  existsSync,
  copyFileSync,
  mkdirSync,
  writeFileSync
} from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import rehypeShiki, { RehypeShikiOptions } from '@shikijs/rehype'
import * as shiki from 'shiki'
import { bundledLanguages, type BundledLanguage } from 'shiki'
import moonbit from './plugins/rehype-moonbit-markdown/packages/moonbit-tmlanguage/moonbit.tmLanguage.json'
import type * as Preset from '@docusaurus/preset-classic'

let highlighter: shiki.Highlighter | undefined

async function shikiHighlighter(): Promise<shiki.Highlighter> {
  if (highlighter) return highlighter
  highlighter = await shiki.createHighlighter({
    themes: ['one-dark-pro'],
    langs: Object.keys(bundledLanguages).concat(moonbit as any),
    langAlias: {
      mbt: 'moonbit'
    }
  })
  return highlighter
}

async function readExamples() {
  const items = await fs.readdir(path.join(process.cwd(), 'examples'))
  const highlighter = await shikiHighlighter()
  const res = []
  for (const item of items.sort()) {
    const content = await fs.readFile(
      path.join(process.cwd(), 'examples', item),
      'utf-8'
    )
    const title = item.slice(1).replace('-', ' ').replace('.mbt', '')
    const html = highlighter.codeToHtml(content, {
      lang: 'moonbit',
      theme: 'one-dark-pro'
    })
    res.push({ title, code: content, html })
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
          pages: {
            exclude: ['**/rabbita-home/**']
          },
          theme: {
            customCss: './src/css/custom.css'
          }
        } satisfies Preset.Options
      ]
    ],

    plugins: [
      // In dev mode, watch .mbt source files and run moon build on each change,
      // then copy output to static/rabbita-home/ for Docusaurus to serve.
      // A polling script detects the updated main.js (via ETag/Last-Modified)
      // and triggers a browser reload.
      function rabbitaHomePlugin() {
        const rabbitaHomeDir = path.join(
          process.cwd(),
          'src',
          'pages',
          'rabbita-home'
        )
        const staticDir = path.join(process.cwd(), 'static', 'rabbita-home')
        const stylesSrc = path.join(rabbitaHomeDir, 'styles.css')

        function collectWatchFiles(
          dir: string,
          files: string[] = []
        ): string[] {
          const skip = new Set(['node_modules', '_build', 'target', '.git'])
          for (const entry of readdirSync(dir, { withFileTypes: true })) {
            if (skip.has(entry.name)) continue
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              collectWatchFiles(full, files)
            } else if (
              entry.name.endsWith('.mbt') ||
              entry.name.endsWith('.mbti') ||
              entry.name === 'moon.pkg' ||
              entry.name === 'moon.pkg.json' ||
              entry.name === 'moon.mod.json'
            ) {
              files.push(full)
            }
          }
          return files
        }

        function findFirstJs(dir: string): string | null {
          for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              const found = findFirstJs(full)
              if (found) return found
            } else if (entry.name.endsWith('.js')) {
              return full
            }
          }
          return null
        }

        function buildAndCopy(): void {
          const result = spawnSync(
            'moon',
            ['build', '--target', 'js', '--debug'],
            {
              cwd: rabbitaHomeDir,
              stdio: 'inherit'
            }
          )
          if (result.status !== 0) return
          const buildDir = path.join(
            rabbitaHomeDir,
            '_build',
            'js',
            'debug',
            'build'
          )
          if (!existsSync(buildDir)) return
          const jsFile = findFirstJs(buildDir)
          if (!jsFile) return
          if (!existsSync(staticDir)) mkdirSync(staticDir, { recursive: true })
          const code = readFileSync(jsFile, 'utf8')
            .replace(/\n?\/\/[#@]\s*sourceMappingURL=.*$/m, '')
            .replace(/\n?\/\*#\s*sourceMappingURL=.*?\*\//m, '')
          writeFileSync(path.join(staticDir, 'main.js'), code)
          if (existsSync(stylesSrc)) {
            copyFileSync(stylesSrc, path.join(staticDir, 'styles.css'))
          }
        }

        return {
          name: 'rabbita-home',
          getPathsToWatch() {
            const files = collectWatchFiles(rabbitaHomeDir)
            if (existsSync(stylesSrc)) files.push(stylesSrc)
            return files
          },
          async loadContent() {
            if (process.env.NODE_ENV === 'development') {
              buildAndCopy()
            }
            return null
          },
          injectHtmlTags() {
            if (process.env.NODE_ENV !== 'development') return {}
            return {
              headTags: [
                {
                  tagName: 'script',
                  innerHTML: `
                    (function () {
                      var known = null;
                      setInterval(async function () {
                        if (!document.getElementById('rabbita-home')) return;
                        try {
                          var r = await fetch('/rabbita-home/main.js', { method: 'HEAD', cache: 'no-store' });
                          if (!r.ok) return;
                          var tag = r.headers.get('etag') || r.headers.get('last-modified');
                          if (known === null) { known = tag; return; }
                          if (tag !== known) { known = tag; location.reload(); }
                        } catch (e) {}
                      }, 500);
                    })();
                  `
                }
              ]
            }
          }
        }
      },
      // In dev mode, watch showcase .mbt source files and run moon build on
      // each change, then copy output to static/rabbita-2026-scc-showcase/
      // for Docusaurus to serve.
      function rabbitaShowcasePlugin() {
        const showcaseDir = path.join(
          process.cwd(),
          'src',
          'rabbita',
          '2026-scc-showcase'
        )
        const staticDir = path.join(
          process.cwd(),
          'static',
          'rabbita-2026-scc-showcase'
        )
        const stylesSrc = path.join(showcaseDir, 'styles.css')

        function collectWatchFiles(
          dir: string,
          files: string[] = []
        ): string[] {
          const skip = new Set(['node_modules', '_build', 'target', '.git'])
          for (const entry of readdirSync(dir, { withFileTypes: true })) {
            if (skip.has(entry.name)) continue
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              collectWatchFiles(full, files)
            } else if (
              entry.name.endsWith('.mbt') ||
              entry.name.endsWith('.mbti') ||
              entry.name === 'moon.pkg' ||
              entry.name === 'moon.pkg.json' ||
              entry.name === 'moon.mod.json'
            ) {
              files.push(full)
            }
          }
          return files
        }

        function findFirstJs(dir: string): string | null {
          for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              const found = findFirstJs(full)
              if (found) return found
            } else if (entry.name.endsWith('.js')) {
              return full
            }
          }
          return null
        }

        function buildAndCopy(): void {
          const result = spawnSync(
            'moon',
            ['build', '--target', 'js', '--debug'],
            {
              cwd: showcaseDir,
              stdio: 'inherit'
            }
          )
          if (result.status !== 0) return
          const buildDir = path.join(
            showcaseDir,
            '_build',
            'js',
            'debug',
            'build'
          )
          if (!existsSync(buildDir)) return
          const jsFile = findFirstJs(buildDir)
          if (!jsFile) return
          if (!existsSync(staticDir)) mkdirSync(staticDir, { recursive: true })
          const code = readFileSync(jsFile, 'utf8')
            .replace(/\n?\/\/[#@]\s*sourceMappingURL=.*$/m, '')
            .replace(/\n?\/\*#\s*sourceMappingURL=.*?\*\//m, '')
          writeFileSync(path.join(staticDir, 'main.js'), code)
          if (existsSync(stylesSrc)) {
            copyFileSync(stylesSrc, path.join(staticDir, 'styles.css'))
          }
        }

        return {
          name: 'rabbita-showcase',
          getPathsToWatch() {
            const files = collectWatchFiles(showcaseDir)
            if (existsSync(stylesSrc)) files.push(stylesSrc)
            return files
          },
          async loadContent() {
            if (process.env.NODE_ENV === 'development') {
              buildAndCopy()
            }
            return null
          },
          injectHtmlTags() {
            if (process.env.NODE_ENV !== 'development') return {}
            return {
              headTags: [
                {
                  tagName: 'script',
                  innerHTML: `
                    (function () {
                      var known = null;
                      setInterval(async function () {
                        if (!document.getElementById('rabbita-scc-showcase')) return;
                        try {
                          var r = await fetch('/rabbita-2026-scc-showcase/main.js', { method: 'HEAD', cache: 'no-store' });
                          if (!r.ok) return;
                          var tag = r.headers.get('etag') || r.headers.get('last-modified');
                          if (known === null) { known = tag; return; }
                          if (tag !== known) { known = tag; location.reload(); }
                        } catch (e) {}
                      }, 500);
                    })();
                  `
                }
              ]
            }
          }
        }
      },
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
          id: 'updates',
          path: 'updates',
          blogDescription: 'Updates from the MoonBit team',
          routeBasePath: 'updates',
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
          rehypePlugins: [katex, rehypeShikiPlugin]
        } satisfies BlogOptions
      ],
      [
        '@docusaurus/plugin-client-redirects',
        {
          createRedirects(existingPath) {
            if (
              existingPath === '/updates' ||
              existingPath.startsWith('/updates/')
            ) {
              return existingPath.replace('/updates', '/weekly-updates')
            }
            return undefined
          }
        } satisfies RedirectOptions
      ]
    ],

    themeConfig: {
      announcementBar: isZh
        ? {
            content: `🚀 <b><a href="https://aka.moonbitlang.com/osc-2026">2026 MoonBit国产基础软件开源大赛</a></b> 火热报名中！总奖金池 15 万元 🎉`,
            isCloseable: false
          }
        : {
            content: `🚀 <b><a href="/2026-scc">2026 MoonBit Software Synthesis Challenge</a></b> is now open! Up to $600 per participant 🎉`,
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
                to: '/updates/',
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
            type: 'dropdown',
            label: 'Resource',
            position: 'left',
            items: [
              {
                to: '/updates/',
                label: 'Updates'
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
              },
              {
                href: '/2025-mgpic',
                label: '2025 MGPIC'
              },
              {
                href: '/2026-scc',
                label: '2026 Software Synthesis Challenge'
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
              },
              {
                href: '/2026-scc',
                label: '2026 MoonBit 软件合成挑战赛'
              },
              {
                href: 'https://aka.moonbitlang.com/osc-2026',
                label: '2026 MoonBit 国产基础软件开源大赛'
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
                to: '/updates/',
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
                to: '/updates/',
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
      isZh
        ? {
            href: '/katex/katex.min.css',
            type: 'text/css'
          }
        : {
            href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
            type: 'text/css',
            integrity:
              'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV',
            crossorigin: 'anonymous'
          },
      '/fira-code.css',
      '/rabbita-home/styles.css'
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
