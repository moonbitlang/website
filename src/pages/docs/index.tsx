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

import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import { useEffect } from 'react'
export default function Docs() {
  const { i18n } = useDocusaurusContext()
  useEffect(() => {
    if (i18n.currentLocale === 'zh') {
      window.location.replace('https://docs.moonbitlang.cn')
    } else {
      window.location.replace('https://docs.moonbitlang.com')
    }
  }, [])
  return <Layout></Layout>
}
