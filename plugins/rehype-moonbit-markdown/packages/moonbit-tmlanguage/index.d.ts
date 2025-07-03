export interface TextMateGrammar {
  $schema?: string
  name: string
  scopeName: string
  fileTypes: string[]
  patterns: Array<{
    include?: string
    name?: string
    match?: string
    begin?: string
    end?: string
    while?: string
    patterns?: any[]
    captures?: Record<string, any>
    beginCaptures?: Record<string, any>
    endCaptures?: Record<string, any>
    contentName?: string
  }>
  repository?: Record<string, any>
}

declare const grammar: TextMateGrammar
export default grammar
