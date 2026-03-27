import { spawnSync } from 'node:child_process'
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const websiteDir = process.cwd()
const showcaseDir = path.resolve(websiteDir, 'src/rabbita/2026-scc-showcase')
const targetDir = path.resolve(websiteDir, 'static/rabbita-2026-scc-showcase')
const stylesSrc = path.resolve(showcaseDir, 'styles.css')

function findFirstJs(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = findFirstJs(full)
      if (nested) return nested
    } else if (entry.name.endsWith('.js')) {
      return full
    }
  }
  return null
}

const build = spawnSync('moon', ['build', '--target', 'js', '--release'], {
  cwd: showcaseDir,
  stdio: 'inherit',
})

if (build.status !== 0) {
  process.exit(build.status ?? 1)
}

const buildDir = path.resolve(showcaseDir, '_build/js/release/build')
const jsFile = findFirstJs(buildDir)

if (!jsFile) {
  console.error('[rabbita-showcase] failed to locate compiled main.js output')
  process.exit(1)
}

const code = await stat(jsFile).then(() =>
  readFile(jsFile, 'utf8')
).then((text) =>
  text
    .replace(/\n?\/\/[#@]\s*sourceMappingURL=.*$/m, '')
    .replace(/\n?\/\*#\s*sourceMappingURL=.*?\*\//m, '')
)

await stat(stylesSrc)
await rm(targetDir, { recursive: true, force: true })
await mkdir(targetDir, { recursive: true })
await writeFile(path.join(targetDir, 'main.js'), code)
await cp(stylesSrc, path.join(targetDir, 'styles.css'))

console.log(`[rabbita-showcase] synced ${showcaseDir} -> ${targetDir}`)
