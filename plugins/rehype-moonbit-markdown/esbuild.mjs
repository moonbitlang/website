import * as esbuild from 'esbuild'

const dev = process.env.DEV === 'true'

const ctx = await esbuild.context({
  entryPoints: ['src/index.ts'],
  platform: 'node',
  loader: {
    '.css': 'text',
    '.html': 'text'
  },
  outdir: 'dist',
  minify: !dev,
  bundle: true,
  sourcemap: true,
  logLevel: 'info'
})

if (process.argv.includes('--watch')) {
  await ctx.watch()
} else {
  await ctx.rebuild()
  process.exit(0)
}
