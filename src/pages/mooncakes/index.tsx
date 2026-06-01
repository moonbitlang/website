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

import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import clsx from 'clsx'
import React, { useEffect, useState } from 'react'
import styles from './index.module.css'
import { jwtDecode } from 'jwt-decode'

type UserInfo = {
  accessToken: string
  username: string
  gh_avatar?: string
}

type AccessTokenWithTime = {
  access_token: string
  time: number
}

const GITHUB_ACCESS_TOKEN_WITH_TIME_KEY = 'access_token_with_time'
const PASSWORD_ACCESS_TOKEN_WITH_TIME_KEY = 'mooncakes-access-token-with-time'
const LEGACY_PASSWORD_ACCESS_TOKEN_KEY = 'mooncakes-access-token'
const USERNAME_KEY = 'mooncakes-username'
const ACCESS_TOKEN_MAX_AGE = 90 * 24 * 60 * 60 * 1000

function isAccessTokenWithTime(value: unknown): value is AccessTokenWithTime {
  if (value === null || typeof value !== 'object') return false
  const data = value as Partial<AccessTokenWithTime>
  return (
    typeof data.access_token === 'string' &&
    data.access_token !== '' &&
    typeof data.time === 'number' &&
    Number.isFinite(data.time)
  )
}

function readStoredAccessTokenWithTime(
  key: string
): AccessTokenWithTime | null {
  const accessTokenWithTime = localStorage.getItem(key)
  if (accessTokenWithTime !== null) {
    try {
      const data = JSON.parse(accessTokenWithTime) as unknown
      if (isAccessTokenWithTime(data)) return data
    } catch {
      // Ignore malformed stored auth state and fall back to legacy storage.
    }
  }
  return null
}

function readAccessTokenWithTime(): AccessTokenWithTime | null {
  const passwordAccessTokenWithTime = readStoredAccessTokenWithTime(
    PASSWORD_ACCESS_TOKEN_WITH_TIME_KEY
  )
  if (passwordAccessTokenWithTime !== null) {
    return passwordAccessTokenWithTime
  }

  const githubAccessTokenWithTime = readStoredAccessTokenWithTime(
    GITHUB_ACCESS_TOKEN_WITH_TIME_KEY
  )
  if (githubAccessTokenWithTime !== null) {
    return githubAccessTokenWithTime
  }

  const legacyAccessToken = localStorage.getItem(
    LEGACY_PASSWORD_ACCESS_TOKEN_KEY
  )
  if (!legacyAccessToken) return null

  const migratedAccessToken = {
    access_token: legacyAccessToken,
    time: Date.now()
  }
  localStorage.setItem(
    PASSWORD_ACCESS_TOKEN_WITH_TIME_KEY,
    JSON.stringify(migratedAccessToken)
  )
  localStorage.removeItem(LEGACY_PASSWORD_ACCESS_TOKEN_KEY)
  return migratedAccessToken
}

function readUserInfo(accessToken: string): UserInfo | null {
  const fallbackUsername = localStorage.getItem(USERNAME_KEY)
  try {
    const data = jwtDecode<Partial<UserInfo>>(accessToken)
    const username = data.username ?? fallbackUsername
    if (!username) return null
    return { ...data, username, accessToken }
  } catch {
    if (!fallbackUsername) return null
    return { accessToken, username: fallbackUsername }
  }
}

function User(props: UserInfo): React.JSX.Element {
  const {
    siteConfig: { customFields }
  } = useDocusaurusContext()
  const apiHost = customFields?.MOONCAKES_API_HOST as string
  const { accessToken, username } = props
  const [isFirst, setIsFirst] = useState(true)
  const [tokens, setTokens] = useState<[string, string, string, boolean][]>([])
  const [tokenName, setTokenName] = useState('')
  const fetchTokens = async (triggerByUser: boolean) => {
    if (!triggerByUser && !isFirst) return
    setIsFirst(false)
    const res = await fetch(`${apiHost}/api/v0/api_token/list`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    const json: { tokens: [string, string, string, boolean][] } =
      await res.json()
    setTokens(json.tokens)
  }
  useEffect(() => {
    fetchTokens(false).catch(console.error)
  }, [])
  return (
    <div>
      <p>Hello, {username}</p>
      <input
        type='text'
        value={tokenName}
        onChange={(e) => {
          setTokenName(e.target.value)
        }}
      />
      <button
        onClick={async (e) => {
          const res = await fetch(`${apiHost}/api/v0/api_token/create`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: tokenName })
          })
          if (res.status === 200) {
            setTokenName('')
            fetchTokens(true).catch(console.error)
          }
        }}
      >
        Generate Token
      </button>
      <div>
        tokens:
        <ul>
          {tokens
            .sort((a, b) => {
              const [ta, tb] = [a[2], b[2]]
              const [da, db] = [Date.parse(ta), Date.parse(tb)]
              return db - da
            })
            .map((token) => (
              <li key={token[1]}>{`${token[0]}: ${token[1]}`}</li>
            ))}
        </ul>
      </div>
    </div>
  )
}

export default function Mooncakes(): React.JSX.Element {
  const [isLogin, setIsLogin] = useState(false)
  const [userData, setUserData] = useState<UserInfo>()
  const {
    siteConfig: { customFields }
  } = useDocusaurusContext()
  const clientId = customFields?.GITHUB_OAUTH_CLIENT_ID as string

  useEffect(() => {
    const accessTokenWithTime = readAccessTokenWithTime()
    if (accessTokenWithTime === null) return
    if (Date.now() - accessTokenWithTime.time > ACCESS_TOKEN_MAX_AGE) return
    // if (Date.now() - accessTokenWithTime.time > 1000) return
    const data = readUserInfo(accessTokenWithTime.access_token)
    if (data === null) return
    setIsLogin(true)
    setUserData(data)
  }, [])
  return (
    <Layout wrapperClassName={styles['main-wrapper']}>
      <div className={styles['login-wrapper']}>
        {!isLogin || userData === undefined ? (
          <a
            href={`https://github.com/login/oauth/authorize?client_id=${clientId}`}
            className={clsx('button', 'button--primary')}
          >
            Log in With Github
          </a>
        ) : (
          <User {...userData} />
        )}
      </div>
    </Layout>
  )
}
