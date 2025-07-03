import * as fs from 'fs'
import * as cp from 'child_process'
import * as os from 'os'
import * as path from 'path'
import { beforeAll, expect, it } from 'vitest'

const cli = './dist/cli.js'

function out(fixturePath: string) {
  const moonHome = process.env['MOON_HOME']
    ? process.env['MOON_HOME']
    : path.join(os.homedir(), '.moon')
  const name = path.basename(fixturePath)
  const stdPath = path.join(moonHome, 'lib/core/target/wasm-gc/release/bundle')
  cp.execSync('moon check', { cwd: fixturePath })
  cp.execSync(
    `moondoc -packages-json ./target/packages.json -std-path ${stdPath} -lsif -o a.lsif`,
    {
      cwd: fixturePath
    }
  )
  cp.execSync(`node ${cli} -i ${fixturePath}/a.lsif -o ./test/out/${name}`)
}

function* files(folder: string): Generator<string> {
  for (const dirent of fs.readdirSync(folder, { withFileTypes: true })) {
    const fullPath = path.join(folder, dirent.name)
    if (dirent.isDirectory()) {
      yield* files(fullPath)
    } else if (dirent.isFile()) {
      yield fullPath
    }
  }
}

async function folderSnapshot(folder: string) {
  for (const file of files(folder)) {
    const relativePath = path.relative(folder, file)
    await expect(fs.readFileSync(file, 'utf8')).toMatchFileSnapshot(
      path.join('./snapshots', relativePath)
    )
  }
}

it('test', async () => {
  for (const fixture of fs.readdirSync('./test/fixtures')) {
    out(path.join('./test/fixtures', fixture))
  }
  await folderSnapshot('./test/out')
})
