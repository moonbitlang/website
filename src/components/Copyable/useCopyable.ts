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

import { useState } from 'react'

type CopyState = 'uncopy' | 'copying' | 'copyed' | 'failed'

function useCopyable(content: string): [boolean, string, () => void] {
  const [copyState, setCopyState] = useState<CopyState>('uncopy')
  const isClickable = copyState === 'uncopy'
  let buttonText = '📋'
  switch (copyState) {
    case 'uncopy':
      buttonText = '📋'
      break
    case 'copying':
      buttonText = '🔄'
      break
    case 'copyed':
      buttonText = '✅'
      break
    case 'failed':
      buttonText = '❌'
      break
  }

  async function handleCopy(): Promise<void> {
    setCopyState('copying')
    try {
      await navigator.clipboard.writeText(content)
      setCopyState('copyed')
    } catch (err) {
      console.error(err)
      setCopyState('failed')
    } finally {
      setTimeout(() => setCopyState('uncopy'), 1000)
    }
  }

  return [
    isClickable,
    buttonText,
    async () => {
      await handleCopy()
    }
  ]
}

export default useCopyable
