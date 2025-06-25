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

import React from 'react'
import styles from './index.module.css'
import useCopyable from './useCopyable'

interface CopyableProps {
  content: string
  fontSize?: string
}

function Copyable(prop: CopyableProps): JSX.Element {
  const { content, fontSize } = prop
  const [isClickable, buttonText, handleCopy] = useCopyable(content)
  return (
    <div className={styles.wrapper}>
      <figure>
        <pre style={fontSize ? { fontSize } : {}}>{content}</pre>
      </figure>
      <button disabled={!isClickable} onClick={handleCopy}>
        {buttonText}
      </button>
    </div>
  )
}

export default Copyable
