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

import * as shiki from 'shiki'
import * as fs from 'node:fs'
import * as fsp from 'node:fs/promises'
import * as readline from 'node:readline'
import * as lsif from '@vscode/lsif-protocol'
import * as textdocument from 'vscode-languageserver-textdocument'
import * as hast from 'hast'
import * as unified from 'unified'
import * as vscodeuri from 'vscode-uri'
import * as path from 'node:path/posix'
import * as lsp from 'vscode-languageserver-protocol'
import defaultLsifStyle from './lsif.css'
import defaultMarkdownStyle from './markdown.css'
import moonbit from '../../../moonbit.tmLanguage.json'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeShikiFromHighlighter from '@shikijs/rehype/core'

function comparePosition(p1: lsp.Position, p2: lsp.Position): number {
  return p1.line - p2.line === 0
    ? p1.character - p2.character
    : p1.line - p2.line
}

function compareRange(r1: lsp.Range, r2: lsp.Range, uri?: lsif.Uri): number {
  const start = comparePosition(r1.start, r2.start)
  if (start !== 0) return start
  const end = comparePosition(r1.end, r2.end)
  if (end === 0 && uri) {
    // console.error("Warning: equal range", uri, r1, r2);
  }
  return end
}

function html(title: string, style: string, code: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${style}</style>
</head>
<body>
  ${code}
</body>
</html>`
}

interface Vertices {
  all: Map<lsif.Id, lsif.Vertex>
  documents: Map<lsif.Id, lsif.Document>
  ranges: Map<lsif.Id, lsif.Range>
}

interface Out {
  contains: Map<lsif.Id, lsif.Document[] | lsif.Range[]>
  hover: Map<lsif.Id, lsif.HoverResult>
}

interface In {
  contains: Map<lsif.Id, lsif.Document>
}

interface HoverResult {
  contents: string[]
  range: lsp.Range
}

interface NodeRange {
  range: lsp.Range
}

interface NodeStartLength {
  /** 0-indexed position of the node in the file */
  start: number
  /** The length of the node */
  length: number
}

interface HoverNode extends NodeRange, NodeStartLength {
  kind: 'hover'
  target: string
  contents: string[]
}

interface Document {
  id: lsif.Id
  textDocument: textdocument.TextDocument
}

type LsifHighlighterOption = {
  lineNumber: boolean
  lsifStyle: string
  markdownStyle: string
}

export class LsifHighlighter {
  private _source: lsif.Source | undefined
  private _project: lsif.Project | undefined
  private documents: Map<lsif.Uri, Document> = new Map()
  private vertices: Vertices = {
    all: new Map(),
    documents: new Map(),
    ranges: new Map()
  }
  private in: In = {
    contains: new Map()
  }
  private out: Out = {
    contains: new Map(),
    hover: new Map()
  }
  static shikiHighlighter: shiki.Highlighter | undefined
  private _unified: unified.Processor | undefined
  private option: LsifHighlighterOption
  private customCss: string = ''
  private hoverNodesCache: Map<lsif.Uri, HoverNode[]> = new Map()

  private get highlighter(): shiki.Highlighter {
    if (LsifHighlighter.shikiHighlighter === undefined) {
      throw new Error('Highlighter not initialized')
    }
    return LsifHighlighter.shikiHighlighter
  }

  private get unified(): unified.Processor {
    if (this._unified === undefined) {
      throw new Error('Unified not initialized')
    }
    return this._unified
  }

  private get source(): lsif.Source {
    if (this._source === undefined) {
      throw new Error('Source not initialized')
    }
    return this._source
  }

  constructor(option?: Partial<LsifHighlighterOption>) {
    this.option = {
      lineNumber: true,
      lsifStyle: defaultLsifStyle,
      markdownStyle: defaultMarkdownStyle,
      ...option
    }
  }

  private processVertex(vertex: lsif.Vertex): void {
    this.vertices.all.set(vertex.id, vertex)
    switch (vertex.label) {
      case lsif.VertexLabels.document:
        const contents =
          vertex.contents !== undefined
            ? Buffer.from(vertex.contents, 'base64').toString('utf-8')
            : 'No content provided'
        const textDocument = textdocument.TextDocument.create(
          vertex.uri,
          '',
          0,
          contents
        )
        this.documents.set(vertex.uri, { id: vertex.id, textDocument })
        this.vertices.documents.set(vertex.id, { ...vertex, contents })
        break
      case lsif.VertexLabels.range:
        this.vertices.ranges.set(vertex.id, vertex)
        break
      case lsif.VertexLabels.source:
        this._source = vertex
        break
      case lsif.VertexLabels.project:
        this._project = vertex
        break
    }
  }

  private processEdge(edge: lsif.Edge): void {
    if (lsif.Edge.is11(edge)) {
      this.doProcessEdge(edge.label, edge.outV, edge.inV)
    } else if (lsif.Edge.is1N(edge)) {
      for (const inV of edge.inVs) {
        this.doProcessEdge(edge.label, edge.outV, inV)
      }
    }
  }

  private doProcessEdge(
    label: lsif.EdgeLabels,
    outV: lsif.Id,
    inV: lsif.Id
  ): void {
    const from = this.vertices.all.get(outV)
    const to = this.vertices.all.get(inV)
    if (from === undefined || to === undefined) {
      throw new Error('Edge references unknown vertices')
    }

    switch (label) {
      case lsif.EdgeLabels.contains: {
        let values = this.out.contains.get(from.id)
        if (values === undefined) {
          values = [to as any]
          this.out.contains.set(from.id, values)
        } else {
          values.push(to as any)
        }
        this.in.contains.set(to.id, from as any)
        break
      }
      case lsif.EdgeLabels.textDocument_hover: {
        this.out.hover.set(from.id, to as lsif.HoverResult)
        break
      }
    }
  }

  public async load(filePath: string, customCssPath?: string): Promise<void> {
    if (!LsifHighlighter.shikiHighlighter) {
      LsifHighlighter.shikiHighlighter = await shiki.createHighlighter({
        langs: [moonbit],
        themes: ['one-light', 'one-dark-pro'],
        langAlias: {
          mbt: 'moonbit'
        }
      })
    }
    if (customCssPath)
      this.customCss = await fsp.readFile(customCssPath, 'utf-8')
    this._unified = unified
      .unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeShikiFromHighlighter, LsifHighlighter.shikiHighlighter, {
        themes: {
          light: 'one-light',
          dark: 'one-dark-pro'
        },
        defaultLanguage: 'moonbit'
      }) as unknown as unified.Processor

    return new Promise((resolve, reject) => {
      const input = fs.createReadStream(filePath, { encoding: 'utf8' })
      input.on('error', reject)
      const lines = readline.createInterface(input)
      lines.on('line', (line) => {
        if (!line || line.length === 0) {
          return
        }
        try {
          const element: lsif.Edge | lsif.Vertex = JSON.parse(line)
          switch (element.type) {
            case lsif.ElementTypes.vertex:
              this.processVertex(element)
              break
            case lsif.ElementTypes.edge:
              this.processEdge(element)
          }
        } catch (e) {
          input.destroy()
          reject(e)
        }
      })
      lines.on('close', () => {
        resolve()
      })
    })
  }

  private getHoverNodes(uri: lsif.Uri): HoverNode[] {
    const cached = this.hoverNodesCache.get(uri)
    if (cached) {
      return cached
    }
    const document = this.documents.get(uri)
    if (document === undefined) {
      throw new Error(`Document ${uri} not found`)
    }
    const ranges = this.out.contains.get(document.id) as
      | lsif.Range[]
      | undefined

    if (ranges === undefined) {
      return []
    }

    const hoverResults: HoverResult[] = []

    for (const r of ranges) {
      const hoverResult = this.out.hover.get(r.id)
      if (hoverResult === undefined) continue
      const result = hoverResult.result
      const range = result.range === undefined ? r : result.range
      let contents: string[] = []
      if (lsp.MarkupContent.is(result.contents)) {
        contents.push(result.contents.value)
      } else if (lsp.MarkedString.is(result.contents)) {
        contents.push(
          typeof result.contents === 'string'
            ? result.contents
            : result.contents.value
        )
      } else if (Array.isArray(result.contents)) {
        for (const content of result.contents) {
          contents.push(typeof content === 'string' ? content : content.value)
        }
      }
      if (range.end.line > range.start.line) {
        console.error(
          'Warning: hover range spans multiple lines, skip rendering'
        )
        continue
      }
      hoverResults.push({ contents, range })
    }

    hoverResults.sort((a, b) => compareRange(a.range, b.range, uri))

    const hoverNodes: HoverNode[] = []

    interface _Position extends lsp.Position {
      result: HoverResult
    }

    interface _StartPosition extends _Position {
      kind: 'start'
    }

    interface _EndPosition extends _Position {
      kind: 'end'
    }

    // convert hoverResults to hoverNodes

    // 1. convert hoverResults to position

    const positions: (_StartPosition | _EndPosition)[] = []

    for (const hoverResult of hoverResults) {
      const start: _StartPosition = {
        ...hoverResult.range.start,
        kind: 'start',
        result: hoverResult
      }
      const end: _EndPosition = {
        ...hoverResult.range.end,
        kind: 'end',
        result: hoverResult
      }
      positions.push(start)
      positions.push(end)
    }

    // 2. sort positions

    if (uri.endsWith('main.mbt')) {
      debugger
    }

    positions.sort((a, b) => {
      const cmp = comparePosition(a, b)
      if (cmp !== 0) return cmp
      if (a.kind === 'start' && b.kind === 'start') {
        return -comparePosition(a.result.range.end, b.result.range.end)
      }
      if (a.kind === 'start' && b.kind === 'end') return 1
      if (a.kind === 'end' && b.kind === 'start') return -1
      if (a.kind === 'end' && b.kind === 'end') {
        return -comparePosition(a.result.range.start, b.result.range.start)
      }
      return 0
    })

    // 3. convert positions to hoverNodes

    let startPositionStack: _Position[] = []
    function makeHoverNode(
      document: Document,
      start: _Position,
      end: _Position
    ): HoverNode {
      const range = lsp.Range.create(
        { line: start.line, character: start.character },
        { line: end.line, character: end.character }
      )
      return {
        kind: 'hover',
        range,
        target: document.textDocument.getText(range),
        start: document.textDocument.offsetAt(start),
        length: end.character - start.character,
        contents: start.result.contents
      }
    }

    function positionEquals(a: lsp.Position, b: lsp.Position): boolean {
      return comparePosition(a, b) === 0
    }
    for (const position of positions) {
      if (startPositionStack.length === 0) {
        if (position.kind === 'start') {
          startPositionStack.push(position)
        } else {
          throw new Error('badcase: end position without start position')
        }
      } else {
        if (position.kind === 'start') {
          const start = startPositionStack.at(-1)!
          if (!positionEquals(start, position)) {
            hoverNodes.push(makeHoverNode(document, start, position))
          }
          startPositionStack.push(position)
        } else {
          const start = startPositionStack.pop()!
          if (!positionEquals(start, position)) {
            hoverNodes.push(makeHoverNode(document, start, position))
          }
          if (startPositionStack.length > 0) {
            let toUpdate = startPositionStack.at(-1)!
            toUpdate.line = position.line
            toUpdate.character = position.character
          }
        }
      }
    }

    if (startPositionStack.length > 0) {
      throw new Error('badcase: nonempty start position stack')
    }

    this.hoverNodesCache.set(uri, hoverNodes)
    return hoverNodes
  }

  public highlightDocumentToHast(uri: string): hast.Root {
    const document = this.documents.get(uri)
    if (document === undefined) {
      throw new Error(`Document ${uri} not found`)
    }
    const content = document.textDocument.getText()
    const hoverNodes = this.getHoverNodes(uri)
    const transformer: shiki.ShikiTransformer = createShikiTransformer(
      hoverNodes,
      this.option,
      this.unified
    )
    return this.highlighter.codeToHast(content, {
      lang: 'moonbit',
      themes: {
        light: 'one-light',
        dark: 'one-dark-pro'
      },
      transformers: [transformer]
    })
  }

  private highlightDocument(uri: string): string {
    const document = this.documents.get(uri)
    if (document === undefined) {
      throw new Error(`Document ${uri} not found`)
    }
    const content = document.textDocument.getText()
    const hoverNodes = this.getHoverNodes(uri)
    const lineCount = document.textDocument.lineCount
    const transformer: shiki.ShikiTransformer = createShikiTransformer(
      hoverNodes,
      this.option,
      this.unified
    )
    const uriPath = vscodeuri.URI.parse(uri).path
    const title = path.basename(uriPath)
    const code = this.highlighter.codeToHtml(content, {
      lang: 'moonbit',
      themes: {
        light: 'one-light',
        dark: 'one-dark-pro'
      },
      transformers: [transformer]
    })
    let styles = [this.option.lsifStyle, this.option.markdownStyle]
    if (this.option.lineNumber) {
      styles.push(`
.line-number {
  width: ${lineCount.toString().length * 0.75}em;
  margin-right: 1.5em;
  display: inline-block;
  text-align: right;
  color: #6e7681;
}
`)
    }
    if (this.customCss) {
      styles.push(this.customCss)
    }
    return html(title, styles.join('\n'), code)
  }

  public async highlight(output: string) {
    let rootPath = vscodeuri.URI.parse(this.source.workspaceRoot).path
    if (this._project) {
      if (this._project.kind === 'moonbit' && this._project.contents) {
        const moonModJson = JSON.parse(
          Buffer.from(this._project.contents, 'base64').toString('utf-8')
        )
        if (moonModJson.source) {
          rootPath = path.join(rootPath, moonModJson.source)
        }
      }
    }
    const promises: Promise<void>[] = []
    for (const uri of this.documents.keys()) {
      const docPath = vscodeuri.URI.parse(uri).path
      const relativePath = path.relative(rootPath, docPath)
      const outputPath = path.join(output, relativePath + '.html')
      const html = this.highlightDocument(uri)
      promises.push(writeTo(outputPath, html))
    }
    await Promise.all(promises)
  }
}

function createShikiTransformer(
  hoverNodes: HoverNode[],
  option: LsifHighlighterOption,
  unified: unified.Processor
): shiki.ShikiTransformer {
  const lineHoverNodes = new Map<number, HoverNode[]>()
  for (const node of hoverNodes) {
    const line = node.range.start.line
    const nodes = lineHoverNodes.get(line)
    if (nodes === undefined) {
      lineHoverNodes.set(line, [node])
    } else {
      nodes.push(node)
    }
  }
  return {
    tokens(tokens) {
      const breakpoints = hoverNodes.flatMap((n) => [
        n.start,
        n.start + n.length
      ])
      return shiki.splitTokens(tokens, breakpoints)
    },
    pre(pre) {
      this.addClassToHast(pre, 'shiki-lsif lsp')
    },
    line(lineEl, line) {
      lineEl.properties.id = line
      type TokenTuple = [
        charStart: number,
        charEnd: number,
        token: hast.Element
      ]
      const tokensMap: TokenTuple[] = []
      let char = 0
      for (const token of lineEl.children) {
        if (token.type !== 'element') continue
        const text = token.children.find(
          (i) => i.type === 'text' && typeof i.value === 'string'
        ) as hast.Text | undefined
        if (text === undefined) continue
        tokensMap.push([char, char + text.value.length, token])
        char += text.value.length
      }
      const lineNumber: hast.Element = {
        type: 'element',
        tagName: 'a',
        properties: {
          class: 'line-number'
        },
        children: [
          {
            type: 'text',
            value: line.toString()
          }
        ]
      }

      const nodes = lineHoverNodes.get(line - 1)
      if (nodes === undefined) {
        if (option.lineNumber) {
          lineEl.children = [lineNumber, ...lineEl.children]
        }
        return
      }

      function nodeTokenRelation(
        node: HoverNode,
        token: TokenTuple
      ): 'left' | 'in' | 'right' {
        const [charStart, charEnd] = token
        const nodeStart = node.range.start.character
        const nodeEnd = node.range.end.character

        if (charEnd <= nodeStart) {
          return 'left'
        } else if (charStart >= nodeEnd) {
          return 'right'
        } else {
          return 'in'
        }
      }

      type TokenWithNode = {
        tokens: hast.Element[]
        node?: HoverNode
      }

      const tokenWithNodes: TokenWithNode[] = []

      // group tokens based on nodes
      let tokenIndex = 0
      for (const node of nodes) {
        let tokens: hast.Element[] = []
        while (tokenIndex < tokensMap.length) {
          const tokenTuple = tokensMap[tokenIndex]
          const token = tokenTuple[2]
          const relation = nodeTokenRelation(node, tokenTuple)
          if (relation === 'left') {
            tokenWithNodes.push({ tokens: [token] })
            tokenIndex++
          } else if (relation === 'in') {
            tokens.push(token)
            tokenIndex++
          } else if (relation === 'right') {
            break
          }
        }
        tokenWithNodes.push({ tokens, node })
      }
      for (const [_s, _e, token] of tokensMap.slice(tokenIndex)) {
        tokenWithNodes.push({ tokens: [token] })
      }

      const newChildren: hast.Element[] = []
      if (option.lineNumber) newChildren.push(lineNumber)
      function popupElement(node: HoverNode): hast.Element {
        const elements: hast.Element[] = []
        const collect = (child: any) => {
          if (child.type === 'element') {
            elements.push(child)
          } else if (child.children) {
            child.children.forEach(collect)
          }
        }
        for (const content of node.contents) {
          const root = unified.runSync(unified.parse(content)) as hast.Root
          collect(root)
        }
        return {
          type: 'element',
          tagName: 'div',
          properties: {
            class: 'shiki-lsif-hover-content markdown'
          },
          children: elements
        }
      }
      for (const { tokens, node } of tokenWithNodes) {
        if (!node) {
          newChildren.push(...tokens)
        } else {
          const popup = popupElement(node)
          const token: hast.Element =
            tokens.length === 1
              ? tokens[0]
              : {
                  type: 'element',
                  tagName: 'span',
                  properties: {},
                  children: tokens
                }
          newChildren.push({
            type: 'element',
            tagName: 'span',
            properties: {
              class: 'shiki-lsif-hover'
            },
            children: [popup, token]
          })
        }
      }
      lineEl.children = newChildren
    }
  }
}

async function writeTo(filePath: string, content: string) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(filePath)) {
    await fsp.mkdir(dir, { recursive: true })
  }
  await fsp.writeFile(filePath, content)
}
