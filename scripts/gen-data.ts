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

import fs from 'node:fs/promises'
import * as utils from '../lib/utils.js'
import path from 'node:path'

const createGithubHeaders = (): HeadersInit => {
  const headers: HeadersInit = {}
  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

const GITHUB_HEADERS = createGithubHeaders()

;(async () => {
  const githubStars = await utils.getGithubStars(GITHUB_HEADERS)
  const contributors = await utils.getContributors(GITHUB_HEADERS)
  const commitCount = await utils.getCommitCount(GITHUB_HEADERS)
  const mergedPRCount = await utils.getMergedPRCount(GITHUB_HEADERS)
  const contributorsCount = contributors.length
  const data = JSON.stringify(
    {
      githubStars: `${githubStars}`,
      contributors,
      commitCount,
      mergedPRCount: `${mergedPRCount}`,
      contributorsCount: `${contributorsCount}`
    },
    null,
    2
  )
  console.log(data)
  await fs.writeFile(path.join(process.cwd(), 'data', 'data.json'), data)
})()
