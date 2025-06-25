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

import React, { useEffect, useRef } from 'react'
import * as moonbitMode from '@moonbit/moonpad-monaco'
import * as monaco from 'monaco-editor-core'

// @ts-ignore
self.MonacoEnvironment = {
  getWorker() {
    return new Worker(
      new URL('monaco-editor-core/esm/vs/editor/editor.worker', import.meta.url)
    )
  }
}

const Container: React.FunctionComponent<{
  _ref: React.RefObject<HTMLDivElement>
  classsName: string
}> = (params) => {
  const { _ref, classsName } = params
  return <div className={classsName} ref={_ref}></div>
}

const MemoContainer = React.memo(Container)

const MoonpadMonaco: React.FunctionComponent<{
  className: string
  value: string
  onOutput: (output: ReadableStream<string>) => void
}> = (params) => {
  const { className, value, onOutput } = params
  const containerRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<monaco.editor.ITextModel>()
  const moonRef = useRef<ReturnType<typeof moonbitMode.init>>()
  function getMoon() {
    if (moonRef.current) {
      return moonRef.current
    }
    const moon = moonbitMode.init({
      lspWorker: new Worker('/lsp-server.js'),
      onigWasmUrl: new URL(
        '@moonbit/moonpad-monaco/onig.wasm',
        import.meta.url
      ).toString(),
      mooncWorkerFactory: () => {
        return new Worker('/moonc-worker.js')
      },
      codeLensFilter: (_lens) => {
        return false
      }
    })
    moonRef.current = moon
    return moon
  }

  function getModel() {
    if (modelRef.current) return modelRef.current
    const model = monaco.editor.createModel(
      value,
      'moonbit',
      monaco.Uri.parse('file:///main.mbt')
    )
    modelRef.current = model
    return model
  }

  function setValue(value: string) {
    getModel().setValue(value)
  }

  useEffect(() => {
    if (!containerRef.current) return
    // const container = containerRef.current
    const moon = getMoon()
    const model = getModel()
    model.onDidChangeContent(async () => {
      const content = model.getValue()
      const result = await moon.compile({ libInputs: [['main.mbt', content]] })
      switch (result.kind) {
        case 'success': {
          const js = result.js
          const stream = await moon.run(js)
          onOutput(stream)
          return
        }
        case 'error': {
        }
      }
    })
    const editor = monaco.editor.create(containerRef.current, {
      model,
      lineNumbers: 'off',
      glyphMargin: false,
      minimap: {
        enabled: false
      },
      automaticLayout: true,
      folding: false,
      fontSize: 14,
      detectIndentation: false,
      insertSpaces: true,
      tabSize: 2,
      scrollBeyondLastLine: false,
      scrollbar: {
        alwaysConsumeMouseWheel: false
      },
      fontFamily: 'Fira Code',
      theme: 'dark-plus'
    })
    // const updateHeight = () => {
    //   const contentHeight = Math.max(320, editor.getContentHeight())
    //   const width = container.clientWidth
    //   container.style.height = `${contentHeight}px`
    //   editor.layout({ width, height: contentHeight })
    // }
    // editor.onDidContentSizeChange(updateHeight)
    // updateHeight()
    return () => {
      model.dispose()
      modelRef.current = undefined
      editor.dispose()
    }
  }, [])

  useEffect(() => {
    setValue(value)
  }, [value])

  return <MemoContainer classsName={className} _ref={containerRef} />
}

export default MoonpadMonaco
