import * as lsp from 'vscode-languageserver-protocol'
import * as lsif from '@vscode/lsif-protocol'
import * as fs from 'fs'
import * as readline from 'readline'
import * as textdocument from 'vscode-languageserver-textdocument'
import * as util from './util.js'

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

interface Document {
  id: lsif.Id
  textDocument: textdocument.TextDocument
}

interface HoverResult {
  contents: string[]
  range: lsp.Range
}

export class LsifDb {
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

  public async load(lsifPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const input = fs.createReadStream(lsifPath, { encoding: 'utf8' })
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

  public getDocument(uri: lsif.Uri): Document | undefined {
    return this.documents.get(uri)
  }

  public getHoverResult(uri: lsif.Uri): HoverResult[] {
    const document = this.getDocument(uri)
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
        const rangeString = `${uri}:${util.rangeToString(range)}`
        console.error(
          `Warning: hover range spans multiple lines: ${rangeString}`
        )
        continue
      }
      hoverResults.push({ contents, range })
    }

    hoverResults.sort((a, b) => util.compareRange(a.range, b.range, uri))

    return hoverResults
  }

  public getAllDocumentUris(): MapIterator<string> {
    return this.documents.keys()
  }

  get source(): lsif.Source {
    if (this._source === undefined) {
      throw new Error('Source not initialized')
    }
    return this._source
  }

  get project(): lsif.Project | undefined {
    return this._project
  }
}
