#!/usr/bin/env node
// Generates src/pages/rabbita-home/main/recent_blogs.mbt from the blog/ directory.
// Reads frontmatter directly — no Docusaurus cache required.
// Also reads zh translations from i18n/zh/docusaurus-plugin-content-blog/.
// Usage: node scripts/gen-recent-blogs.mjs [count=4]

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const count = parseInt(process.argv[2] ?? '4', 10)

const blogDir = join(root, 'blog')
const zhBlogDir = join(root, 'i18n/zh/docusaurus-plugin-content-blog')
const outPath = join(root, 'src/pages/rabbita-home/main/recent_blogs.mbt')

function parseFrontmatter(src) {
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const fm = {}
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (m) fm[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return fm
}

function parseTitle(src) {
  const m = src.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : ''
}

function escape(s) {
  return (s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/`/g, '')
}

function collectPosts(dir, domain) {
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory() && /^\d{4}-\d{2}-\d{2}-/.test(e.name))
    .sort((a, b) => b.name.localeCompare(a.name))
    .reduce((acc, { name }) => {
      const indexPath = join(dir, name, 'index.md')
      if (!existsSync(indexPath)) return acc
      const src = readFileSync(indexPath, 'utf8')
      const fm = parseFrontmatter(src)
      if (fm.unlisted === 'true') return acc
      const date = name.slice(0, 10)
      const slug = fm.slug ?? name.slice(11)
      acc.push({
        title: escape(fm.title ?? parseTitle(src)),
        date,
        url: `https://www.moonbitlang.${domain}/blog/${slug}`,
        img: escape(fm.image ?? ''),
      })
      return acc
    }, [])
    .slice(0, count)
}

function formatItem(item) {
  return `    {\n      title: "${item.title}",\n      date: "${item.date}",\n      url: "${item.url}",\n      img: "${item.img}",\n    },`
}

const enItems = collectPosts(blogDir, 'com')
const zhItems = collectPosts(zhBlogDir, 'cn')

const enBlock = enItems.map(formatItem).join('\n')
const zhBlock = zhItems.map(formatItem).join('\n')

const content = `// Auto-generated, do not edit by hand.

///| Run: node scripts/gen-recent-blogs.mjs
fn get_news_items() -> Array[NewsItem] {
  lang(
    en=[
${enBlock}
    ],
    zh=[
${zhBlock}
    ],
  )
}
`

writeFileSync(outPath, content, 'utf8')
console.log(`[gen-recent-blogs] written en=${enItems.length} zh=${zhItems.length} posts to ${outPath}`)
