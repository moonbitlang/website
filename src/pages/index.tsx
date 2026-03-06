/*
 * Copyright 2026 International Digital Economy Academy
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

import Layout from '@theme/Layout'
import { useEffect } from 'react'

const mountId = 'rabbita-home'
const scriptId = 'rabbita-home-script'

function RabbitaHome() {
  useEffect(() => {
    const oldScript = document.getElementById(scriptId)
    if (oldScript) {
      oldScript.remove()
    }

    const mount = document.getElementById(mountId)
    if (mount) {
      mount.innerHTML = ''
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.type = 'module'
    // TODO(rabbita): replace this forced reload with App::refresh/remount to preserve state.
    script.src = `/rabbita-home/main.js?ts=${Date.now()}`
    document.body.appendChild(script)

    return () => {
      script.remove()
      const cleanupMount = document.getElementById(mountId)
      if (cleanupMount) {
        cleanupMount.innerHTML = ''
      }
    }
  }, [])

  return <div id={mountId} />
}

export default function Page() {
  return (
    <Layout>
      <main>
        <RabbitaHome />
      </main>
    </Layout>
  )
}
