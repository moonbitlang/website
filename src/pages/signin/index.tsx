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
import styles from './index.module.css'
import clsx from 'clsx'
import { useState } from 'react'
import FormInput, {
  validatePassword,
  validateUsername
} from '@site/src/components/FormInput'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Link from '@docusaurus/Link'
import {
  getSafeRedirectPath,
  saveMooncakesSession
} from '@site/src/lib/mooncakesAuth'

class LoginError extends Error {
  constructor(detail: string) {
    super(detail)
  }
}

type LoginResponse = {
  access_token: string
}

function isLoginResponse(value: unknown): value is LoginResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'access_token' in value &&
    typeof value.access_token === 'string' &&
    value.access_token !== ''
  )
}

async function getLoginErrorMessage(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as { detail?: unknown }
    if (typeof json.detail === 'string' && json.detail !== '') {
      return json.detail
    }
  } catch {
    // Fall through to the generic status message.
  }
  return `${res.status} ${res.statusText}`
}

function SignInForm() {
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState<string | undefined>(
    undefined
  )
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | undefined>(
    undefined
  )
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [signInEnable, setSignInEnable] = useState(true)
  const signInMessage = signInEnable ? 'Sign in' : 'Signing in...'
  const {
    siteConfig: { customFields }
  } = useDocusaurusContext()
  const mooncakesApi = customFields?.MOONCAKES_API as string
  return (
    <div className='card'>
      <div className='card__header'>
        <h2>Sign In</h2>
        <hr />
      </div>
      <div className='card__body'>
        <form
          noValidate={true}
          className={styles['form-wrapper']}
          onSubmit={async (e) => {
            e.preventDefault()
            if (!signInEnable) return
            setFormError(undefined)
            let isValidate = true
            if (username === '') {
              setUsernameError('Required')
              isValidate = false
            }
            if (password === '') {
              setPasswordError('Required')
              isValidate = false
            }
            if (!isValidate) return
            try {
              setSignInEnable(false)
              const params = new URLSearchParams()
              params.set('username', username)
              params.set('password', password)
              const res = await fetch(`${mooncakesApi}/login`, {
                method: 'POST',
                headers: {
                  accept: 'application/json',
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
              })
              if (!res.ok) {
                throw new LoginError(await getLoginErrorMessage(res))
              }
              const json = (await res.json()) as unknown
              if (!isLoginResponse(json)) {
                throw new LoginError('Sign in failed: missing access token')
              }
              saveMooncakesSession(json.access_token)
              window.location.assign(
                getSafeRedirectPath(window.location.search)
              )
            } catch (e) {
              if (e instanceof LoginError) {
                setPasswordError(e.message)
              } else if (e instanceof Error) {
                setFormError(e.message)
              } else {
                setFormError('Failed to sign in')
              }
            } finally {
              setSignInEnable(true)
            }
          }}
        >
          <FormInput
            type='text'
            spellCheck='false'
            title='Username'
            validate={validateUsername}
            value={username}
            setValue={setUsername}
            error={usernameError}
            setError={setUsernameError}
          />
          <FormInput
            type='password'
            title='Password'
            validate={validatePassword}
            value={password}
            setValue={setPassword}
            error={passwordError}
            setError={setPasswordError}
          />
          {formError !== undefined && (
            <p className={styles['form-error']}>{formError}</p>
          )}
          <input
            type='submit'
            disabled={!signInEnable}
            className={`button button--primary ${
              !signInEnable ? 'disabled' : ''
            }`}
            value={signInMessage}
          />
        </form>
      </div>
      <div className='card__footer'>
        <Link href='/signup'>Don't have an account? Sign up</Link>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Layout>
      <div className={'container container--fluid margin-vert--lg'}>
        <div className={clsx('row', styles['justify-center'])}>
          <div className='col col--4'>
            <SignInForm />
          </div>
        </div>
      </div>
    </Layout>
  )
}
