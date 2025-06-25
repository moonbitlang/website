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

import { useEffect, useState } from 'react'
import styles from './index.module.css'
import Copyable from '@site/src/components/Copyable'
import Layout from '@theme/Layout'

function useCode() {
  const [code, setCode] = useState<string | null>(null)
  useEffect(() => {
    const query = new URLSearchParams(location.search)
    const code = query.get('code')
    setCode(code)
  }, [])
  return code
}

export default function Callback() {
  const code = useCode()
  return (
    <Layout wrapperClassName={styles['main-wrapper']}>
      {code === null ? (
        <h1 className={styles['text-center']}>Failed to get Code</h1>
      ) : (
        <div className={styles['div-center']}>
          <h1>Copy Your Login Code</h1>
          <Copyable content={code} fontSize='1.5rem' />
        </div>
      )}
    </Layout>
  )
}
