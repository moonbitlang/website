import { spawnSync } from 'node:child_process'
import { cp, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const websiteDir = process.cwd()
const templateDir = path.resolve(websiteDir, 'src/pages/rabbita-home')

// Regenerate recent_blogs.mbt from blog/ directory before building
spawnSync(process.execPath, ['scripts/gen-recent-blogs.mjs'], {
  cwd: websiteDir,
  stdio: 'inherit',
})
const templateDistDir = path.resolve(templateDir, 'dist')
const targetDir = path.resolve(websiteDir, 'static/rabbita-home')
const install = spawnSync('pnpm', ['install'], {
  cwd: templateDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
if (install.status !== 0) {
  process.exit(install.status ?? 1)
}

const build = spawnSync(
  'pnpm',
  ['run', 'build', '--', '--base', '/rabbita-home/'],
  {
    cwd: templateDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
)

if (build.status !== 0) {
  process.exit(build.status ?? 1)
}

await stat(templateDistDir)
await rm(targetDir, { recursive: true, force: true })
await cp(templateDistDir, targetDir, { recursive: true })

console.log(`[rabbita-home] synced ${templateDistDir} -> ${targetDir}`)
