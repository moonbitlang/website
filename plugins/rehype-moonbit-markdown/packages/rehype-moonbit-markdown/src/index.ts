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

import * as shikiLsif from '@moonbit/shiki-lsif'
import * as fsp from 'fs/promises'
import * as tmp from 'tmp'
import * as cp from 'child_process'
import * as url from 'url'
import * as os from 'os'
import * as path from 'path'
import * as unistUtilVisit from 'unist-util-visit'
import * as hastUtilToString from 'hast-util-to-string'
import * as shiki from 'shiki'
import moonbit from '@moonbit/moonbit-tmlanguage'
import type * as hast from 'hast'
import type * as unified from 'unified'

async function tempFile(content?: string): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    tmp.file((err, path) => {
      if (err) {
        reject(err)
      } else {
        if (content) {
          fsp
            .writeFile(path, content, 'utf8')
            .then(() => {
              resolve(path)
            })
            .catch((err) => reject(err))
        } else {
          resolve(path)
        }
      }
    })
  })
}

async function moonbitCodeToLineHast(content: string): Promise<hast.Element[]> {
  const tempMbtFile = await tempFile(content)
  const tempMbtUri = url.pathToFileURL(tempMbtFile).toString()
  const tempLsifFile = await tempFile()
  const moonHome = process.env['MOON_HOME'] ?? path.join(os.homedir(), '.moon')
  const stdpath = path.join(moonHome, 'lib/core/target/wasm-gc/release/bundle')
  cp.execSync(
    `moondoc '${tempMbtFile}' -std-path '${stdpath}' -lsif -o '${tempLsifFile}'`
  )
  const lsifHighlighter = await shikiLsif.LsifHighlighter.init(tempLsifFile, {
    lineNumber: false,
    themes: { light: 'one-light', dark: 'one-dark-pro' }
  })
  const hast: hast.Root = lsifHighlighter.highlightDocumentToHast(tempMbtUri)
  const codeLines: hast.Element[] = []
  unistUtilVisit.visit(hast, 'element', (node) => {
    if (
      node.tagName !== 'span' ||
      node.properties.class !== 'line' ||
      !node.properties.id ||
      typeof node.properties.id !== 'number'
    ) {
      return
    }
    codeLines[node.properties.id] = node
  })
  return codeLines
}

class PreWrapper {
  wrapper: hast.Element
  constructor() {
    this.wrapper = {
      type: 'element',
      tagName: 'pre',
      properties: {
        class: [
          'shiki',
          'shiki-themes',
          'one-light',
          'one-dark-pro',
          'shiki-lsif',
          'lsp'
        ],
        style:
          'background-color: rgb(250, 250, 250); --shiki-dark-bg: #282c34; color: rgb(56, 58, 66); --shiki-dark: #abb2bf;',
        tabindex: '0'
      },
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: {},
          children: []
        }
      ]
    }
  }

  addLine(line: hast.Element): void {
    const code = this.wrapper.children[0] as hast.Element
    code.children.push(line)
    code.children.push({
      type: 'text',
      value: '\n'
    })
  }

  toHast(): hast.Element {
    return this.wrapper
  }
}

// check if the element is a type check moonbit code block
function isMoonbitCheckCode(element: hast.Element): boolean {
  if (element.tagName !== 'code') return false
  const className = element.properties.className
  if (!Array.isArray(className)) return false
  const isMoonbit =
    className.includes('language-moonbit') || className.includes('language-mbt')
  return !(element.data as any)?.meta && isMoonbit
}

function collectMoonbitCode(tree: hast.Root): string {
  type MoonbitCode = {
    content: string
    startLine: number
    endLine: number
  }
  const moonbitCodes: MoonbitCode[] = []

  unistUtilVisit.visit(tree, 'element', (node) => {
    if (!node.position) return
    if (!isMoonbitCheckCode(node)) return
    const content = hastUtilToString.toString(node)
    moonbitCodes.push({
      content,
      startLine: node.position.start.line + 1,
      endLine: node.position.end.line
    })
  })

  moonbitCodes.sort((a, b) => a.startLine - b.startLine)

  let line = 1
  let buffer = ''
  for (const code of moonbitCodes) {
    buffer += '\n'.repeat(code.startLine - line - 1)
    buffer += '///|\n'
    buffer += code.content
    line = code.endLine
  }
  return buffer
}

let highlighter: shiki.Highlighter | undefined

async function shikiHighlighter(): Promise<shiki.Highlighter> {
  if (highlighter) return highlighter
  highlighter = await shiki.createHighlighter({
    themes: ['one-light', 'one-dark-pro'],
    langs: Object.keys(shiki.bundledLanguages).concat(moonbit as any),
    langAlias: {
      mbt: 'moonbit'
    }
  })
  return highlighter
}

const rehypeMoonbitMarkdown: unified.Plugin<[], hast.Root> = function () {
  return async (tree) => {
    const highlighter = await shikiHighlighter()
    const mbt = collectMoonbitCode(tree)
    const lineHasts = await moonbitCodeToLineHast(mbt)
    unistUtilVisit.visit(tree, 'element', (node, index, parent) => {
      if (!parent || index === undefined) {
        return
      }

      if (node.tagName !== 'pre') return

      const head = node.children[0]
      if (
        !head ||
        head.type !== 'element' ||
        head.tagName !== 'code' ||
        !head.properties
      ) {
        return
      }

      if (!node.position) return

      if (!isMoonbitCheckCode(head)) {
        const className = head.properties.className
        if (!Array.isArray(className)) return unistUtilVisit.SKIP
        const content = (head.children[0] as hast.Text).value
        const language = (className[0] as string).replace('language-', '')
        if (!content || !language) {
          return unistUtilVisit.SKIP
        }
        const newPre = highlighter.codeToHast(content, {
          lang: language,
          themes: {
            light: 'one-light',
            dark: 'one-dark-pro'
          }
        }).children[0]
        parent.children[index] = newPre
        return unistUtilVisit.SKIP
      }

      const { start, end } = node.position
      const preWrapper = new PreWrapper()

      for (let l = start.line + 1; l < end.line; l++) {
        preWrapper.addLine(lineHasts[l])
      }

      parent.children[index] = preWrapper.toHast()

      return unistUtilVisit.SKIP
    })
  }
}

export default rehypeMoonbitMarkdown
