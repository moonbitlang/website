import * as lsif from '@vscode/lsif-protocol'
import * as lsp from 'vscode-languageserver-protocol'

export function comparePosition(p1: lsp.Position, p2: lsp.Position): number {
  return p1.line - p2.line === 0
    ? p1.character - p2.character
    : p1.line - p2.line
}

export function compareRange(
  r1: lsp.Range,
  r2: lsp.Range,
  uri?: lsif.Uri
): number {
  const start = comparePosition(r1.start, r2.start)
  if (start !== 0) return start
  const end = comparePosition(r1.end, r2.end)
  if (end === 0 && uri) {
    // console.error("Warning: equal range", uri, r1, r2);
  }
  return end
}

export function rangeToString(range: lsp.Range): string {
  return `${range.start.line}:${range.start.character} - ${range.end.line}:${range.end.character}`
}
