import { defineConfig } from 'vite'
import rabbita from '@rabbita/vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import path from 'path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

function findMbtFiles(dir, files = []) {
  const skip = new Set(['node_modules', '_build', 'target', '.git'])
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      findMbtFiles(full, files)
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

function findJsFiles(dir) {
  const files = []
  const worklist = [dir]
  while (worklist.length > 0) {
    const cur = worklist.pop()
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, entry.name)
      if (entry.isDirectory()) worklist.push(full)
      else if (entry.name.endsWith('.js')) files.push(full)
    }
  }
  return files
}

// In `vite build --watch` mode, Rollup only watches files in the JS module
// graph, so changes to .mbt files never trigger a rebuild. This plugin adds
// all MoonBit source files to Rollup's watch list so that editing any .mbt
// file causes a full rebuild (which re-runs `moon build` via @rabbita/vite).
const mbtWatchPlugin = {
  name: 'mbt-watch',
  buildStart() {
    for (const file of findMbtFiles(process.cwd())) {
      this.addWatchFile(file)
    }
  },
}

// In `vite` (dev server) mode, @rabbita/vite handles .mbt watching and runs
// moon build on each change, but the output lives in _build/ and is served
// in-memory — Docusaurus can't see it. This plugin copies the moon build
// output to static/rabbita-home/ after each rebuild so Docusaurus serves the
// latest JS, and its ETag/Last-Modified change triggers the browser reload.
function makeDevSyncPlugin() {
  const staticDir = resolve(__dirname, '../../static/rabbita-home')
  const mainJsDest = resolve(staticDir, 'main.js')
  const stylesDest = resolve(staticDir, 'styles.css')
  const stylesSrc = resolve(__dirname, 'styles.css')

  function syncMain(jsPath) {
    try {
      const code = fs.readFileSync(jsPath, 'utf8')
        .replace(/\n?\/\/[#@]\s*sourceMappingURL=.*$/m, '')
        .replace(/\n?\/\*#\s*sourceMappingURL=.*?\*\//m, '')
      fs.writeFileSync(mainJsDest, code)
    } catch {}
  }

  function syncStyles() {
    try { fs.copyFileSync(stylesSrc, stylesDest) } catch {}
  }

  function syncInitial() {
    syncStyles()
    for (const mode of ['debug', 'release']) {
      const buildDir = resolve(process.cwd(), '_build', 'js', mode, 'build')
      if (!fs.existsSync(buildDir)) continue
      const files = findJsFiles(buildDir)
      if (files.length > 0) { syncMain(files[0]); return }
    }
  }

  return {
    name: 'dev-sync',
    configureServer(server) {
      // Write once the server is up (moon build has already run in buildStart)
      server.httpServer?.once('listening', syncInitial)

      // Watch the moon build output directory for subsequent rebuilds
      const buildJsRoot = resolve(process.cwd(), '_build', 'js')
      if (fs.existsSync(buildJsRoot)) {
        server.watcher.add(buildJsRoot)
      }

      // Watch styles.css for direct edits
      server.watcher.add(stylesSrc)

      server.watcher.on('change', (filePath) => {
        const sep = path.sep
        if (filePath.includes(`${sep}_build${sep}js`) && filePath.endsWith('.js')) {
          syncMain(filePath)
        } else if (filePath === stylesSrc) {
          syncStyles()
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    rabbita(),
    ...(mode === 'watch'
      ? [mbtWatchPlugin]
      : mode === 'development'
        ? [makeDevSyncPlugin()]
        : []),
  ],
  build: mode === 'watch'
    ? {
        outDir: resolve(__dirname, '../../static/rabbita-home'),
        emptyOutDir: false,
        rollupOptions: {
          output: {
            entryFileNames: 'main.js',
            assetFileNames: ({ name }) =>
              name?.endsWith('.css') ? 'styles.css' : (name ?? '[name][extname]'),
          },
        },
      }
    : {
        rollupOptions: {
          output: {
            entryFileNames: 'main.js',
            assetFileNames: ({ name }) =>
              name?.endsWith('.css') ? 'styles.css' : (name ?? '[name][extname]'),
          },
        },
      },
}))
