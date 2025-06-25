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
import FormInput, {
  validateEmail,
  validatePassword,
  VerificationCode
} from '@site/src/components/FormInput'
import Layout from '@theme/Layout'
import styles from './index.module.css'
import { useState } from 'react'
import clsx from 'clsx'

function useMooncakesApi(): string {
  const {
    siteConfig: { customFields }
  } = useDocusaurusContext()
  const mooncakesApi = customFields?.MOONCAKES_API as string
  return mooncakesApi
}

function ResetPasswordForm() {
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState<string | undefined>(
    undefined
  )
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>(undefined)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | undefined>(undefined)
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordError, setNewPasswordError] = useState<string | undefined>(
    undefined
  )
  const [repeatPassword, setRepeatPassword] = useState('')
  const [repeatPasswordError, setRepeatPasswordError] = useState<
    string | undefined
  >(undefined)
  const [resetEnable, setResetEnable] = useState(true)
  const mooncakesApi = useMooncakesApi()
  return (
    <div className='card'>
      <div className='card__header'>
        <h2>Reset Password</h2>
        <hr />
      </div>
      <div className='card__body'>
        <form
          noValidate={true}
          className={styles['form-wrapper']}
          onSubmit={async (e) => {
            e.preventDefault()
            if (!resetEnable) return
            let isValidate = true
            if (username === '') {
              setUsernameError('Required')
              isValidate = false
            }
            if (email === '') {
              setEmailError('Required')
              isValidate = false
            }
            if (code === '') {
              setCodeError('Required')
              isValidate = false
            }
            if (newPassword === '') {
              setNewPasswordError('Required')
              isValidate = false
            }
            if (repeatPassword === '') {
              setRepeatPasswordError('Required')
              isValidate = false
            }
            if (!isValidate) {
              return
            }
            try {
              setResetEnable(false)
              const formdata = new FormData()

              formdata.set('email', email)
              formdata.set('code', code)
              formdata.set('username', username)
              formdata.set('password', newPassword)
              const res = await fetch(`${mooncakesApi}/reset_password`, {
                headers: {
                  accept: 'application/json'
                },
                body: formdata,
                method: 'POST'
              })
              if (!res.ok) {
                if (res.status === 422) {
                  setCodeError('Invalid verification code')
                  return
                }
                setCodeError('Failed to reset password')
                return
              }
            } finally {
              setResetEnable(true)
            }
          }}
        >
          <FormInput
            type='text'
            spellCheck='false'
            title='Username'
            validate={() => {
              return undefined
            }}
            value={username}
            setValue={setUsername}
            error={usernameError}
            setError={setUsernameError}
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

          <FormInput
            type='password'
            spellCheck='false'
            title='New Password'
            validate={validatePassword}
            value={newPassword}
            setValue={setNewPassword}
            error={newPasswordError}
            setError={setNewPasswordError}
          />
          <FormInput
            type='password'
            spellCheck='false'
            title='Repeat Password'
            validate={() => {
              if (newPassword !== repeatPassword) {
                return 'Passwords do not match'
              }
              return undefined
            }}
            value={repeatPassword}
            setValue={setRepeatPassword}
            error={repeatPasswordError}
            setError={setRepeatPasswordError}
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
              !resetEnable ? 'disabled' : ''
            }`}
            value='Reset Password'
          />
        </form>
      </div>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Layout>
      <div className='container container--fluid margin-vert--lg'>
        <div className={clsx('row', styles['justify-center'])}>
          <div className='col col--4'>
            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </Layout>
  )
}
