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
import * as lsif from '@vscode/lsif-protocol'
import * as textdocument from 'vscode-languageserver-textdocument'
import * as hast from 'hast'
import * as unified from 'unified'
import * as vscodeuri from 'vscode-uri'
import * as path from 'path'
import * as lsp from 'vscode-languageserver-protocol'
import * as lsifDb from './lsif-db.js'
import moonbit from '@moonbit/moonbit-tmlanguage'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeShikiFromHighlighter from '@shikijs/rehype/core'
import * as util from './util.js'

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
  themes: {
    light: string
    dark: string
  }
}

type highlightAllResult = {
  relativePath: string
  code: string
  style: string
}

export class LsifHighlighter {
  private db: lsifDb.LsifDb = new lsifDb.LsifDb()
  static shikiHighlighter: shiki.Highlighter | undefined
  private _unified: unified.Processor | undefined
  private option: LsifHighlighterOption
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

  private constructor(option?: Partial<LsifHighlighterOption>) {
    this.option = {
      lineNumber: true,
      themes: {
        light: 'light-plus',
        dark: 'dark-plus'
      },
      ...option
    }
  }

  public static async init(
    lsifPath: string,
    option: Partial<LsifHighlighterOption> = {}
  ): Promise<LsifHighlighter> {
    const highlighter = new LsifHighlighter(option)
    if (!LsifHighlighter.shikiHighlighter) {
      LsifHighlighter.shikiHighlighter = await shiki.createHighlighter({
        langs: [moonbit as any],
        themes: [
          highlighter.option.themes.light,
          highlighter.option.themes.dark
        ],
        langAlias: {
          mbt: 'moonbit'
        }
      })
    }
    highlighter._unified = unified
      .unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeShikiFromHighlighter, LsifHighlighter.shikiHighlighter, {
        themes: highlighter.option.themes,
        defaultLanguage: 'moonbit'
      }) as unknown as unified.Processor

    await highlighter.db.load(lsifPath)
    return highlighter
  }

  private getHoverNodes(uri: lsif.Uri): HoverNode[] {
    const document = this.db.getDocument(uri)
    if (document === undefined) {
      throw new Error(`Document ${uri} not found`)
    }
    const cached = this.hoverNodesCache.get(uri)
    if (cached) {
      return cached
    }
    const hoverResults = this.db.getHoverResult(uri)

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

    positions.sort((a, b) => {
      const cmp = util.comparePosition(a, b)
      if (cmp !== 0) return cmp
      if (a.kind === 'start' && b.kind === 'start') {
        return -util.comparePosition(a.result.range.end, b.result.range.end)
      }
      if (a.kind === 'start' && b.kind === 'end') return 1
      if (a.kind === 'end' && b.kind === 'start') return -1
      if (a.kind === 'end' && b.kind === 'end') {
        return -util.comparePosition(a.result.range.start, b.result.range.start)
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
          if (util.comparePosition(start, position) !== 0) {
            hoverNodes.push(makeHoverNode(document, start, position))
          }
          startPositionStack.push(position)
        } else {
          const start = startPositionStack.pop()!
          if (util.comparePosition(start, position) !== 0) {
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
    const document = this.db.getDocument(uri)
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
      themes: this.option.themes,
      transformers: [transformer]
    })
  }

  public highlightDocumentToHtml(uri: string): { style: string; code: string } {
    const document = this.db.getDocument(uri)
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
    const code = this.highlighter.codeToHtml(content, {
      lang: 'moonbit',
      themes: this.option.themes,
      transformers: [transformer]
    })
    let style = ''
    if (this.option.lineNumber) {
      style = `
.line-number {
  width: ${lineCount.toString().length * 0.75}em;
  margin-right: 1.5em;
  display: inline-block;
  text-align: right;
  color: #6e7681;
}
`
    }
    return { style, code }
  }

  public highlightAll(): highlightAllResult[] {
    let rootPath = vscodeuri.URI.parse(this.db.source.workspaceRoot).path
    if (this.db.project) {
      if (this.db.project.kind === 'moonbit' && this.db.project.contents) {
        const moonModJson = JSON.parse(
          Buffer.from(this.db.project.contents, 'base64').toString('utf-8')
        )
        if (moonModJson.source) {
          rootPath = path.join(rootPath, moonModJson.source)
        }
      }
    }
    const results: highlightAllResult[] = []
    for (const uri of this.db.getAllDocumentUris()) {
      const docPath = vscodeuri.URI.parse(uri).path
      const relativePath = path.relative(rootPath, docPath)
      results.push({ relativePath, ...this.highlightDocumentToHtml(uri) })
    }
    return results
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
