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
  VerificationCode,
  validateEmail,
  validatePassword,
  validateUsername
} from '@site/src/components/FormInput'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Link from '@docusaurus/Link'

class NoVerifyCode extends Error {
  constructor() {
    super()
  }
}

class UsernameAlreadyTaken extends Error {
  constructor() {
    super()
  }
}

class EmailAlreadyTaken extends Error {
  constructor() {
    super()
  }
}

class InvalidCode extends Error {
  constructor() {
    super()
  }
}

function SignUpForm() {
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState<string | undefined>(
    undefined
  )
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | undefined>(
    undefined
  )
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>(undefined)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | undefined>(undefined)
  const [signUpEnable, setSignUpEnable] = useState(true)
  const signUpMessage = 'Sign Up'
  const {
    siteConfig: { customFields }
  } = useDocusaurusContext()
  const mooncakesApi = customFields?.MOONCAKES_API as string
  return (
    <div className='card'>
      <div className='card__header'>
        <h2>Sign Up</h2>
        <hr />
      </div>
      <div className='card__body'>
        <form
          noValidate={true}
          className={styles['form-wrapper']}
          onSubmit={async (e) => {
            e.preventDefault()
            if (!signUpEnable) return
            let isValidate = true
            if (email === '') {
              setEmailError('Required')
              isValidate = false
            }
            if (code === '') {
              setCodeError('Required')
              isValidate = false
            }
            if (username === '') {
              setUsernameError('Required')
              isValidate = false
            }
            if (password === '') {
              setPasswordError('Required')
              isValidate = false
            }
            if (!isValidate) {
              return
            }
            try {
              const params = new URLSearchParams()
              params.set('username', username)
              params.set('email', email)
              params.set('password', password)
              params.set('code', code)
              setSignUpEnable(false)
              const res = await fetch(
                `${mooncakesApi}/signup_by_email?${params}`,
                {
                  method: 'POST',
                  headers: {
                    accept: 'application/json'
                  },
                  body: null
                }
              )
              if (!res.ok) {
                if (res.status === 400) {
                  const json = (await res.json()) as { detail: string }
                  if (json.detail === 'No verify code found') {
                    throw new NoVerifyCode()
                  }
                } else if (res.status === 409) {
                  const json = (await res.json()) as { detail: string }
                  if (json.detail === 'Username is already taken') {
                    throw new UsernameAlreadyTaken()
                  } else if (json.detail === 'Email address is already taken') {
                    throw new EmailAlreadyTaken()
                  }
                } else if (res.status === 403) {
                  const json = (await res.json()) as { detail: string }
                  if (json.detail === 'Invalid code') {
                    throw new InvalidCode()
                  }
                }
                throw new Error(`${res.status} ${res.statusText}`)
              }
            } catch (e) {
              if (e instanceof NoVerifyCode) {
                setCodeError('Please send verification code before sign up')
              } else if (e instanceof UsernameAlreadyTaken) {
                setUsernameError(`"${username}" has already been taken`)
              } else if (e instanceof EmailAlreadyTaken) {
                setEmailError(`${email} has already been registered`)
              } else if (e instanceof InvalidCode) {
                setCodeError('Invalid code')
              }
            } finally {
              setSignUpEnable(true)
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
          <FormInput
            type='text'
            spellCheck='false'
            title='Email'
            validate={validateEmail}
            value={email}
            setValue={setEmail}
            error={emailError}
            setError={setEmailError}
          />
          <VerificationCode
            type='text'
            spellCheck='false'
            title='Verification Code'
            validate={() => undefined}
            value={code}
            setValue={setCode}
            error={codeError}
            setError={setCodeError}
            email={email}
            emailError={emailError}
          />
          <input
            type='submit'
            className={`button button--primary ${
              !signUpEnable ? 'disabled' : ''
            }`}
            value={signUpMessage}
          />
        </form>
      </div>
      <div className='card__footer'>
        <Link href='/signin'>Already have an account? Sign in</Link>
      </div>
    </div>
  )
}

export default function SignUp() {
  return (
    <Layout>
      <div className={'container container--fluid margin-vert--lg'}>
        <div className={clsx('row', styles['justify-center'])}>
          <div className='col col--4'>
            <SignUpForm />
          </div>
        </div>
      </div>
    </Layout>
  )
}
