#!/usr/bin/env node
// Generates src/pages/rabbita-home/main/recent_blogs.mbt from the blog/ directory.
// Reads frontmatter directly — no Docusaurus cache required.
// Usage: node scripts/gen-recent-blogs.mjs [count=4]

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const count = parseInt(process.argv[2] ?? '4', 10)

const blogDir = join(root, 'blog')
const outPath = join(root, 'src/pages/rabbita-home/main/recent_blogs.mbt')

// Each blog post lives in a YYYY-MM-DD-slug/ directory with an index.md
const dirs = readdirSync(blogDir, { withFileTypes: true })
  .filter(e => e.isDirectory() && /^\d{4}-\d{2}-\d{2}-/.test(e.name))
  .sort((a, b) => b.name.localeCompare(a.name))
  .slice(0, count)

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
  return (s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

const items = dirs.map(({ name }) => {
  const date = name.slice(0, 10)
  const src = readFileSync(join(blogDir, name, 'index.md'), 'utf8')
  const fm = parseFrontmatter(src)
  const slug = fm.slug ?? name.slice(11)
  const title = escape(fm.title ?? parseTitle(src))
  const url = `https://www.moonbitlang.com/blog/${slug}`
  const img = escape(fm.image ?? '')
  return `  {\n    title: "${title}",\n    date: "${date}",\n    url: "${url}",\n    img: "${img}",\n  },`
}).join('\n')

const content = `// Auto-generated, do not edit by hand.

///| Run: node scripts/gen-recent-blogs.mjs
let news_items : Array[NewsItem] = [
${items}
]
`

writeFileSync(outPath, content, 'utf8')
console.log(`[gen-recent-blogs] written ${dirs.length} posts to ${outPath}`)
