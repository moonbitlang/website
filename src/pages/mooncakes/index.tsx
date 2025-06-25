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
import clsx from 'clsx'
import React, { useEffect, useState } from 'react'
import styles from './index.module.css'
import { jwtDecode } from 'jwt-decode'

type UserInfo = {
  accessToken: string
  username: string
  gh_avatar: string
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
    const accessToken = localStorage.getItem('access_token_with_time')
    const accessTokenWithTime = accessToken
      ? (JSON.parse(accessToken) as { access_token: string; time: number })
      : null
    if (accessTokenWithTime === null) return
    if (Date.now() - accessTokenWithTime.time > 90 * 24 * 60 * 60 * 1000) return
    // if (Date.now() - accessTokenWithTime.time > 1000) return
    setIsLogin(true)
    const data = jwtDecode<UserInfo>(accessTokenWithTime.access_token)
    setUserData({ ...data, accessToken: accessTokenWithTime.access_token })
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
