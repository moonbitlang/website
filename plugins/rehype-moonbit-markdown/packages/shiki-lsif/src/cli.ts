import * as commander from 'commander'
import * as lsifHighlighter from './index.js'
import * as path from 'path'
import * as fs from 'fs'

function html(title: string, head: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${head}
</head>
<body>
  ${body}
</body>
</html>`
}

function writeTo(filePath: string, content: string) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, content)
}

type Option = {
  input: string
  output: string
}

async function main() {
  const program = new commander.Command()
  program
    .name('shiki-lsif')
    .description('Semantic highlighter with Shiki and LSIF')
    .option('-i, --input <string>', 'Input lsif file path')
    .option('-o, --output <string>', 'output path')

  program.parse()
  const options = program.opts<Option>()
  const highlighter = await lsifHighlighter.LsifHighlighter.init(options.input)
  for (const { relativePath, code, style } of highlighter.highlightAll()) {
    const title = relativePath
    const head = `
<link rel="stylesheet" href="/markdown.css">
<link rel="stylesheet" href="/lsif.css">
<style>
${style}
</style>
`
    const body = code
    writeTo(
      path.join(options.output, relativePath + '.html'),
      html(title, head, body)
    )
  }
}

main()
