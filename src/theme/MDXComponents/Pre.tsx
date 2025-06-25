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

import React, { useEffect, useRef, type ReactNode } from 'react'
import type { Props } from '@theme/MDXComponents/Pre'

export default function MDXPre(props: Props): ReactNode | undefined {
  const ref = useRef<HTMLPreElement>(null)
  useEffect(() => {
    if (!props.className?.includes('lsp')) {
      return
    }
    if (!ref.current) {
      return
    }
    const hovers = Array.from(
      ref.current.querySelectorAll<HTMLSpanElement>('.shiki-lsif-hover')
    )
    for (const hover of hovers) {
      const hoverContent = hover.querySelector<HTMLDivElement>('.markdown')
      if (!hoverContent) {
        continue
      }
      const show = () => {
        document.body.append(hoverContent)
        hoverContent.style.display = 'block'
        const rect = hover.getBoundingClientRect()
        hoverContent.style.position = 'absolute'
        hoverContent.style.top = `${rect.bottom + window.scrollY}px`
        hoverContent.style.left = `${rect.left + window.scrollX}px`
        hoverContent.style.zIndex = '1000'
      }
      const hide = () => {
        hoverContent.remove()
      }
      hover.onmouseenter = show
      hover.onmouseleave = hide
      hoverContent.onmouseenter = show
      hoverContent.onmouseleave = hide
    }
    return () => {
      for (const hover of hovers) {
        hover.onmouseenter = null
        hover.onmouseleave = null
      }
    }
  }, [ref])
  return <pre {...props} ref={ref} />
}
