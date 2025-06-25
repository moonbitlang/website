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

import BrowserOnly from '@docusaurus/BrowserOnly'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import { useEffect } from 'react'

function ClientCallback() {
  const {
    siteConfig: { customFields }
  } = useDocusaurusContext()
  const mooncakesApi = customFields?.MOONCAKES_API as string
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')!
  const repo = url.searchParams.get('repo') ?? 'core'
  useEffect(() => {
    const getAccessToken = async () => {
      const res = await fetch(`${mooncakesApi}/callback/github`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({ code })
      })
      const json = (await res.json()) as { access_token: string }
      const { access_token } = json
      const access_token_with_time = {
        access_token,
        time: Date.now()
      }
      localStorage.setItem(
        'access_token_with_time',
        JSON.stringify(access_token_with_time)
      )
      window.location.replace(`/cla/${repo}`)
    }
    getAccessToken()
  }, [])
  return <></>
}

export default function Callback() {
  return (
    <BrowserOnly fallback={<h1>Redirecting...</h1>}>
      {() => <ClientCallback />}
    </BrowserOnly>
  )
}
