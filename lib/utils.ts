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

async function getGithubStars(headers?: HeadersInit) {
  return await fetch('https://api.github.com/repos/moonbitlang/moonbit-docs', {
    headers
  })
    .then((res) => res.json())
    .then((data) => data.watchers_count)
}

async function getContributors(headers?: HeadersInit) {
  return await fetch(
    'https://api.github.com/repos/moonbitlang/core/contributors',
    { headers }
  ).then((res) => res.json())
}

async function getCommitCount(headers?: HeadersInit) {
  const res = await fetch(
    'https://api.github.com/repos/moonbitlang/core/commits?per_page=1',
    {
      method: 'HEAD',
      headers
    }
  )
  const link = res.headers.get('link')
  return link?.match(/page=(\d+)>; rel="last"/)?.[1]
}

async function getMergedPRCount(headers?: HeadersInit) {
  return await fetch(
    'https://api.github.com/search/issues?q=repo:moonbitlang/core+is:pr+is:merged',
    { headers }
  )
    .then((res) => res.json())
    .then((json) => json.total_count)
}

export { getGithubStars, getContributors, getCommitCount, getMergedPRCount }
