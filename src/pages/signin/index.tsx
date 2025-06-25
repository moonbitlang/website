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

class LoginError extends Error {
  detail: string
  constructor(detail: string) {
    super()
    this.detail = detail
  }
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
  const [signInEnable, setSignInEnable] = useState(true)
  const signInMessage = 'Sign in'
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
                if (res.status >= 400 && res.status < 500) {
                  const json = (await res.json()) as { detail: string }
                  throw new LoginError(json.detail)
                }
                throw new Error(`${res.status} ${res.statusText}`)
              }
              const json = (await res.json()) as { access_token: string }
              localStorage.setItem('mooncakes-access-token', json.access_token)
              localStorage.setItem('mooncakes-username', username)
            } catch (e) {
              if (e instanceof LoginError) {
                setPasswordError(e.detail)
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
          <input
            type='submit'
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
