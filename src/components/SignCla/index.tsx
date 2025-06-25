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

import styles from './index.module.css'
import { useEffect, useState } from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import { jwtDecode } from 'jwt-decode'
import BrowserOnly from '@docusaurus/BrowserOnly'

type SignState =
  | {
      signed: false
    }
  | {
      signed: true
      signed_time: string
    }

type Profile = {
  fullName: string | null
  githubId: string
  email: string
}

type Check = {
  id: string
  content: string
}

const checkMap: Record<string, Check[]> = {
  core: [],
  moon: [
    {
      id: 'ownership',
      content:
        'I have sole ownership of intellectual property rights to the Contributions and I am legally entitled to sign this CCAA(or on behalf of the Corporation).'
    },
    {
      id: 'check-input',
      content:
        'I have read Privacy Statement in Schedule C and accept that the information I provide to sign this CCAA will be maintained in accordance with it.'
    }
  ],
  'moonbit-arduino': [
    {
      id: 'ownership',
      content:
        'I have sole ownership of intellectual property rights to the Contributions and I am legally entitled to sign this CCAA(or on behalf of the Corporation).'
    },
    {
      id: 'check-input',
      content:
        'I have read Privacy Statement in Schedule C and accept that the information I provide to sign this CCAA will be maintained in accordance with it.'
    }
  ],
  moonrun: [],
  moonc: []
}

function useProfile(token: string) {
  const [profile, setProfile] = useState<Profile | null>(null)
  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch('https://mooncakes.io/api/v0/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = (await res.json()).data
      setProfile({
        fullName: data.gh_name,
        githubId: data.username,
        email: data.email
      })
    }
    fetchProfile()
  }, [token])
  return profile
}

function SignForm({
  accessToken,
  repo
}: {
  accessToken: string
  repo: string
}) {
  const {
    siteConfig: { customFields }
  } = useDocusaurusContext()
  const mooncakesApi = customFields?.MOONCAKES_API as string
  const [isSigning, setIsSigning] = useState(false)
  const checks = checkMap[repo]
  const [checkStatus, setCheckStatus] = useState<boolean[]>(
    checks.map(() => false)
  )
  const canSign = checkStatus.every((status) => status)
  const profile = useProfile(accessToken)
  const handleSign = async () => {
    setIsSigning(true)
    await fetch(`${mooncakesApi}/cla/agree_with_repo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ repo })
    })
    location.reload()
  }

  return (
    <div>
      {checks.map((check, index) => {
        return (
          <div key={check.id} className={styles['check-input']}>
            <input
              type='checkbox'
              id={check.id}
              onChange={(e) => {
                setCheckStatus(
                  checkStatus.map((_, i) =>
                    i === index ? e.target.checked : _
                  )
                )
              }}
            />
            <label htmlFor={check.id}>{check.content}</label>
          </div>
        )
      })}
      <table>
        <tbody>
          <tr>
            <td>Full Name</td>
            <td>
              <code>{profile?.fullName ?? profile?.githubId}</code>
            </td>
          </tr>
          <tr>
            <td>Github ID</td>
            <td>
              <code>{profile?.githubId}</code>
            </td>
          </tr>
          <tr>
            <td>E-mail</td>
            <td>
              <code>{profile?.email}</code>
            </td>
          </tr>
        </tbody>
      </table>
      <button
        className='button button--outline button--primary'
        disabled={repo === 'core' || !canSign}
        onClick={handleSign}
      >
        {isSigning ? 'Signing...' : 'Sign CLA'}
      </button>
    </div>
  )
}

function ClientSignCla({ repo }: { repo: string }) {
  const {
    siteConfig: { customFields }
  } = useDocusaurusContext()
  const [sign, setSign] = useState<SignState>({ signed: false })
  const mooncakesApi = customFields?.MOONCAKES_API as string
  const clientId = customFields?.GITHUB_OAUTH_CLIENT_ID as string
  const accessToken = window.localStorage.getItem('access_token_with_time')
  const accessTokenWithTime = accessToken
    ? (JSON.parse(accessToken) as { access_token: string; time: number })
    : null
  const isSign =
    accessTokenWithTime === null ||
    Date.now() - accessTokenWithTime.time > 90 * 24 * 60 * 60 * 1000
  // Date.now() - accessTokenWithTime.time > 1000
  const redirectUrl = new URL(customFields?.HOST as string)
  redirectUrl.pathname = '/mooncakes/callback/github/cla'
  redirectUrl.searchParams.set('repo', repo)

  if (isSign) {
    return (
      <div>
        <p>You must sign in to MoonBit to accept the CLA.</p>

        <div className={styles['button-wrapper']}>
          <a
            className='button button--outline button--primary'
            href={`https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email&redirect_uri=${encodeURIComponent(
              redirectUrl.toString()
            )}`}
          >
            Sign in with Github
          </a>
        </div>
      </div>
    )
  } else {
    const { username } = jwtDecode<{ username: string }>(
      accessTokenWithTime.access_token
    )
    useEffect(() => {
      const checkIsSigned = async () => {
        const params = new URLSearchParams()
        params.set('gh_username', username)
        params.set('repo', repo)
        const res = await fetch(
          `${mooncakesApi}/cla/check_with_repo?${params}`,
          {
            method: 'GET',
            headers: {
              accept: 'application/json'
            }
          }
        )
        const json = (await res.json()) as SignState
        setSign(json)
      }
      checkIsSigned()
    }, [])
    return (
      <div>
        <p>
          Sign in as
          <a href={`https://github.com/${username}`}>
            {' '}
            <code>{username}</code>@github
          </a>
        </p>
        {!sign.signed ? (
          <SignForm
            accessToken={accessTokenWithTime.access_token}
            repo={repo}
          />
        ) : (
          <div>You have already signed at {sign.signed_time}</div>
        )}
      </div>
    )
  }
}

export default function SignCla({ repo }: { repo: string }) {
  return (
    <BrowserOnly fallback={<div>loading...</div>}>
      {() => <ClientSignCla repo={repo} />}
    </BrowserOnly>
  )
}
